import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Nav from "../../components/nav";
import HeadObject from "../../components/head";
import { useSupabase } from "../../lib/supabase/context";

const INK = "#1a1a1a";

function reasonLabel(reason) {
  switch (reason) {
    case "spent_on_conversation":
      return "talked for 8 minutes";
    case "earned_listening":
      return "listened for 8 minutes";
    default:
      return reason.replace(/_/g, " ");
  }
}

export default function Account() {
  const router = useRouter();
  const { user, loading } = useSupabase();

  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (!res.ok) return;
    const data = await res.json();
    setProfile(data.profile);
    setTransactions(data.transactions || []);
    setDisplayName(data.profile?.display_name || "");
    setBio(data.profile?.bio || "");
  }, []);

  const loadEnvelopes = useCallback(async () => {
    const res = await fetch("/api/envelopes");
    if (!res.ok) return;
    const data = await res.json();
    setEnvelopes(data.envelopes || []);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/account");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadEnvelopes();
    }
  }, [user, loadProfile, loadEnvelopes]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName, bio }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      loadProfile();
    }
  }

  async function respondEnvelope(id, action) {
    const res = await fetch(`/api/envelopes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && action === "accept" && data.conversation_id) {
      router.push(`/chat/${data.conversation_id}`);
      return;
    }
    loadEnvelopes();
  }

  async function sendAnonRequest() {
    await fetch("/api/envelopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "someone would like to talk with you 💌" }),
    });
  }

  if (loading || !user) return null;

  const sectionStyle = { padding: 26, marginBottom: 22 };

  return (
    <div className="doodle-page">
      <HeadObject />
      <Nav />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 60px" }}>
        {/* credits + actions */}
        <section className="doodle-card" style={{ ...sectionStyle, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, background: "#FCE7C8", transform: "rotate(-0.5deg)" }}>
          <div>
            <p style={{ fontSize: 14, color: "#5a5a5a", margin: 0, fontWeight: 700 }}>your credits</p>
            <p className="marker" style={{ fontSize: 56, color: "#E58A8A", margin: "2px 0", lineHeight: 1 }}>{profile ? profile.credits : "··"}</p>
            <p style={{ fontSize: 12.5, color: "#5a5a5a", margin: 0 }}>1 credit = 8 minutes of talking</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/survey" className="doodle-btn">talk (1 credit)</Link>
            <Link href="/listen" className="doodle-btn doodle-btn-outline">listen (earn credit)</Link>
          </div>
        </section>

        {/* envelopes */}
        <section className="doodle-card" style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <h2 className="marker" style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>your envelopes 💌</h2>
            <button onClick={sendAnonRequest} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, color: "#E58A8A" }}>
              + send an anonymous request
            </button>
          </div>
          {envelopes.length === 0 ? (
            <p style={{ fontSize: 14.5, color: "#5a5a5a", margin: 0 }}>
              no requests yet. when someone wants to talk, their envelope lands here.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {envelopes.map((env, i) => (
                <li key={env.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: `2.5px solid ${INK}`, borderRadius: 16, background: ["#FBD5D5", "#D6E8D5", "#FCE7C8"][i % 3], padding: "12px 16px", boxShadow: `3px 3px 0 ${INK}`, transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <span style={{ fontSize: 24 }}>✉️</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14.5, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{env.body || "a request to talk"}</p>
                      <p style={{ fontSize: 12.5, color: "#5a5a5a", margin: 0 }}>from {env.from}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => respondEnvelope(env.id, "accept")} className="hard-link-sm" style={{ cursor: "pointer", background: "#fff", border: `2.5px solid ${INK}`, borderRadius: 12, padding: "6px 14px", fontWeight: 700, fontFamily: "'Nunito',sans-serif", fontSize: 14, boxShadow: `2px 2px 0 ${INK}`, transition: "transform .15s ease, box-shadow .15s ease" }}>open</button>
                    <button onClick={() => respondEnvelope(env.id, "decline")} className="hard-link-sm" style={{ cursor: "pointer", background: "transparent", border: `2.5px solid ${INK}`, borderRadius: 12, padding: "6px 14px", fontWeight: 700, fontFamily: "'Nunito',sans-serif", fontSize: 14, boxShadow: `2px 2px 0 ${INK}`, transition: "transform .15s ease, box-shadow .15s ease" }}>pass</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* profile */}
        <section className="doodle-card" style={sectionStyle}>
          <h2 className="marker" style={{ fontWeight: 700, fontSize: 22, margin: "0 0 16px" }}>your profile</h2>
          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13.5, color: "#5a5a5a", marginBottom: 5, fontWeight: 700 }}>display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="doodle-input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13.5, color: "#5a5a5a", marginBottom: 5, fontWeight: 700 }}>bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="doodle-input" style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving} className="doodle-btn">{saving ? "saving..." : "save"}</button>
              {saved ? <span style={{ fontSize: 14, color: "#3a8a4a", fontWeight: 700 }}>saved 💛</span> : null}
              {profile?.phone ? <span style={{ fontSize: 14, color: "#5a5a5a" }}>{profile.phone}</span> : null}
            </div>
          </form>
        </section>

        {/* credit history */}
        <section className="doodle-card" style={sectionStyle}>
          <h2 className="marker" style={{ fontWeight: 700, fontSize: 22, margin: "0 0 16px" }}>credit history</h2>
          {transactions.length === 0 ? (
            <p style={{ fontSize: 14.5, color: "#5a5a5a", margin: 0 }}>no activity yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {transactions.map((t, i) => (
                <li key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i === 0 ? "none" : `2px dashed #e3ddd0` }}>
                  <div>
                    <p style={{ fontSize: 14.5, margin: 0, fontWeight: 700 }}>{reasonLabel(t.reason)}</p>
                    <p style={{ fontSize: 12.5, color: "#5a5a5a", margin: 0 }}>{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className="marker" style={{ fontSize: 20, fontWeight: 700, color: t.amount > 0 ? "#3a8a4a" : "#E58A8A" }}>{t.amount > 0 ? `+${t.amount}` : t.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer style={{ padding: "30px 0" }}>
        <p className="marker" style={{ textAlign: "center", fontSize: 16, color: "#5a5a5a" }}>made with 🖤</p>
      </footer>
    </div>
  );
}
