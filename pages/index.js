import { useState, useRef } from "react";
import Link from "next/link";
import HeadObject from "../components/head";
import Nav from "../components/nav";
import { Bulletin } from "../components/bulletin";
import { EightBall } from "../components/eightball";
import { useSupabase } from "../lib/supabase/context";

const INK = "#1a1a1a";

function HeroEightBall() {
  return (
    <svg width="100%" height="100%" viewBox="-12 -12 164 164" fill="none" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible", animation: "sway 5s ease-in-out infinite", transformOrigin: "70px 74px" }}>
      {/* little floating sparkles */}
      <path d="M120 26 C121 33 125 37 132 38 C125 39 121 43 120 50 C119 43 115 39 108 38 C115 37 119 33 120 26Z" fill="#E58A8A" stroke={INK} strokeWidth="1.4" style={{ animation: "popPulse 3s ease-in-out infinite" }} />
      <path d="M16 96 C17 102 20 105 26 106 C20 107 17 110 16 116 C15 110 12 107 6 106 C12 105 15 102 16 96Z" fill="#E8B873" stroke={INK} strokeWidth="1.4" style={{ animation: "popPulse 3.6s ease-in-out infinite .4s" }} />
      {/* the 8-ball */}
      <circle cx="70" cy="76" r="52" fill={INK} stroke={INK} strokeWidth="4" />
      <ellipse cx="50" cy="50" rx="13" ry="9" fill="#fff" opacity="0.28" transform="rotate(-25 50 50)" />
      <circle cx="70" cy="80" r="28" fill="#fff" stroke={INK} strokeWidth="4" />
      <text x="70" y="80" dominantBaseline="central" textAnchor="middle" fontFamily="'Shantell Sans', cursive" fontWeight="700" fontSize="34" fill={INK}>8</text>
    </svg>
  );
}

