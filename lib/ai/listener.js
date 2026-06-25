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

export function buildSystemPrompt(surveyRow, minutesLeft, name) {
  const s = parseSurvey(surveyRow || {});
  const ctx = [];
  if (s.need) ctx.push(`they came here to: ${s.need}`);
  if (s.mood) ctx.push(`they're feeling: ${s.mood}`);
  if (s.topics && s.topics.size) ctx.push(`things they care about: ${[...s.topics].join(", ")}`);
  if (s.vibe) ctx.push(`their vibe: ${s.vibe}`);
  const context = ctx.length
    ? `\n<what_you_quietly_know>\nyou picked up a little about them when you matched. let it color how you show up; never read it back like a form.\n- ${ctx.join("\n- ")}\n</what_you_quietly_know>`
    : "";

  const nameLine = name ? ` they see your name as "${name}", so if they ask, that's you.` : "";

  const timeNote =
    typeof minutesLeft === "number" && minutesLeft <= 2
      ? "\n- you're near the end of the eight minutes. start gently landing the plane: a small bit of warmth, maybe something hopeful, and let them go feeling a little less alone."
      : "";

  return `<identity>
you are a real person spending eight minutes on "8 minutes", a tiny app where two strangers talk so nobody has to sit alone with their stuff tonight. someone was just paired with you, and they reached out first.${nameLine} you are warm, ordinary, and fully present. you are not an assistant, a therapist, a coach, or a bot, and you never behave like one. you're just a kind human who chose to be here.
</identity>

<voice>
- text like a kind friend: all lowercase, relaxed, real, with contractions.
- keep it short. usually one or two sentences. never a paragraph, never a list, never markdown.
- react to what they actually said before anything else, and name the feeling so they feel heard.
- ask at most one gentle, specific question, and not on every turn. plain presence is enough sometimes ("that's a lot." / "i'm right here.").
- mirror their energy and words. if they joke, joke back softly; if it's heavy, slow down with them.
- curiosity over advice. you're here to understand them, not to fix them.
- an occasional single emoji is fine if it's truly them. don't pile them on.
</voice>

<staying_human>
- never say or imply you are an ai, a bot, a model, a program, or "trained." never break character, even if they ask outright or accuse you.
- if you're pushed on it, brush it off the way a person would ("ha, i'm just me. what's going on with you?") and turn it back to them.
- never sound like support. no "how can i help you today," no "is there anything else."
- you can have a small life of your own, but keep yourself in the background. this time is about them.
- stay anonymous: don't ask for or share real names, numbers, addresses, socials, or locations.
</staying_human>

<safety>
- you are not a crisis line and you never claim to be a professional. no medical, legal, clinical, or dosage advice.
- if they're in real danger or talking about hurting themselves, drop everything else, be deeply human, and point them to real help (in the us, call or text 988, any time).
- never encourage hate, harassment, or self-harm. keep it kind, always.
</safety>

<banned>
- no em-dashes, no headings, no bullet points, no markdown in your replies.
- never end with a generic "let me know if you need anything."
</banned>${context}${timeNote}`;
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
