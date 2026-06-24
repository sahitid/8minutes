import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Nav from "../../components/nav";
import HeadObject from "../../components/head";
import { useSupabase } from "../../lib/supabase/context";

const INK = "#1a1a1a";

// When no human listener takes the envelope, gently fall back to the AI:
// quickly if nobody's online, or after a hard wait even if listeners are idle.
const FALLBACK_NO_LISTENERS_MS = 30000;
const FALLBACK_HARD_MS = 75000;

export default function Waiting() {
  const router = useRouter();
  const { user, loading } = useSupabase();
  const [listeners, setListeners] = useState(null);
  const [status, setStatus] = useState("pending");
  const [noEnvelope, setNoEnvelope] = useState(false);
  const startedRef = useRef(Date.now());
  const fallbackRef = useRef(false);

  const poll = useCallback(async () => {
    const res = await fetch("/api/requests/mine");
    if (!res.ok) return;
    const data = await res.json();
    setListeners(data.listeners_online);
    if (!data.request) {
      setNoEnvelope(true);
      return;
    }
    setStatus(data.request.status);
    if (data.request.status === "accepted" && data.request.conversation_id) {
      router.push(`/chat/${data.request.conversation_id}`);
      return;
    }

    // No human has opened the envelope yet — fall back to the AI listener.
    if (data.request.status === "pending" && !fallbackRef.current) {
      const waited = Date.now() - startedRef.current;
      const noneOnline = (data.listeners_online || 0) === 0;
      const shouldFallback =
        (noneOnline && waited >= FALLBACK_NO_LISTENERS_MS) || waited >= FALLBACK_HARD_MS;
      if (shouldFallback) {
        fallbackRef.current = true;
        try {
          const fb = await fetch("/api/ai/fallback", { method: "POST" });
          const fbData = await fb.json().catch(() => ({}));
          if (fb.ok && fbData.conversation_id) {
            router.push(`/chat/${fbData.conversation_id}`);
          } else {
            fallbackRef.current = false; // allow a retry on the next poll
          }
        } catch {
          fallbackRef.current = false;
        }
      }
    }
  }, [router]);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/survey");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [user, poll]);

  async function cancel() {
    await fetch("/api/requests/mine", { method: "DELETE" });
    router.push("/account");
  }

  if (loading || !user) return null;

  return (
    <div className="doodle-page">
      <HeadObject />
      <Nav />

      <main style={{ display: "flex", justifyContent: "center", padding: "60px 20px" }}>
        <div className="doodle-card" style={{ width: "100%", maxWidth: 480, textAlign: "center", padding: 40, background: "#FCE7C8", transform: "rotate(-0.6deg)" }}>
          {/* floating envelope */}
          <div style={{ fontSize: 64, marginBottom: 8, animation: "floatY 3s ease-in-out infinite" }}>💌</div>

          {noEnvelope ? (
            <>
              <h1 className="marker" style={{ fontWeight: 700, fontSize: 26, margin: "0 0 8px" }}>your envelope was opened or cancelled</h1>
              <p style={{ fontSize: 14.5, color: "#5a5a5a", margin: "0 0 22px" }}>head back and send another whenever you&apos;re ready.</p>
              <button onClick={() => router.push("/survey")} className="doodle-btn">send a new one</button>
            </>
          ) : (
            <>
              <h1 className="marker" style={{ fontWeight: 700, fontSize: 27, margin: "0 0 8px" }}>your envelope is out there ✨</h1>
              <p style={{ fontSize: 15, color: "#3a3a3a", margin: "0 0 22px", fontWeight: 700 }}>
                we&apos;re waiting for a listener to open it. hang tight, this won&apos;t take your credit until someone says yes.
              </p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: `2.5px solid ${INK}`, borderRadius: 30, padding: "10px 18px", boxShadow: `3px 3px 0 ${INK}`, marginBottom: 22 }}>
                {listeners === null ? (
                  <span style={{ fontWeight: 700, color: "#5a5a5a" }}>checking who&apos;s around...</span>
                ) : listeners > 0 ? (
                  <>
                    <span style={{ position: "relative", display: "inline-flex", width: 11, height: 11 }}>
                      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#9CC79A", opacity: 0.6, animation: "popPulse 1.4s ease-in-out infinite" }} />
                      <span style={{ position: "relative", width: 11, height: 11, borderRadius: "50%", background: "#9CC79A", border: `2px solid ${INK}` }} />
                    </span>
                    <span style={{ fontWeight: 800 }}>{listeners} {listeners === 1 ? "person is" : "people are"} listening right now</span>
                  </>
                ) : (
                  <span style={{ fontWeight: 800, color: "#5a5a5a" }}>no one&apos;s listening yet, we&apos;ll hold your spot 🌙</span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
                {[0, 1, 2].map((n) => (
                  <span key={n} style={{ width: 9, height: 9, borderRadius: "50%", background: INK, animation: `popPulse 1.2s ease-in-out infinite ${n * 0.2}s` }} />
                ))}
              </div>

              <div>
                <button onClick={cancel} className="doodle-btn doodle-btn-outline">cancel & take it back</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
