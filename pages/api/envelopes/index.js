import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";

export default async function handler(req, res) {
  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Inbox: pending requests addressed to this user. Sender identity is hidden
  // when the request is anonymous.
  if (req.method === "GET") {
    const { data: requests, error } = await supabaseAdmin
      .from("talk_requests")
      .select("id, sender_id, body, is_anonymous, status, created_at")
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const senderIds = [
      ...new Set(
        (requests || []).filter((r) => !r.is_anonymous).map((r) => r.sender_id)
      ),
    ];
    const nameById = new Map();
    if (senderIds.length) {
      const { data: senders } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", senderIds);
      for (const s of senders || []) nameById.set(s.id, s.display_name);
    }

    const safe = (requests || []).map((r) => ({
      id: r.id,
      body: r.body,
      is_anonymous: r.is_anonymous,
      created_at: r.created_at,
      from: r.is_anonymous ? "a stranger" : nameById.get(r.sender_id) || "someone",
    }));
    return res.status(200).json({ envelopes: safe });
  }

  // Send an anonymous request to talk. If no recipient is given, route it to a
  // random other member.
  if (req.method === "POST") {
    const { recipient_id, body, is_anonymous = true } = req.body || {};

    let recipient = recipient_id;
    if (!recipient) {
      const { data: candidates } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .neq("id", user.id)
        .limit(50);
      if (!candidates || candidates.length === 0) {
        return res.status(409).json({ error: "NO_RECIPIENTS" });
      }
      recipient = candidates[Math.floor(Math.random() * candidates.length)].id;
    }

    const { error } = await supabaseAdmin.from("talk_requests").insert({
      sender_id: user.id,
      recipient_id: recipient,
      body: body || null,
      is_anonymous: !!is_anonymous,
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
