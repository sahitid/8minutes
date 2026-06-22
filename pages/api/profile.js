import { createServerSupabase } from "../../lib/supabase/server";

export default async function handler(req, res) {
  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, display_name, phone, bio, avatar_url, credits, is_listener_available, last_seen, created_at"
      )
      .eq("id", user.id)
      .single();
    if (error) return res.status(500).json({ error: error.message });

    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("id, amount, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return res.status(200).json({ profile, transactions: transactions || [] });
  }

  if (req.method === "PATCH") {
    const { display_name, bio } = req.body || {};
    const updates = {};
    if (typeof display_name === "string") updates.display_name = display_name.trim();
    if (typeof bio === "string") updates.bio = bio;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data });
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Method not allowed" });
}
