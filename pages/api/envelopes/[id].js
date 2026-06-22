import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  const { action } = req.body || {};
  if (!["accept", "decline"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  const { data: request, error: fetchError } = await supabaseAdmin
    .from("talk_requests")
    .select("id, sender_id, recipient_id, status")
    .eq("id", id)
    .single();
  if (fetchError || !request)
    return res.status(404).json({ error: "Not found" });
  if (request.recipient_id !== user.id)
    return res.status(403).json({ error: "Forbidden" });
  if (request.status !== "pending")
    return res.status(409).json({ error: "Already handled" });

  if (action === "decline") {
    await supabaseAdmin
      .from("talk_requests")
      .update({ status: "declined" })
      .eq("id", id);
    return res.status(200).json({ ok: true });
  }

  // Accept: open an active conversation. The original sender is the talker;
  // the recipient who accepted is the listener.
  const { data: conv, error: convError } = await supabaseAdmin
    .from("conversations")
    .insert({
      talker_id: request.sender_id,
      listener_id: request.recipient_id,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (convError) return res.status(500).json({ error: convError.message });

  await supabaseAdmin
    .from("talk_requests")
    .update({ status: "accepted", conversation_id: conv.id })
    .eq("id", id);

  return res.status(200).json({ ok: true, conversation_id: conv.id });
}
