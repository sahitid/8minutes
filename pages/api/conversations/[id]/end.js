import { createServerSupabase } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

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

  const { id } = req.query;
  const { error } = await supabaseAdmin.rpc("app_end_conversation", {
    p_conversation: id,
    p_user: user.id,
  });
  if (error) {
    if (error.message?.includes("FORBIDDEN"))
      return res.status(403).json({ error: "Forbidden" });
    if (error.message?.includes("NOT_FOUND"))
      return res.status(404).json({ error: "Not found" });
    return res.status(500).json({ error: error.message });
  }

  // Conversations are ephemeral: wipe the messages once the session ends.
  await supabaseAdmin.from("messages").delete().eq("conversation_id", id);

  return res.status(200).json({ ok: true });
}