/* A draggable paper cup. Grab it and move it around. */
function DraggableCup({ base, variant, fill, wave }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  function onPointerDown(e) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.sx),
      y: drag.current.oy + (e.clientY - drag.current.sy),
    });
  }
  function onPointerUp(e) {
    drag.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  }

  return (
    <div
      className="tincan-doodle"
      style={{
        position: "absolute",
        ...base,
        width: 76,
        height: 84,
        zIndex: 4,
        cursor: "grab",
        touchAction: "none",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    >
      <svg width="76" height="84" viewBox="0 0 76 84" fill="none" style={{ pointerEvents: "none" }}>
        {variant === "top" ? (
          <>
            <path d="M20 78 L56 78 L50 30 L26 30 Z" fill={fill} stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <ellipse cx="38" cy="30" rx="14" ry="6" fill="#fff" stroke={INK} strokeWidth="4.5" />
            <path d="M60 40 q9 -5 0 -14 M67 46 q16 -8 0 -22" stroke={wave} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M20 6 L56 6 L50 54 L26 54 Z" fill={fill} stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <ellipse cx="38" cy="54" rx="14" ry="6" fill="#fff" stroke={INK} strokeWidth="4.5" />
            <path d="M60 44 q9 -5 0 -14 M67 50 q16 -8 0 -22" stroke={wave} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}

/* Decorative tin-can phone running down the whole page. The string is static;
   the two cups can be grabbed and dragged. */
function TinCanDoodle() {
  return (
    <>
      {/* static wavy string, behind the content */}
      <div className="tincan-doodle" style={{ position: "absolute", top: 176, bottom: 176, left: 22, width: 76, zIndex: 0, pointerEvents: "none" }} aria-hidden="true">
        <svg width="76" height="100%" viewBox="0 0 76 1000" preserveAspectRatio="none" fill="none">
          <path
            d="M38 0 C10 80 66 150 38 230 C12 300 64 380 38 460 C12 540 66 620 38 700 C12 780 64 860 38 1000"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="10 10"
          />
        </svg>
      </div>
      {/* draggable cups, above the content */}
      <DraggableCup base={{ top: 92, left: 22 }} variant="top" fill="#FCE7C8" wave="#E58A8A" />
      <DraggableCup base={{ bottom: 92, left: 22 }} variant="bottom" fill="#D6E8D5" wave="#9CC79A" />
    </>
  );
}

const STEPS = [
  { bg: "#FCE7C8", radius: "24px 18px 26px 16px", rot: "-1deg", badgeRot: "-6deg", badgeRadius: "55% 50% 52% 48%", n: 1, title: "a one-minute survey", body: "tell us the kind of conversation you're after today. that's the whole sign-up.", hint: "takes 60 seconds ✦", icon: (<svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="step-icon" style={{ margin: "12px 0 14px" }}><rect x="10" y="6" width="36" height="44" rx="6" fill="#fff" stroke={INK} strokeWidth="3.5" /><line x1="18" y1="18" x2="38" y2="18" stroke={INK} strokeWidth="3" strokeLinecap="round" /><line x1="18" y1="27" x2="38" y2="27" stroke={INK} strokeWidth="3" strokeLinecap="round" /><path d="M18 37 l5 5 l11 -12" stroke="#E58A8A" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
  { bg: "#D6E8D5", radius: "18px 26px 16px 24px", rot: "1deg", badgeRot: "5deg", badgeRadius: "50% 55% 48% 52%", n: 2, title: "meet your match", body: "we pair you with one stranger and open a private room. say hi, then talk about anything at all.", hint: "one stranger, just for you ✦", icon: (<svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="step-icon" style={{ margin: "12px 0 14px" }}><path d="M8 14 h26 a5 5 0 0 1 5 5 v12 a5 5 0 0 1 -5 5 h-12 l-9 8 v-8 h-5 a5 5 0 0 1 -5 -5 v-12 a5 5 0 0 1 5 -5Z" fill="#fff" stroke={INK} strokeWidth="3.5" /><circle cx="17" cy="25" r="2.4" fill={INK} /><circle cx="25" cy="25" r="2.4" fill={INK} /><circle cx="33" cy="25" r="2.4" fill={INK} /></svg>) },
  { bg: "#FBD5D5", radius: "26px 16px 24px 18px", rot: "-1.2deg", badgeRot: "-4deg", badgeRadius: "52% 48% 55% 50%", n: 3, title: "eight honest minutes", body: "a gentle timer counts down. when it ends, you leave a little lighter, no strings attached.", hint: "no strings attached 🖤", icon: (<svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="step-icon" style={{ margin: "12px 0 14px" }}><circle cx="28" cy="28" r="20" fill="#fff" stroke={INK} strokeWidth="3.5" /><path d="M28 16 v12 l9 6" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M28 6 v3 M50 28 h-3" stroke={INK} strokeWidth="3" strokeLinecap="round" /></svg>) },
];

const PILLS = [
  { t: "your day ☀", s: "#FCE7C8" },
  { t: "a hard week", s: "#D6E8D5" },
  { t: "a tiny win ✦", s: "#FBD5D5" },
  { t: "a dream you have", s: "#D6E8D5" },
  { t: "nothing at all", s: "#FCE7C8" },
  { t: "what made you smile 🖤", s: "#FBD5D5" },
  { t: "a song on repeat 🎵", s: "#D6E8D5" },
  { t: "someone you miss", s: "#FBD5D5" },
  { t: "a tiny confession", s: "#FCE7C8" },
  { t: "your weekend plans", s: "#D6E8D5" },
  { t: "a random thought 💭", s: "#FCE7C8" },
  { t: "what scares you", s: "#FBD5D5" },
  { t: "a good memory", s: "#D6E8D5" },
  { t: "what you're grateful for ✦", s: "#FCE7C8" },
];

const ROTS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "1deg", "-2.2deg", "1.2deg"];

export default function Home() {
  const { user } = useSupabase();
  const [selected, setSelected] = useState(() => new Set());

  const startHref = user ? "/survey" : "/login?redirect=/survey";
  const listenHref = user ? "/listen" : "/login?redirect=/listen";

  function togglePill(i) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="eight-landing doodle-page" style={{ fontWeight: 600 }}>
      <HeadObject />

      <TinCanDoodle />

      <Nav />

      {/* ===== HERO ===== */}
      <header id="top" className="hero-grid" style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "30px 32px 40px", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 40, alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <svg width="58" height="34" viewBox="0 0 58 34" fill="none" style={{ position: "absolute", left: 30, top: 120, animation: "sway 5s ease-in-out infinite" }}><path d="M3 20 C12 4 18 30 27 16 C36 2 42 28 54 12" stroke={INK} strokeWidth="3" strokeLinecap="round" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" style={{ position: "absolute", right: 30, top: 60, animation: "popPulse 3.4s ease-in-out infinite" }}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#D6E8D5" stroke={INK} strokeWidth="1.6" /></svg>
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ position: "absolute", right: 120, bottom: 30, animation: "popPulse 4.2s ease-in-out infinite .6s" }}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#FBD5D5" stroke={INK} strokeWidth="1.6" /></svg>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: `2.5px solid ${INK}`, borderRadius: 30, padding: "7px 15px", fontSize: 14, fontWeight: 800, transform: "rotate(-1.2deg)", boxShadow: "3px 3px 0 #D6E8D5" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E58A8A", animation: "blink 2.6s ease-in-out infinite" }} />
            a tiny window for a real talk
          </div>

          <h1 className="marker" style={{ fontWeight: 700, fontSize: "clamp(46px,6.4vw,82px)", lineHeight: 0.98, margin: "20px 0 6px", letterSpacing: "-0.5px" }}>
            just{" "}
            <span style={{ position: "relative", whiteSpace: "nowrap" }}>
              8 minutes
              <svg width="220" height="20" viewBox="0 0 220 20" fill="none" style={{ position: "absolute", left: 0, bottom: -10, width: "100%" }}>
                <path d="M4 12 C60 3 150 3 216 9" stroke="#E58A8A" strokeWidth="5" strokeLinecap="round" strokeDasharray="240" strokeDashoffset="240" style={{ animation: "drawIn 1.1s ease-out .35s forwards" }} />
              </svg>
            </span>
            <br />
            to feel less alone
          </h1>

          <p style={{ maxWidth: 430, fontSize: 18, lineHeight: 1.5, color: "#3a3a3a", margin: "22px 0 28px" }}>
            we pair you with one stranger for a short, honest conversation. no profiles, no scrolling, just eight minutes to be heard.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Link href={startHref} className="doodle-btn" style={{ fontSize: 21, padding: "15px 26px", borderRadius: "18px 14px 17px 13px" }}>
              get started
              <svg width="26" height="16" viewBox="0 0 26 16" fill="none" style={{ animation: "nudge 1.8s ease-in-out infinite" }}><path d="M2 8 H22 M16 2 L23 8 L16 14" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <a href="#how" style={{ textDecoration: "none", color: INK, fontWeight: 800, fontSize: 16, borderBottom: `2.5px dashed ${INK}`, paddingBottom: 2 }}>how it works ↓</a>
          </div>

          <div style={{ display: "flex", gap: 18, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: 26, fontSize: 14, fontWeight: 700, color: "#5a5a5a" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9CC79A" }} />free</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E58A8A" }} />anonymous</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8B873" }} />no app to install</span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "min(300px, 72vw)", aspectRatio: "1", display: "grid", placeItems: "center", animation: "floatY 6s ease-in-out infinite" }}>
            <HeroEightBall />
          </div>
        </div>
      </header>

      {/* ===== MARQUEE ===== */}
      <div style={{ position: "relative", zIndex: 2, background: INK, color: "#FBF8F3", padding: "14px 0", marginTop: 10, overflow: "hidden", transform: "rotate(-1deg)", borderTop: `3px solid ${INK}`, borderBottom: `3px solid ${INK}` }}>
        <div className="marker" style={{ display: "flex", width: "max-content", whiteSpace: "nowrap", fontWeight: 600, fontSize: 20, animation: "marquee 22s linear infinite" }}>
          {[0, 1].map((n) => (
            <span key={n} style={{ paddingRight: 36 }}>say hello ✦ be heard ✦ feel less alone ✦ 8 minutes ✦ talk about anything ✦ no judgement ✦&nbsp;</span>
          ))}
        </div>
      </div>

      {/* ===== THE IDEA ===== */}
      <section id="idea" style={{ position: "relative", zIndex: 2, maxWidth: 980, margin: "0 auto", padding: "96px 32px 70px", textAlign: "center" }}>
        <span className="marker" style={{ fontSize: 17, color: "#E58A8A", fontWeight: 600 }}>the idea</span>
        <h2 className="marker" style={{ fontWeight: 700, fontSize: "clamp(32px,4.4vw,52px)", lineHeight: 1.08, margin: "10px auto 0", maxWidth: 760 }}>
          loneliness is quiet. a short, real conversation is the fastest way to break it.
        </h2>
        <p style={{ maxWidth: 560, margin: "22px auto 0", fontSize: 18, lineHeight: 1.55, color: "#3a3a3a" }}>
          not therapy. not a date. not another feed to scroll. just one person, eight minutes, and the small relief of being met by a stranger who&apos;s listening.
        </p>

        <div style={{ position: "relative", margin: "54px auto 0", width: "max-content", maxWidth: "100%" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" style={{ position: "absolute", left: -46, top: 24, animation: "popPulse 3.2s ease-in-out infinite" }}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#FBD5D5" stroke={INK} strokeWidth="1.5" /></svg>
          <svg width="54" height="32" viewBox="0 0 58 34" fill="none" style={{ position: "absolute", right: -58, bottom: 60, animation: "sway 5s ease-in-out infinite" }}><path d="M3 20 C12 4 18 30 27 16 C36 2 42 28 54 12" stroke={INK} strokeWidth="3" strokeLinecap="round" /></svg>
          <span className="marker" style={{ display: "inline-block", background: "#FCE7C8", border: `2.5px solid ${INK}`, borderRadius: 30, padding: "7px 16px", fontWeight: 600, fontSize: 16, transform: "rotate(-2deg)", boxShadow: `3px 3px 0 ${INK}`, marginBottom: 18 }}>a tiny peek ✦</span>
          <div style={{ position: "relative", width: 300, maxWidth: "100%", margin: "0 auto", padding: "14px 14px 22px", background: "#fff", border: `3px solid ${INK}`, borderRadius: 22, boxShadow: `8px 8px 0 ${INK}`, transform: "rotate(-1.2deg)" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "9/16", border: `2.5px solid ${INK}`, borderRadius: 14, overflow: "hidden", background: INK }}>
              <iframe src="https://www.youtube.com/embed/2lH6x5zn0GI" title="8 minutes" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </div>
            <p className="marker" style={{ fontWeight: 500, fontSize: 15, color: "#3a3a3a", textAlign: "center", margin: "14px 0 0" }}>what 8 minutes can feel like 🖤</p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "30px 32px 90px" }}>
        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <span className="marker" style={{ fontSize: 17, color: "#9CC79A", fontWeight: 600 }}>how it works</span>
          <h2 className="marker" style={{ fontWeight: 700, fontSize: "clamp(32px,4.4vw,52px)", margin: "8px 0 0" }}>three little steps</h2>
        </div>

        <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
          {STEPS.map((step) => (
            <div key={step.n} className="lift-card" style={{ position: "relative", background: step.bg, border: `3px solid ${INK}`, borderRadius: step.radius, padding: "34px 26px", boxShadow: `6px 6px 0 ${INK}`, transform: `rotate(${step.rot})`, transition: "transform .18s ease, box-shadow .18s ease", cursor: "default" }}>
              <div className="marker" style={{ position: "absolute", top: -22, left: 24, width: 48, height: 48, display: "grid", placeItems: "center", background: "#fff", border: `3px solid ${INK}`, borderRadius: step.badgeRadius, fontWeight: 700, fontSize: 24, transform: `rotate(${step.badgeRot})` }}>{step.n}</div>
              {step.icon}
              <h3 className="marker" style={{ fontWeight: 600, fontSize: 23, margin: "0 0 8px" }}>{step.title}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.5, color: "#3a3a3a", margin: 0 }}>{step.body}</p>
              <p className="marker step-hint" style={{ fontSize: 15, color: INK, fontWeight: 600 }}>{step.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TALK ABOUT (clickable pills) ===== */}
      <section style={{ position: "relative", zIndex: 2, maxWidth: 1000, margin: "0 auto", padding: "10px 32px 96px", textAlign: "center" }}>
        <h2 className="marker" style={{ fontWeight: 700, fontSize: "clamp(28px,3.6vw,42px)", margin: "0 0 8px" }}>what do people talk about?</h2>
        <p style={{ fontSize: 17, color: "#5a5a5a", margin: "0 0 32px" }}>honestly, whatever&apos;s on your mind. tap the ones that feel like you.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", maxWidth: 820, margin: "0 auto" }}>
          {PILLS.map((chip, i) => {
            const on = selected.has(i);
            return (
              <button
                key={chip.t}
                onClick={() => togglePill(i)}
                style={{
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  background: on ? chip.s : "#fff",
                  border: `2.5px solid ${INK}`,
                  borderRadius: 30,
                  padding: "11px 20px",
                  fontWeight: 700,
                  fontSize: 16,
                  color: INK,
                  boxShadow: on ? `1px 1px 0 ${INK}` : `3px 3px 0 ${chip.s}`,
                  transform: on ? `rotate(${ROTS[i % ROTS.length]}) translate(2px,2px)` : `rotate(${ROTS[i % ROTS.length]})`,
                  transition: "transform .12s ease, box-shadow .12s ease, background .12s ease",
                }}
              >
                {chip.t}
              </button>
            );
          })}
        </div>
        {selected.size > 0 ? (
          <p className="marker" style={{ marginTop: 24, fontSize: 17, color: "#E58A8A" }}>
            {selected.size} thing{selected.size > 1 ? "s" : ""} on your mind. let&apos;s find someone to share them with.
          </p>
        ) : null}
      </section>

      {/* ===== BULLETIN ===== */}
      <Bulletin />

      {/* ===== VOLUNTEER ===== */}
      <section id="volunteer" style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto 90px", padding: "0 32px" }}>
        <div className="volunteer-grid" style={{ position: "relative", background: "#D6E8D5", border: `3px solid ${INK}`, borderRadius: 34, padding: "56px 44px", boxShadow: `8px 8px 0 ${INK}`, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 30, alignItems: "center", overflow: "hidden" }}>
          <div>
            <span className="marker" style={{ fontSize: 17, color: INK, fontWeight: 600 }}>volunteer</span>
            <h2 className="marker" style={{ fontWeight: 700, fontSize: "clamp(30px,3.8vw,46px)", lineHeight: 1.05, margin: "8px 0 14px" }}>be the friend on<br />the other end</h2>
            <p style={{ maxWidth: 440, fontSize: 17, lineHeight: 1.5, color: "#2a2a2a", margin: "0 0 24px" }}>good at listening? give eight minutes of your time and help someone feel a little less alone today.</p>
            <Link href={listenHref} className="doodle-btn doodle-btn-outline" style={{ fontSize: 19, padding: "13px 24px" }}>become a listener →</Link>
          </div>
          <div style={{ display: "grid", placeItems: "center" }}>
            <svg width="180" height="180" viewBox="0 0 180 180" fill="none" style={{ animation: "floatY 5s ease-in-out infinite" }}>
              <path d="M90 150 C30 110 28 60 58 48 C76 41 90 58 90 58 C90 58 104 41 122 48 C152 60 150 110 90 150Z" fill="#FBD5D5" stroke={INK} strokeWidth="5" />
              <path d="M72 92 q18 16 36 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <circle cx="74" cy="80" r="3.4" fill={INK} />
              <circle cx="106" cy="80" r="3.4" fill={INK} />
            </svg>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section id="cta" style={{ position: "relative", zIndex: 2, maxWidth: 760, margin: "0 auto", padding: "20px 32px 100px", textAlign: "center" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ display: "block", margin: "0 auto 6px", animation: "popPulse 3s ease-in-out infinite" }}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#FCE7C8" stroke={INK} strokeWidth="1.4" /></svg>
        <h2 className="marker" style={{ fontWeight: 700, fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.02, margin: "0 0 18px" }}>ready? it only takes<br />eight minutes.</h2>
        <p style={{ fontSize: 18, color: "#3a3a3a", margin: "0 0 30px" }}>your next real conversation is one click away.</p>
        <Link href={startHref} className="doodle-btn" style={{ fontSize: 25, padding: "18px 34px", borderRadius: "20px 15px 19px 14px", boxShadow: `6px 6px 0 ${INK}` }}>
          get started
          <svg width="30" height="18" viewBox="0 0 26 16" fill="none" style={{ animation: "nudge 1.8s ease-in-out infinite" }}><path d="M2 8 H22 M16 2 L23 8 L16 14" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ position: "relative", zIndex: 2, borderTop: `3px solid ${INK}`, padding: "40px 32px", background: "#fff" }}>
        <div className="footer-row" style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: INK }}>
            <EightBall size={40} />
            <span className="marker" style={{ fontWeight: 600, fontSize: 18 }}>minutes</span>
          </Link>
          <div style={{ display: "flex", gap: 22, fontSize: 15, fontWeight: 700 }}>
            <a href="#idea" style={{ color: INK, textDecoration: "none" }}>about</a>
            <a href="#how" style={{ color: INK, textDecoration: "none" }}>how it works</a>
            <a href="#volunteer" style={{ color: INK, textDecoration: "none" }}>volunteer</a>
            <Link href={user ? "/account" : "/login"} style={{ color: INK, textDecoration: "none" }}>{user ? "account" : "sign in"}</Link>
          </div>
          <span className="marker" style={{ fontSize: 16, color: "#5a5a5a" }}>made with 🖤</span>
        </div>
      </footer>
    </div>
  );
}
