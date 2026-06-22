'use client'
import Nav from "../../components/nav";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/dist/lenis-react";
import { useSupabase } from "../../lib/supabase/context";

const INK = "#1a1a1a";

const SINGLE_QUESTIONS = [
  {
    id: "need",
    title: "1. what do you need right now?",
    fill: "#FBD5D5",
    options: [
      { value: "vent", label: "to vent" },
      { value: "heard", label: "to feel heard" },
      { value: "advice", label: "some advice" },
      { value: "laugh", label: "a good laugh" },
      { value: "distraction", label: "a distraction" },
      { value: "celebrate", label: "to celebrate a win" },
      { value: "deep", label: "a deep talk" },
      { value: "friend", label: "to make a friend" },
    ],
  },
  {
    id: "mood",
    title: "2. how are you feeling today?",
    fill: "#D6E8D5",
    options: [
      { value: "good", label: "pretty good" },
      { value: "excited", label: "excited" },
      { value: "neutral", label: "just okay" },
      { value: "tired", label: "tired" },
      { value: "low", label: "kinda low" },
      { value: "lonely", label: "lonely" },
      { value: "anxious", label: "anxious" },
      { value: "stressed", label: "stressed" },
    ],
  },
  {
    id: "vibe",
    title: "3. what's your vibe?",
    fill: "#FCE7C8",
    options: [
      { value: "chill", label: "chill & easy" },
      { value: "deep", label: "deep & thoughtful" },
      { value: "playful", label: "playful & silly" },
      { value: "supportive", label: "warm & supportive" },
    ],
  },
  {
    id: "pref",
    title: "4. right now, do you want to...",
    fill: "#FBD5D5",
    options: [
      { value: "talk", label: "mostly talk" },
      { value: "listen", label: "mostly listen" },
      { value: "either", label: "a bit of both" },
    ],
  },
  {
    id: "depth",
    title: "5. how heavy is it on you?",
    fill: "#D6E8D5",
    options: [
      { value: "light", label: "light & breezy" },
      { value: "medium", label: "somewhere in between" },
      { value: "heavy", label: "pretty heavy" },
    ],
  },
];

const TOPICS = [
  "life", "relationships", "work", "school", "creativity", "games",
  "music", "dreams", "mental health", "random", "pop culture", "sports",
];
const MAX_TOPICS = 3;

const cardBase = {
  width: "100%",
  maxWidth: 640,
  margin: "auto",
  background: "#fff",
  border: `3px solid ${INK}`,
  boxShadow: `6px 6px 0 ${INK}`,
  padding: 32,
};

function optionStyle(selected, fill) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    border: `2.5px solid ${INK}`,
    borderRadius: 14,
    padding: "11px 15px",
    fontWeight: 700,
    fontSize: 15.5,
    background: selected ? fill : "#FBF8F3",
    boxShadow: selected ? `1px 1px 0 ${INK}` : `3px 3px 0 ${fill}`,
    transform: selected ? "translate(2px,2px)" : "none",
    transition: "transform .1s ease, box-shadow .1s ease, background .1s ease",
  };
}

