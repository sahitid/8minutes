import { createServerSupabase } from "../../../lib/supabase/server";

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

  const { available } = req.body || {};
  const updates = {
    is_listener_available: !!available,
    last_seen: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("is_listener_available, last_seen")
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json(data);
}
