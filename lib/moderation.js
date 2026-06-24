// Shared conversation guardrails for 8 Minutes.
//
// This runs on the client and gives people gentle, instant feedback before a
// message is ever sent, front-running the database `flag_message` trigger.
// The goal isn't to police venting (that's the whole point of the app) — it's
// to keep the room safe: no hate, no threats, no self-harm encouragement, and
// no sharing of personal info (house rule: stay anonymous).

// Hate, threats, and self-harm encouragement. These are always blocked and
// count as a "strike" — repeat offenders get removed from the chat.
const SEVERE = [
  "kys",
  "kill yourself",
  "kill urself",
  "kill ur self",
  "neck yourself",
  "go die",
  "hope you die",
  "kill you",
  "i'll kill",
  "i will kill",
  "retard",
  "faggot",
  "nigger",
  "nigga",
  "tranny",
  "go to hell",
  "fuck you",
  "fuck u",
];

// Casual profanity. Blocked (people "shouldn't be able to say bad words") but
// with a soft nudge — it does NOT count as a strike, since slips happen.
const PROFANITY = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "cunt",
  "bastard",
  "slut",
  "whore",
];

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function hasTerm(text, term) {
  // Leading word boundary so "fuck" also catches "fucking", "shitty", etc.,
  // but we don't match inside unrelated words.
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text);
}

/**
 * Inspect a draft message against the house rules.
 * @param {string} raw
 * @returns {{ ok: boolean, severity?: "severe"|"warn"|"info", message?: string }}
 */
export function checkMessage(raw) {
  const text = (raw || "").toString();
  const lower = text.toLowerCase();

  for (const term of SEVERE) {
    if (lower.includes(term)) {
      return {
        ok: false,
        severity: "severe",
        message:
          "that breaks a house rule — no hate, threats, or harmful talk here. let's keep it kind 🌷",
      };
    }
  }

  const digits = (text.match(/\d/g) || []).length;
  if (digits >= 7 || EMAIL.test(text)) {
    return {
      ok: false,
      severity: "info",
      message: "stay anonymous — no phone numbers, emails, or addresses 🔒",
    };
  }

  for (const term of PROFANITY) {
    if (hasTerm(text, term)) {
      return {
        ok: false,
        severity: "warn",
        message: "let's keep the language gentle — try saying that another way 💛",
      };
    }
  }

  return { ok: true };
}

// Number of severe violations before we end the conversation automatically.
export const STRIKE_LIMIT = 3;