export default function Survey() {
  const lenis = useLenis();
  const { user, loading } = useSupabase();
  const router = useRouter();

  const [answers, setAnswers] = useState({
    need: "", mood: "", vibe: "", pref: "", depth: "", topics: [],
  });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function chooseSingle(id, value, nextIndex) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (nextIndex != null) lenis?.scrollTo(`#q${nextIndex}`);
  }

  function toggleTopic(topic) {
    setAnswers((prev) => {
      const has = prev.topics.includes(topic);
      if (has) return { ...prev, topics: prev.topics.filter((t) => t !== topic) };
      if (prev.topics.length >= MAX_TOPICS) return prev;
      return { ...prev, topics: [...prev.topics, topic] };
    });
  }

  async function submitForm() {
    setSubmitError("");
    for (let i = 0; i < SINGLE_QUESTIONS.length; i++) {
      if (!answers[SINGLE_QUESTIONS[i].id]) {
        lenis?.scrollTo(`#q${i}`);
        return;
      }
    }
    if (answers.topics.length === 0) {
      lenis?.scrollTo(`#q${SINGLE_QUESTIONS.length}`);
      return;
    }

    const interests = [
      ...answers.topics.map((t) => `topic:${t}`),
      `vibe:${answers.vibe}`,
      `pref:${answers.pref}`,
      `depth:${answers.depth}`,
    ];

    setSubmitting(true);
    const surveyRes = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_type: answers.need,
        mood: answers.mood,
        interests,
      }),
    });
    if (!surveyRes.ok) {
      setSubmitting(false);
      setSubmitError("could not save your answers, please try again");
      return;
    }

    const matchRes = await fetch("/api/match", { method: "POST" });
    const matchData = await matchRes.json().catch(() => ({}));
    setSubmitting(false);
    if (matchRes.status === 402) {
      setSubmitError("you need at least 1 credit to talk. earn one by listening!");
      return;
    }
    if (matchRes.status === 409) {
      setSubmitError("no listeners are online right now. try again in a moment 🌙");
      return;
    }
    if (!matchRes.ok || !matchData.conversation_id) {
      setSubmitError(matchData.error || "matching failed, please try again");
      return;
    }
    router.push(`/chat/${matchData.conversation_id}`);
  }

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/survey");
  }, [loading, user]);

  if (loading || !user) return null;

  const topicsIndex = SINGLE_QUESTIONS.length;
  const rotations = ["-0.6deg", "0.6deg", "-0.6deg", "0.6deg", "-0.6deg", "0.6deg"];

  return (
    <ReactLenis root>
      <div className="doodle-page">
        <Nav />

        <main style={{ display: "flex", justifyContent: "center", padding: "8px 20px 60px" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: 700 }}>
            <h2 className="marker" style={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(26px,3.4vw,38px)", margin: "20px 0 4px" }}>
              tell us about today 🌷
            </h2>
            <p style={{ textAlign: "center", color: "#5a5a5a", margin: "0 0 28px", fontWeight: 700 }}>
              a quick read so we can find the right person for you
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6vh" }}>
              {SINGLE_QUESTIONS.map((q, i) => (
                <div
                  key={q.id}
                  id={`q${i}`}
                  style={{ ...cardBase, borderRadius: i % 2 ? "18px 26px 16px 24px" : "24px 18px 26px 16px", transform: `rotate(${rotations[i]})` }}
                >
                  <h3 className="marker" style={{ fontSize: 21, margin: "0 0 16px" }}>{q.title}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: q.options.length > 4 ? "repeat(2, 1fr)" : "1fr", gap: 11 }}>
                    {q.options.map((o) => (
                      <label key={o.value} style={optionStyle(answers[q.id] === o.value, q.fill)}>
                        <input
                          type="radio"
                          name={q.id}
                          value={o.value}
                          checked={answers[q.id] === o.value}
                          onChange={() => chooseSingle(q.id, o.value, i + 1 <= SINGLE_QUESTIONS.length ? i + 1 : null)}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* topics multi-select */}
              <div id={`q${topicsIndex}`} style={{ ...cardBase, borderRadius: "26px 16px 24px 18px", transform: "rotate(-0.6deg)" }}>
                <h3 className="marker" style={{ fontSize: 21, margin: "0 0 6px" }}>
                  6. what do you want to talk about?
                </h3>
                <p style={{ color: "#5a5a5a", margin: "0 0 16px", fontSize: 14 }}>
                  pick up to {MAX_TOPICS} ({answers.topics.length}/{MAX_TOPICS})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {TOPICS.map((topic) => {
                    const on = answers.topics.includes(topic);
                    const disabled = !on && answers.topics.length >= MAX_TOPICS;
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        disabled={disabled}
                        style={{
                          cursor: disabled ? "not-allowed" : "pointer",
                          fontFamily: "'Nunito', sans-serif",
                          background: on ? "#FCE7C8" : "#fff",
                          border: `2.5px solid ${INK}`,
                          borderRadius: 30,
                          padding: "9px 16px",
                          fontWeight: 700,
                          fontSize: 14.5,
                          color: INK,
                          opacity: disabled ? 0.45 : 1,
                          boxShadow: on ? `1px 1px 0 ${INK}` : `3px 3px 0 #FCE7C8`,
                          transform: on ? "translate(2px,2px)" : "none",
                          transition: "transform .1s ease, box-shadow .1s ease",
                        }}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 40 }}>
              {submitError ? <p style={{ color: "#E58A8A", fontSize: 14.5, fontWeight: 700, textAlign: "center" }}>{submitError}</p> : null}
              <button disabled={submitting} className="doodle-btn" style={{ fontSize: 21, padding: "15px 30px" }} onClick={submitForm}>
                {submitting ? "finding your match..." : "find my match →"}
              </button>
            </div>
          </div>
        </main>

        <footer style={{ padding: "30px 0" }}>
          <p className="marker" style={{ textAlign: "center", fontSize: 16, color: "#5a5a5a" }}>made with 🖤</p>
        </footer>
      </div>
    </ReactLenis>
  );
}
