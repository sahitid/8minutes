import { generateText, gateway } from "ai";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { checkMessage } from "../../../lib/moderation";
import {
  AI_LISTENER_ID,
  AI_MODEL,
  MAX_CONTEXT_MESSAGES,
  buildSystemPrompt,
  isCrisis,
  crisisReply,
  humanDelayMs,
  splitIntoBubbles,
  pickDisplayName,
} from "../../../lib/ai/listener";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function insertBubble(conversationId, content) {
  await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: AI_LISTENER_ID,
    content,
  });
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

  const { conversation_id } = req.body || {};
  if (!conversation_id) return res.status(400).json({ error: "Missing conversation_id" });

  // Must be the talker in an active AI conversation.
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, talker_id, listener_id, status, started_at, duration_seconds")
    .eq("id", conversation_id)
    .maybeSingle();
  if (!conv) return res.status(404).json({ error: "Not found" });
  if (conv.talker_id !== user.id || conv.listener_id !== AI_LISTENER_ID) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (conv.status !== "active") return res.status(200).json({ ok: false, reason: "ended" });

  // Recent context, oldest first.
  const { data: recent } = await supabaseAdmin
    .from("messages")
    .select("sender_id, content, created_at")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: false })
    .limit(MAX_CONTEXT_MESSAGES);
  const history = (recent || []).slice().reverse();

  // Only respond when the latest message is from the talker (avoids the AI
  // replying to itself / double-posting on stale calls).
  const last = history[history.length - 1];
  if (!last || last.sender_id !== conv.talker_id) {
    return res.status(200).json({ ok: false, reason: "nothing-to-answer" });
  }

  // Crisis path: skip the LLM, respond with care + resources verbatim.
  if (isCrisis(last.content)) {
    for (const line of crisisReply()) {
      await sleep(900);
      await insertBubble(conversation_id, line);
    }
    return res.status(200).json({ ok: true, crisis: true });
  }

  // Minutes left, for gentle wrap-up near the end.
  const started = conv.started_at ? new Date(conv.started_at).getTime() : Date.now();
  const total = conv.duration_seconds || 480;
  const minutesLeft = (total - (Date.now() - started) / 1000) / 60;

  // Talker's latest survey for tailoring.
  const { data: survey } = await supabaseAdmin
    .from("survey_responses")
    .select("*")
    .eq("user_id", conv.talker_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const messages = history.map((m) => ({
    role: m.sender_id === conv.talker_id ? "user" : "assistant",
    content: String(m.content || "").slice(0, 1000),
  }));

  let reply = "";
  try {
    const out = await generateText({
      model: gateway(AI_MODEL),
      system: buildSystemPrompt(survey, minutesLeft, pickDisplayName(conversation_id)),
      messages,
      temperature: 0.85,
      maxOutputTokens: 160,
    });
    reply = (out.text || "").trim();
  } catch (e) {
    // Stay human on failure rather than going silent.
    reply = "sorry, i drifted for a sec there — what were you saying?";
  }

  // Strip wrapping quotes the model sometimes adds.
  reply = reply.replace(/^["']|["']$/g, "").trim();

  // Safety net: never let the AI emit blocked content.
  const verdict = checkMessage(reply);
  if (!reply || (verdict && !verdict.ok && verdict.severity === "severe")) {
    reply = "i'm here with you. tell me more?";
  }

  const bubbles = splitIntoBubbles(reply);
  await sleep(humanDelayMs(bubbles[0]));
  await insertBubble(conversation_id, bubbles[0]);
  for (let i = 1; i < bubbles.length; i++) {
    await sleep(Math.min(1800, 500 + bubbles[i].length * 18));
    await insertBubble(conversation_id, bubbles[i]);
  }

  return res.status(200).json({ ok: true });
}
