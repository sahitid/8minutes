import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Nav from "../../components/nav";
import HeadObject from "../../components/head";
import { useSupabase } from "../../lib/supabase/context";

const INK = "#1a1a1a";

const HOUSE_RULES = [
  { emoji: "🌷", text: "be kind. this is someone's real moment." },
  { emoji: "👂", text: "listen first. let them feel heard." },
  { emoji: "🔒", text: "stay anonymous. no names, numbers, or addresses." },
  { emoji: "🚫", text: "no hate, harassment, or threats. ever." },
  { emoji: "🚪", text: "you can leave or report anytime you feel unsafe." },
];

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function ChatRoom() {
  const router = useRouter();
  const { id } = router.query;
  const { supabase, user, loading } = useSupabase();

  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [ended, setEnded] = useState(false);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    if (typeof window !== "undefined" && localStorage.getItem(`rules:${id}`)) {
      setRulesAccepted(true);
    }
  }, [id]);

  function acceptRules() {
    if (id && typeof window !== "undefined") localStorage.setItem(`rules:${id}`, "1");
    setRulesAccepted(true);
  }

  const endConversation = useCallback(async () => {
    if (!id) return;
    setEnded(true);
    await fetch(`/api/conversations/${id}/end`, { method: "POST" });
  }, [id]);

  useEffect(() => {
    if (!loading && !user) router.push(`/login?redirect=/chat/${id}`);
  }, [loading, user, id, router]);

  useEffect(() => {
    if (!id || !user) return;
    let active = true;
    (async () => {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) {
        if (active) setError("This conversation isn't available.");
        return;
      }
      const data = await res.json();
      if (!active) return;
      setMeta(data);
      if (data.conversation.status === "ended") setEnded(true);

      const { data: existing } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (active) setMessages(existing || []);
    })();
    return () => {
      active = false;
    };
  }, [id, user, supabase]);

  useEffect(() => {
    if (!id || !user) return;
    const channel = supabase
      .channel(`conversation:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, supabase]);

  useEffect(() => {
    if (!meta?.conversation?.started_at) return;
    const start = new Date(meta.conversation.started_at).getTime();
    const total = meta.conversation.duration_seconds || 480;
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const left = total - elapsed;
      setRemaining(left);
      if (left <= 0 && !ended) endConversation();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [meta, ended, endConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || ended) return;
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      content,
    });
    if (error) setError("Message failed to send.");
  }

  function exportTranscript() {
    const partner = meta?.partner_display_name || "your match";
    const lines = messages.map(
      (m) => `${m.sender_id === user.id ? "me" : partner}: ${m.content}`
    );
    const text = `8 Minutes — a conversation with ${partner}\n${new Date().toLocaleString()}\n\n${lines.join("\n")}\n`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "8minutes-conversation.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function reportConversation() {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: id, reason: "user_reported" }),
    });
    setReported(true);
  }

  if (loading || !user) return null;

  const lowTime = remaining !== null && remaining < 60;

  return (
    <div className="doodle-page">
      <HeadObject />
      <Nav />

      <main style={{ display: "flex", justifyContent: "center", padding: "16px 16px 32px" }}>
        <div className="doodle-card" style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", height: "76vh", padding: 0, overflow: "hidden" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `3px solid ${INK}`, background: "#FCE7C8" }}>
            <div>
              <p className="marker" style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{meta ? meta.partner_display_name : "connecting..."}</p>
              <p style={{ fontSize: 12, color: "#5a5a5a", margin: 0, fontWeight: 700 }}>{meta ? `you are the ${meta.role}` : ""}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="marker" style={{ fontSize: 16, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: `2.5px solid ${INK}`, background: lowTime ? "#FBD5D5" : "#fff", color: lowTime ? "#c0392b" : INK }}>
                {remaining !== null ? formatTime(remaining) : "8:00"}
              </span>
              <button onClick={reportConversation} disabled={reported} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 12.5, color: "#9a5a5a" }} title="Report this conversation">
                {reported ? "reported" : "report"}
              </button>
            </div>
          </div>

          {!rulesAccepted && !ended ? (
            <div style={{ flex: 1, overflowY: "auto", padding: "26px 22px", display: "flex", flexDirection: "column" }}>
              <h3 className="marker" style={{ fontSize: 22, margin: "0 0 4px", textAlign: "center" }}>house rules 🏡</h3>
              <p style={{ textAlign: "center", color: "#5a5a5a", fontSize: 14, margin: "0 0 18px", fontWeight: 700 }}>
                eight minutes, one stranger. let&apos;s make it a good one.
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {HOUSE_RULES.map((r) => (
                  <li key={r.text} style={{ display: "flex", alignItems: "center", gap: 12, border: `2.5px solid ${INK}`, borderRadius: 14, padding: "12px 14px", background: "#FBF8F3", boxShadow: `3px 3px 0 #FCE7C8` }}>
                    <span style={{ fontSize: 22 }}>{r.emoji}</span>
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{r.text}</span>
                  </li>
                ))}
              </ul>
              <button onClick={acceptRules} className="doodle-btn" style={{ marginTop: 18, alignSelf: "center" }}>
                i&apos;m ready, let&apos;s be kind
              </button>
            </div>
          ) : (
          <>
          {/* messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {error ? <p style={{ textAlign: "center", fontSize: 14, color: "#c0392b", fontWeight: 700 }}>{error}</p> : null}
            {messages.length === 0 && !error ? (
              <p style={{ textAlign: "center", fontSize: 14, color: "#9a9a90", marginTop: 24 }}>say hi. you have 8 minutes together 🌼</p>
            ) : null}
            {messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "75%", padding: "9px 15px", fontSize: 14.5, fontWeight: 600, border: `2.5px solid ${INK}`, background: mine ? "#FBD5D5" : "#fff", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", boxShadow: `2px 2px 0 ${INK}` }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* composer / end state */}
          {ended ? (
            <div style={{ padding: "20px", borderTop: `3px solid ${INK}`, textAlign: "center", background: "#D6E8D5" }}>
              <p style={{ fontSize: 14.5, margin: "0 0 6px", fontWeight: 700 }}>your 8 minutes are up. thanks for connecting 💛</p>
              <p style={{ fontSize: 12.5, margin: "0 0 14px", color: "#3a3a3a" }}>this chat is erased when you leave. save it if you&apos;d like to keep it.</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <button onClick={exportTranscript} disabled={messages.length === 0} className="doodle-btn doodle-btn-outline">save transcript</button>
                <Link href="/account" className="doodle-btn">delete & leave</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={sendMessage} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderTop: `3px solid ${INK}` }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="type a message..." className="doodle-input" style={{ flex: 1 }} />
              <button type="submit" className="doodle-btn" style={{ padding: "10px 20px" }}>send</button>
            </form>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
