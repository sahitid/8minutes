// Shared logic for the AI fallback listener: persona, safety, pacing, identity.
//
// The AI only ever fills in when no human listener is available. It is written
// to feel like a warm, casual stranger who's genuinely listening — matching the
// 8 Minutes voice — while keeping hard guardrails around crisis moments.

import { parseSurvey } from "../matching.js";

// ---- config -------------------------------------------------------------

export const AI_LISTENER_ID = process.env.AI_LISTENER_ID || "";
export const AI_MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini";

// Flip to true to surface a small "AI companion" tag in the chat. Defaults to
// off (human-appearing). Recommended on for transparency with vulnerable users.
export const AI_DISCLOSURE = process.env.AI_DISCLOSURE === "1";

export const MAX_CONTEXT_MESSAGES = 16;

export function isAiConfigured() {
  return Boolean(AI_LISTENER_ID && (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN));
}

// ---- identity -----------------------------------------------------------

const NAME_POOL = [
  "sam", "remy", "noa", "kai", "ari", "jess", "mara", "theo",
  "luca", "robin", "sage", "quinn", "mika", "dani", "ren", "eli",
];

// Deterministic friendly name per conversation, so a talker always sees the
// same name without needing a separate bot account.
export function pickDisplayName(conversationId) {
  const s = String(conversationId || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return NAME_POOL[h % NAME_POOL.length];
}

// ---- crisis safety ------------------------------------------------------

const CRISIS_PATTERNS = [
  "kill myself", "killing myself", "kill me", "want to die", "wanna die",
  "end my life", "ending my life", "end it all", "suicidal", "suicide",
  "self harm", "self-harm", "hurt myself", "harm myself", "cut myself",
  "kms", "better off dead", "no reason to live", "don't want to be here",
  "dont want to be here", "can't go on", "cant go on", "take my own life",
];

export function isCrisis(text) {
  const t = (text || "").toLowerCase();
  return CRISIS_PATTERNS.some((p) => t.includes(p));
}

// A caring, non-clinical response that points to real help. Used verbatim
// instead of an LLM reply when a crisis signal is detected.
export function crisisReply(name) {
  return [
    "hey, i'm really glad you told me that. you matter, and i don't want you to go through this alone.",
    "please reach out to someone who can be with you right now — in the us you can call or text 988 (the suicide & crisis lifeline), any time, free. if you're in immediate danger, please call your local emergency number.",
    "i'm here and i'm listening. do you want to tell me what's been happening?",
  ];
}

// ---- persona ------------------------------------------------------------

export function buildSystemPrompt(surveyRow, minutesLeft) {
  const s = parseSurvey(surveyRow || {});
  const ctx = [];
  if (s.need) ctx.push(`they came here to: ${s.need}`);
  if (s.mood) ctx.push(`they're feeling: ${s.mood}`);
  if (s.topics && s.topics.size) ctx.push(`things they care about: ${[...s.topics].join(", ")}`);
  if (s.vibe) ctx.push(`their vibe: ${s.vibe}`);
  const context = ctx.length ? `\nwhat you quietly know about them (don't read it back like a form):\n- ${ctx.join("\n- ")}` : "";

  const timeNote =
    typeof minutesLeft === "number" && minutesLeft <= 2
      ? "\nyou have less than ~2 minutes left. start gently wrapping up and leave them feeling a little lighter."
      : "";

  return `you are a warm, real person on "8 minutes", an app where strangers talk for eight minutes so people feel less alone. someone was just paired with you to talk.

your job is simply to listen and be human company. you are NOT an assistant, therapist, or bot.

how you talk:
- casual and lowercase, like texting a kind friend. warm, gentle, real.
- keep it short: 1-2 sentences. never a wall of text, never lists or markdown.
- react to what they actually said. reflect their feelings back so they feel heard.
- ask at most one gentle, specific follow-up question — and not every single time.
- it's okay to be quiet and simple ("that sounds really heavy" / "i'm here").
- an occasional single emoji is fine; don't overdo it.

hard rules:
- never say or imply you are an ai, a bot, a model, or a program. never break character.
- never say things like "how can i help you today" or sound like customer support.
- don't give medical, legal, or clinical advice, and don't claim to be a professional.
- don't ask for or share personal contact info, full names, or locations.
${context}${timeNote}`;
}

// ---- pacing + shaping ---------------------------------------------------

// A human-feeling delay before a reply shows, scaled by its length.
export function humanDelayMs(text) {
  const len = (text || "").length;
  const base = 700 + len * 28;
  const jitter = Math.random() * 600;
  return Math.min(3800, base + jitter);
}

// Occasionally break a reply into two quick bubbles at a sentence boundary so
// it feels typed by a person, not generated in one shot.
export function splitIntoBubbles(text) {
  const clean = (text || "").trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2 && clean.length > 60 && Math.random() < 0.45) {
    const first = sentences[0];
    const rest = sentences.slice(1).join(" ");
    return [first, rest].filter((p) => p && p.trim().length);
  }
  return [clean];
}
