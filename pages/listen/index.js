import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Nav from "../../components/nav";
import HeadObject from "../../components/head";
import { useSupabase } from "../../lib/supabase/context";

const INK = "#1a1a1a";

export default function Listen() {
  const router = useRouter();
  const { supabase, user, loading } = useSupabase();
  const [available, setAvailable] = useState(false);
  const heartbeatRef = useRef(null);

  const setAvailability = useCallback(async (value) => {
    const res = await fetch("/api/listener/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: value }),
    });
    return res.ok;
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/listen");
  }, [loading, user, router]);

  useEffect(() => {
    if (!available) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return;
    }
    setAvailability(true);
    heartbeatRef.current = setInterval(() => setAvailability(true), 30000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [available, setAvailability]);

  useEffect(() => {
    return () => {
      setAvailability(false);
    };
  }, [setAvailability]);

  useEffect(() => {
    if (!user || !available) return;
    const channel = supabase
      .channel(`listener:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations", filter: `listener_id=eq.${user.id}` },
        (payload) => {
          router.push(`/chat/${payload.new.id}`);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, available, supabase, router]);

  useEffect(() => {
    if (!user || !available) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, created_at")
        .eq("listener_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) {
        const age = Date.now() - new Date(data[0].created_at).getTime();
        if (age < 5 * 60 * 1000) router.push(`/chat/${data[0].id}`);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user, available, supabase, router]);

  if (loading || !user) return null;

  return (
    <div className="doodle-page">
      <HeadObject />
      <Nav />

      <main style={{ display: "flex", justifyContent: "center", padding: "60px 20px" }}>
        <div className="doodle-card" style={{ width: "100%", maxWidth: 460, textAlign: "center", padding: 40, background: "#D6E8D5", transform: "rotate(-0.6deg)" }}>
          <div style={{ margin: "0 auto 16px", display: "grid", placeItems: "center", width: 66, height: 66, borderRadius: "55% 50% 52% 48%", border: `3px solid ${INK}`, background: "#fff", fontSize: 30, transform: "rotate(-4deg)" }}>🎧</div>
          <h1 className="marker" style={{ fontWeight: 700, fontSize: 28, margin: "0 0 8px" }}>be a listener</h1>
          <p style={{ fontSize: 14.5, color: "#2a2a2a", margin: "0 0 26px" }}>
            stay on this page while you&apos;re available. complete an 8-minute listen and earn{" "}
            <span style={{ fontWeight: 800 }}>1 credit</span>.
          </p>

          {available ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#E58A8A", fontWeight: 800 }}>
                <span style={{ position: "relative", display: "inline-flex", width: 12, height: 12 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#E58A8A", opacity: 0.6, animation: "popPulse 1.4s ease-in-out infinite" }} />
                  <span style={{ position: "relative", width: 12, height: 12, borderRadius: "50%", background: "#E58A8A", border: `2px solid ${INK}` }} />
                </span>
                waiting for someone who needs you...
              </div>
              <button onClick={() => setAvailable(false)} className="doodle-btn doodle-btn-outline">go offline</button>
            </div>
          ) : (
            <button onClick={() => setAvailable(true)} className="doodle-btn">go available</button>
          )}
        </div>
      </main>
    </div>
  );
}
