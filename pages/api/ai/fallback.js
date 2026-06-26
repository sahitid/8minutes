import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { AI_LISTENER_ID, casualize } from "../../../lib/ai/listener";

const HEARTBEAT_WINDOW_SECONDS = 90;

const OPENERS = [
  "hey :) i'm really glad you're here. how's your heart today?",
  "hi, glad you reached out. what's on your mind right now?",
  "hey, i'm here and i'm listening. how are you, really?",
  "hi there. no rush — what's been going on for you lately?",
  "hey, i'm so glad you showed up. what brought you here tonight?",
];

function pickOpener(seed) {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return OPENERS[h % OPENERS.length];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!AI_LISTENER_ID) {
    return res.status(503).json({ error: "AI listener not configured" });
  }

  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Humans first: if any real listener is online, don't bring in the AI — let
  // the talker keep waiting so two people get paired.
  const cutoff = new Date(Date.now() - HEARTBEAT_WINDOW_SECONDS * 1000).toISOString();
  const { count: onlineListeners } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_listener_available", true)
    .gte("last_seen", cutoff)
    .neq("id", user.id)
    .neq("id", AI_LISTENER_ID);
  if ((onlineListeners || 0) > 0) {
    return res.status(409).json({ error: "HUMAN_LISTENERS_AVAILABLE" });
  }

  // Claim the talker's own open envelope first (guarded), so we don't race a
  // human listener into a double match. recipient_id == sender_id is the
  // "unclaimed" sentinel used across the app.
  const { data: claimed } = await supabaseAdmin
    .from("talk_requests")
    .update({ status: "accepted", recipient_id: AI_LISTENER_ID })
    .eq("sender_id", user.id)
    .eq("recipient_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!claimed) {
    // Nothing open to claim — a human likely just took it, or there's no envelope.
    return res.status(409).json({ error: "NO_OPEN_ENVELOPE" });
  }

  // Create the conversation (debits the talker, bot becomes the listener).
  const { data: conversationId, error: matchError } = await supabaseAdmin.rpc(
    "app_create_match",
    { p_talker: user.id, p_listener: AI_LISTENER_ID }
  );

  if (matchError) {
    // Re-open the envelope so a human can still take it.
    await supabaseAdmin
      .from("talk_requests")
      .update({ status: "pending", recipient_id: user.id })
      .eq("id", claimed.id);
    if (matchError.message?.includes("INSUFFICIENT_CREDITS")) {
      return res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
    }
    return res.status(500).json({ error: matchError.message });
  }

  // Link the envelope to the conversation.
  await supabaseAdmin
    .from("talk_requests")
    .update({ conversation_id: conversationId })
    .eq("id", claimed.id);

  // Humans don't always text first. About half the time, seed a warm opener;
  // otherwise stay quiet and let the talker open the conversation.
  if (Math.random() < 0.5) {
    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: AI_LISTENER_ID,
      content: casualize(pickOpener(conversationId)),
    });
  }

  return res.status(200).json({ conversation_id: conversationId });
}
