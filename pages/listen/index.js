import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Nav from "../../components/nav";
import HeadObject from "../../components/head";
import { useSupabase } from "../../lib/supabase/context";

const INK = "#1a1a1a";

const NEED_LABEL = {
  vent: "needs to vent", heard: "wants to feel heard", advice: "wants advice",
  laugh: "wants a good laugh", distraction: "wants a distraction",
  celebrate: "wants to celebrate", deep: "wants a deep talk", friend: "wants a friend",
};
const MOOD_LABEL = {
  good: "feeling good", excited: "excited", neutral: "just okay", tired: "tired",
  low: "feeling low", lonely: "lonely", anxious: "anxious", stressed: "stressed",
};
const FILLS = ["#FBD5D5", "#D6E8D5", "#FCE7C8"];
const ROTS = ["-1deg", "1deg", "-0.6deg", "0.8deg"];

export default function Listen() {
  const router = useRouter();
  const { user, loading } = useSupabase();
  const [envelopes, setEnvelopes] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [opening, setOpening] = useState(null);
  const [error, setError] = useState("");
  const heartbeatRef = useRef(null);

  const heartbeat = useCallback(async (available) => {
    await fetch("/api/listener/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available }),
    }).catch(() => {});
  }, []);

  const loadBoard = useCallback(async () => {
    const res = await fetch("/api/requests");
    if (res.ok) {
      const data = await res.json();
      setEnvelopes(data.envelopes || []);
    }
    setLoadingBoard(false);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/listen");
  }, [loading, user, router]);

  // Mark online (so talkers see the listener count) + heartbeat while here.
  useEffect(() => {
    if (!user) return;
    heartbeat(true);
    heartbeatRef.current = setInterval(() => heartbeat(true), 30000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeat(false);
    };
  }, [user, heartbeat]);

  // Poll the board.
  useEffect(() => {
    if (!user) return;
    loadBoard();
    const interval = setInterval(loadBoard, 5000);
    return () => clearInterval(interval);
  }, [user, loadBoard]);

  async function openEnvelope(id) {
    setOpening(id);
    setError("");
    const res = await fetch(`/api/requests/${id}/accept`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.conversation_id) {
      router.push(`/chat/${data.conversation_id}`);
      return;
    }
    setOpening(null);
    if (res.status === 409 && data.error === "ALREADY_TAKEN") {
      setError("someone just opened that one. here are the rest 💌");
    } else if (res.status === 409 && data.error === "TALKER_OUT_OF_CREDITS") {
      setError("that person can't talk right now. try another envelope.");
    } else {
      setError(data.error || "couldn't open that envelope, try again");
    }
    loadBoard();
  }

  if (loading || !user) return null;

  return (
    <div className="doodle-page">
      <HeadObject />
      <Nav />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 40 }}>🎧</div>
          <h1 className="marker" style={{ fontWeight: 700, fontSize: "clamp(26px,3.4vw,38px)", margin: "4px 0 6px" }}>open an envelope</h1>
          <p style={{ color: "#5a5a5a", fontWeight: 700, margin: 0 }}>
            someone here would love to be heard. pick one and talk for 8 minutes, you&apos;ll earn a credit.
          </p>
        </div>

        {error ? (
          <p style={{ textAlign: "center", color: "#E58A8A", fontWeight: 700, marginTop: 16 }}>{error}</p>
        ) : null}

        {loadingBoard ? (
          <p style={{ textAlign: "center", color: "#5a5a5a", marginTop: 40, fontWeight: 700 }}>peeking at the mailbox...</p>
        ) : envelopes.length === 0 ? (
          <div className="doodle-card" style={{ maxWidth: 460, margin: "40px auto 0", textAlign: "center", padding: 36 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>📭</div>
            <h2 className="marker" style={{ fontSize: 22, margin: "0 0 6px" }}>the mailbox is empty</h2>
            <p style={{ fontSize: 14.5, color: "#5a5a5a", margin: 0 }}>
              no one&apos;s waiting to talk this second. stay on this page, you&apos;re marked as listening and new envelopes will pop in here.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18, marginTop: 24 }}>
            {envelopes.map((env, i) => (
              <div key={env.id} style={{ background: FILLS[i % FILLS.length], border: `3px solid ${INK}`, borderRadius: "22px 18px 24px 16px", boxShadow: `6px 6px 0 ${INK}`, padding: 22, transform: `rotate(${ROTS[i % ROTS.length]})`, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>✉️</span>
                  <div>
                    <p className="marker" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{env.from}</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: "#5a5a5a", fontWeight: 700 }}>
                      {NEED_LABEL[env.need] || "wants to talk"}
                      {env.mood ? ` · ${MOOD_LABEL[env.mood] || env.mood}` : ""}
                    </p>
                  </div>
                </div>

                {env.note ? (
                  <p style={{ margin: 0, fontSize: 14, fontStyle: "italic", color: "#2a2a2a" }}>&ldquo;{env.note}&rdquo;</p>
                ) : null}

                {env.topics && env.topics.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {env.topics.map((t) => (
                      <span key={t} style={{ background: "#fff", border: `2px solid ${INK}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{t}</span>
                    ))}
                  </div>
                ) : null}

                <button
                  onClick={() => openEnvelope(env.id)}
                  disabled={opening === env.id}
                  className="doodle-btn"
                  style={{ marginTop: "auto", width: "100%", background: "#fff" }}
                >
                  {opening === env.id ? "opening..." : "talk for 8 min →"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
