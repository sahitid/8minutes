import { createServerSupabase } from "../../lib/supabase/server";
import { supabaseAdmin } from "../../lib/supabase/admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { conversation_id, reason } = req.body || {};

  let flaggedCount = 0;
  let ended = false;

  if (conversation_id) {
    // Only a participant may report a conversation.
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("id, talker_id, listener_id, status")
      .eq("id", conversation_id)
      .maybeSingle();
    if (!conv || (conv.talker_id !== user.id && conv.listener_id !== user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Capture how many messages tripped the moderation filter so the report
    // carries signal even after the (ephemeral) messages are wiped.
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversation_id)
      .eq("flagged", true);
    flaggedCount = count || 0;

    // A report immediately and safely ends the chat for the reporter.
    if (conv.status !== "ended") {
      await supabaseAdmin
        .from("conversations")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", conversation_id);
      ended = true;
    }
  }

  const detail =
    flaggedCount > 0
      ? `${reason || "user_reported"} (+${flaggedCount} auto-flagged)`
      : reason || "user_reported";

  const { error } = await supabaseAdmin.from("reports").insert({
    conversation_id: conversation_id || null,
    reporter_id: user.id,
    reason: detail,
  });
  if (error) return res.status(500).json({ error: error.message });

  // Conversations are ephemeral: wipe the messages once the room is closed.
  if (ended) {
    await supabaseAdmin.from("messages").delete().eq("conversation_id", conversation_id);
  }

  return res.status(200).json({ ok: true, ended, flagged: flaggedCount });
}
