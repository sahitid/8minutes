import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";

const HEARTBEAT_WINDOW_SECONDS = 90;

export default async function handler(req, res) {
  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Talker waiting screen: latest envelope status + how many people are listening.
  if (req.method === "GET") {
    const { data: request } = await supabaseAdmin
      .from("talk_requests")
      .select("id, status, conversation_id, recipient_id, sender_id, created_at")
      .eq("sender_id", user.id)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cutoff = new Date(
      Date.now() - HEARTBEAT_WINDOW_SECONDS * 1000
    ).toISOString();
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_listener_available", true)
      .gte("last_seen", cutoff)
      .neq("id", user.id);

    return res.status(200).json({
      request: request
        ? {
            id: request.id,
            status: request.status,
            conversation_id: request.conversation_id,
          }
        : null,
      listeners_online: count || 0,
    });
  }

  // Cancel the open envelope.
  if (req.method === "DELETE") {
    await supabaseAdmin
      .from("talk_requests")
      .update({ status: "declined" })
      .eq("sender_id", user.id)
      .eq("recipient_id", user.id)
      .eq("status", "pending");
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
