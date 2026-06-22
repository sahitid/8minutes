// Pairing algorithm for 8 Minutes.
//
// Survey answers are stored within the existing `survey_responses` columns:
//   - conversation_type : what the person needs right now (single)
//   - mood              : how they're feeling (single)
//   - interests         : a tagged string array carrying the richer answers,
//                         e.g. ["topic:music", "topic:life", "vibe:chill",
//                               "pref:listen", "depth:light"]
//
// Plain (untagged) interest strings are treated as topics for backwards
// compatibility with earlier surveys.

const STRUGGLING = new Set(["low", "anxious", "lonely", "stressed", "tired"]);
const STEADY = new Set(["good", "excited", "neutral"]);
const DEPTH_ORDER = { light: 0, medium: 1, heavy: 2 };

function parseSurvey(row) {
  const tags = (row && row.interests) || [];
  const topics = new Set();
  let vibe = null;
  let pref = null;
  let depth = null;

  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    if (tag.startsWith("topic:")) topics.add(tag.slice(6));
    else if (tag.startsWith("vibe:")) vibe = tag.slice(5);
    else if (tag.startsWith("pref:")) pref = tag.slice(5);
    else if (tag.startsWith("depth:")) depth = tag.slice(6);
    else topics.add(tag); // legacy plain interest
  }

  return {
    need: (row && row.conversation_type) || null,
    mood: (row && row.mood) || null,
    topics,
    vibe,
    pref,
    depth,
  };
}

// Higher is a better pairing. Returns a non-negative-ish integer score.
function scoreListener(talkerRow, listenerRow) {
  const t = parseSurvey(talkerRow);
  const l = parseSurvey(listenerRow);
  let score = 0;

  // Shared topics are the strongest signal.
  for (const topic of t.topics) {
    if (l.topics.has(topic)) score += 3;
  }

  // Matching energy/vibe.
  if (t.vibe && t.vibe === l.vibe) score += 2;

  // Similar emotional depth is comfortable; far apart is jarring.
  if (t.depth && l.depth) {
    const distance = Math.abs(
      (DEPTH_ORDER[t.depth] ?? 1) - (DEPTH_ORDER[l.depth] ?? 1)
    );
    score += distance === 0 ? 2 : distance === 1 ? 1 : 0;
  }

  // The match should be someone happy to listen.
  if (l.pref === "listen" || l.pref === "either") score += 2;
  else if (l.pref === "talk") score -= 1;

  // A steady listener is a good anchor for someone who's struggling.
  if (STRUGGLING.has(t.mood) && STEADY.has(l.mood)) score += 2;
  else if (STRUGGLING.has(t.mood) && STRUGGLING.has(l.mood)) score += 1;

  // Needs that are about being heard pair well with willing listeners.
  if (
    (t.need === "vent" || t.need === "heard" || t.need === "advice") &&
    (l.pref === "listen" || l.pref === "either")
  ) {
    score += 1;
  }

  return score;
}

// Pick the best listener for a talker. `listeners` is an array of
// { id, survey } objects. Ties are broken randomly so the same person isn't
// always chosen. Returns the winning listener object (or null).
function pickBestListener(talkerSurvey, listeners) {
  let best = null;
  let bestScore = -Infinity;
  for (const listener of listeners) {
    const score = scoreListener(talkerSurvey, listener.survey);
    const jitter = Math.random() * 0.5;
    if (score + jitter > bestScore) {
      bestScore = score + jitter;
      best = listener;
    }
  }
  return best;
}

module.exports = { scoreListener, parseSurvey, pickBestListener, STRUGGLING, STEADY };
