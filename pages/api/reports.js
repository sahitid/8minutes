import { createServerSupabase } from "../../lib/supabase/server";

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
  const { error } = await supabase.from("reports").insert({
    conversation_id: conversation_id || null,
    reporter_id: user.id,
    reason: reason || "unspecified",
  });
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
