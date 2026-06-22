'use client'
import Nav from "../../components/nav";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/dist/lenis-react";
import { useSupabase } from "../../lib/supabase/context";

const INK = "#1a1a1a";

function check_box(e, valChange) {
  const { value, checked } = e.target;
  valChange((prev) => {
    if (checked) {
      if (prev.length == 2) return prev;
      return [...prev, value];
    } else {
      return prev.filter((v) => v !== value);
    }
  });
}

const checkbox_vals = [
  { value: "Creativity", title: "Creativity & Arts" },
  { value: "Games", title: "Games & Entertainment" },
  { value: "Life", title: "Life & World Talk" },
  { value: "Deep", title: "Deep Conversations" },
  { value: "Fun", title: "Just For Fun" },
];

const convoTypes = [
  { value: "Laugh", title: "A Good Laugh" },
  { value: "Heard", title: "To Feel Heard" },
  { value: "Friend", title: "Make A New Friend" },
  { value: "Talk", title: "A Deep Talk" },
];

const moods = [
  { value: "Good", title: "Feeling Pretty Good" },
  { value: "Down", title: "Kinda Down" },
  { value: "Neutral", title: "Just Passing Time" },
  { value: "Anxious", title: "Anxious or Overwhelmed" },
];

const cardStyle = {
  display: "flex",
  flexDirection: "column",
  minHeight: "58vh",
  width: "100%",
  margin: "auto",
  maxWidth: 640,
  background: "#fff",
  border: `3px solid ${INK}`,
  borderRadius: "24px 18px 26px 16px",
  boxShadow: `6px 6px 0 ${INK}`,
  padding: 34,
};

const optionStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  border: `2.5px solid ${INK}`,
  borderRadius: 16,
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: 16,
  background: "#FBF8F3",
  boxShadow: `3px 3px 0 #FCE7C8`,
};

export default function Survey() {
  const lenis = useLenis();
  const { user, loading } = useSupabase();
  const router = useRouter();
  const [typeOfConversationVal, typeOfConversationChange] = useState("");
  const [moodVal, moodChange] = useState("");
  const [interestsVal, interestsChange] = useState([]);

  function change_func(val, func, next) {
    lenis?.scrollTo(next);
    func(val);
  }

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit_form() {
    setSubmitError("");
    if (!typeOfConversationVal) { lenis?.scrollTo("#first"); return; }
    if (!moodVal) { lenis?.scrollTo("#second"); return; }
    if (interestsVal.length !== 2) { lenis?.scrollTo("#third"); return; }

    setSubmitting(true);
    const surveyRes = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_type: typeOfConversationVal,
        mood: moodVal,
        interests: interestsVal,
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
    if (!loading && !user) {
      router.push("/login?redirect=/survey");
    }
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <ReactLenis root>
      <div className="doodle-page">
        <Nav />

        <main style={{ display: "flex", justifyContent: "center", padding: "8px 20px 60px" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: 700 }}>
            <h2 className="marker" style={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(26px,3.4vw,38px)", margin: "20px 0 8px" }}>
              one quick minute 🌷
            </h2>
            <p style={{ textAlign: "center", color: "#5a5a5a", margin: "0 0 24px", fontWeight: 700 }}>tell us what you need today</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8vh" }}>
              {/* Q1 */}
              <div id="first" style={{ ...cardStyle, transform: "rotate(-0.6deg)" }}>
                <h3 className="marker" style={{ fontSize: 22, margin: "0 0 16px" }}>1. type of conversation?</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flexGrow: 1, justifyContent: "center" }} onChange={(e) => change_func(e.target.value, typeOfConversationChange, "#second")}>
                  {convoTypes.map((o) => (
                    <label key={o.value} style={{ ...optionStyle, background: typeOfConversationVal === o.value ? "#FBD5D5" : "#FBF8F3" }}>
                      <input type="radio" value={o.value} name="convtype" defaultChecked={typeOfConversationVal === o.value} />
                      {o.title}
                    </label>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div id="second" style={{ ...cardStyle, transform: "rotate(0.6deg)", borderRadius: "18px 26px 16px 24px", boxShadow: `6px 6px 0 ${INK}` }}>
                <h3 className="marker" style={{ fontSize: 22, margin: "0 0 16px" }}>2. how are you feeling today?</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flexGrow: 1, justifyContent: "center" }} onChange={(e) => change_func(e.target.value, moodChange, "#third")}>
                  {moods.map((o) => (
                    <label key={o.value} style={{ ...optionStyle, background: moodVal === o.value ? "#D6E8D5" : "#FBF8F3", boxShadow: "3px 3px 0 #D6E8D5" }}>
                      <input type="radio" value={o.value} name="feeling" defaultChecked={moodVal === o.value} />
                      {o.title}
                    </label>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div id="third" style={{ ...cardStyle, transform: "rotate(-0.6deg)", borderRadius: "26px 16px 24px 18px" }}>
                <h3 className="marker" style={{ fontSize: 22, margin: "0 0 16px" }}>3. interests? <span style={{ fontSize: 15, color: "#5a5a5a" }}>(pick two)</span></h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flexGrow: 1, justifyContent: "center" }}>
                  {checkbox_vals.map(({ value, title }) => {
                    const on = interestsVal.includes(value);
                    const disabled = interestsVal.length == 2 && !on;
                    return (
                      <label key={title} style={{ ...optionStyle, background: on ? "#FCE7C8" : "#FBF8F3", opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                        <input type="checkbox" value={value} onChange={(e) => check_box(e, interestsChange)} checked={on} disabled={disabled} />
                        {title}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 40 }}>
              {submitError ? <p style={{ color: "#E58A8A", fontSize: 14.5, fontWeight: 700 }}>{submitError}</p> : null}
              <button disabled={submitting} className="doodle-btn" style={{ fontSize: 21, padding: "15px 30px" }} onClick={() => submit_form()}>
                {submitting ? "finding your listener..." : "find my listener →"}
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
