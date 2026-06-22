import { createServerSupabase } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  const { data: conv, error } = await supabaseAdmin
    .from("conversations")
    .select(
      "id, talker_id, listener_id, status, started_at, ended_at, duration_seconds"
    )
    .eq("id", id)
    .single();
  if (error || !conv) return res.status(404).json({ error: "Not found" });

  if (conv.talker_id !== user.id && conv.listener_id !== user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const role = conv.talker_id === user.id ? "talker" : "listener";
  const partnerId = role === "talker" ? conv.listener_id : conv.talker_id;
  const { data: partner } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("id", partnerId)
    .single();

  return res.status(200).json({
    conversation: conv,
    role,
    partner_display_name: partner?.display_name || "your match",
  });
}
