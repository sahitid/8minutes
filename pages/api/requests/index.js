import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { parseSurvey } from "../../../lib/matching";

// Open board requests are stored in talk_requests with recipient_id == sender_id
// as a sentinel meaning "not yet claimed by a listener". When a listener opens
// the envelope, recipient_id is set to the listener and status -> accepted.

async function snapshotFor(userId) {
  const { data: survey } = await supabaseAdmin
    .from("survey_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const parsed = parseSurvey(survey || {});
  return {
    need: survey?.conversation_type || null,
    mood: survey?.mood || null,
    vibe: parsed.vibe,
    topics: [...parsed.topics],
  };
}

export default async function handler(req, res) {
  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Listener board: every open, unclaimed envelope (except your own).
  if (req.method === "GET") {
    const { data: requests, error } = await supabaseAdmin
      .from("talk_requests")
      .select("id, sender_id, recipient_id, body, is_anonymous, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    const open = (requests || []).filter(
      (r) => r.recipient_id === r.sender_id && r.sender_id !== user.id
    );

    const envelopes = [];
    for (const r of open) {
      const snap = await snapshotFor(r.sender_id);
      let from = "a stranger";
      if (!r.is_anonymous) {
        const { data: p } = await supabaseAdmin
          .from("profiles")
          .select("display_name")
          .eq("id", r.sender_id)
          .single();
        from = p?.display_name || "someone";
      }
      envelopes.push({
        id: r.id,
        from,
        note: r.body || null,
        created_at: r.created_at,
        ...snap,
      });
    }
    return res.status(200).json({ envelopes });
  }

  // Talker drops an envelope into the board.
  if (req.method === "POST") {
    const { is_anonymous = true, note = null } = req.body || {};

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    if (!profile || profile.credits < 1) {
      return res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
    }

    // Supersede any earlier open envelope from this person.
    await supabaseAdmin
      .from("talk_requests")
      .update({ status: "declined" })
      .eq("sender_id", user.id)
      .eq("recipient_id", user.id)
      .eq("status", "pending");

    const { data: inserted, error } = await supabaseAdmin
      .from("talk_requests")
      .insert({
        sender_id: user.id,
        recipient_id: user.id, // sentinel: open / unclaimed
        body: note,
        is_anonymous: !!is_anonymous,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ request_id: inserted.id });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
