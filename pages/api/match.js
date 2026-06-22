import { createServerSupabase } from "../../lib/supabase/server";
import { supabaseAdmin } from "../../lib/supabase/admin";
import { pickBestListener } from "../../lib/matching";

const HEARTBEAT_WINDOW_SECONDS = 90;

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

  // Credit gate.
  const { data: talkerProfile } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();
  if (!talkerProfile || talkerProfile.credits < 1) {
    return res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
  }

  // Talker's latest survey for scoring.
  const { data: talkerSurvey } = await supabaseAdmin
    .from("survey_responses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Available listeners with a recent heartbeat (excluding self).
  const cutoff = new Date(
    Date.now() - HEARTBEAT_WINDOW_SECONDS * 1000
  ).toISOString();
  const { data: listeners, error: listenerError } = await supabaseAdmin
    .from("profiles")
    .select("id, last_seen")
    .eq("is_listener_available", true)
    .gte("last_seen", cutoff)
    .neq("id", user.id);
  if (listenerError)
    return res.status(500).json({ error: listenerError.message });
  if (!listeners || listeners.length === 0) {
    return res.status(409).json({ error: "NO_LISTENERS_AVAILABLE" });
  }

  // Pull each listener's latest survey for compatibility scoring.
  const ids = listeners.map((l) => l.id);
  const { data: listenerSurveys } = await supabaseAdmin
    .from("survey_responses")
    .select("*")
    .in("user_id", ids)
    .order("created_at", { ascending: false });

  const latestByUser = new Map();
  for (const s of listenerSurveys || []) {
    if (!latestByUser.has(s.user_id)) latestByUser.set(s.user_id, s);
  }

  const candidates = listeners.map((l) => ({
    id: l.id,
    survey: latestByUser.get(l.id) || null,
  }));

  const best = pickBestListener(talkerSurvey, candidates);
  if (!best) return res.status(409).json({ error: "NO_LISTENERS_AVAILABLE" });

  // Atomically create the match (re-checks credit, debits, dequeues listener).
  const { data: conversationId, error: matchError } = await supabaseAdmin.rpc(
    "app_create_match",
    { p_talker: user.id, p_listener: best.id }
  );
  if (matchError) {
    if (matchError.message?.includes("INSUFFICIENT_CREDITS")) {
      return res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
    }
    return res.status(500).json({ error: matchError.message });
  }

  return res.status(200).json({ conversation_id: conversationId });
}
