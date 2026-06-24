import { useState, useRef, useEffect } from "react";
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

// Doodle speech bubbles that pop up on either side of the hero 8-ball.
// Desktop-only (hidden under 900px via the .hero-bubbles CSS rule).
const HERO_BUBBLES = [
  { side: "left", pos: { top: 4 }, bg: "#FBD5D5", text: "hey, you there?", delay: 0.35 },
  { side: "right", pos: { top: 70 }, bg: "#D6E8D5", text: "i'm here 🌷", delay: 0.6 },
  { side: "left", pos: { bottom: 44 }, bg: "#FCE7C8", text: "kind of a rough day…", delay: 0.85 },
  { side: "right", pos: { bottom: 2 }, bg: "#fff", text: "you're not alone 🖤", delay: 1.1 },
];

function HeroChatBubbles() {
  return (
    <div className="hero-bubbles" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
      {HERO_BUBBLES.map((b, i) => {
        const isLeft = b.side === "left";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...(isLeft ? { left: -10 } : { right: -10 }),
              ...b.pos,
              transform: `rotate(${isLeft ? -2 : 2}deg)`,
            }}
          >
            <div
              className="marker"
              style={{
                background: b.bg,
                border: `2.5px solid ${INK}`,
                borderRadius: isLeft ? "18px 18px 18px 5px" : "18px 18px 5px 18px",
                padding: "8px 14px",
                fontSize: 14.5,
                fontWeight: 700,
                color: INK,
                whiteSpace: "nowrap",
                boxShadow: `3px 3px 0 ${INK}`,
                transformOrigin: isLeft ? "bottom left" : "bottom right",
                animation: `bubblePop .55s cubic-bezier(.22,1.2,.36,1) both ${b.delay}s, bubbleFloat 4.2s ease-in-out infinite ${b.delay + 0.8}s`,
              }}
            >
              {b.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CUP_W = 76;
const CUP_H = 84;
const CUP_X = 28; // horizontal inset from the edges
const TOP_FACTOR = 0.42; // top cup sits ~midway down the first screen
const FOOTER_APPROX = 96; // bottom cup rests just above the footer break

/* A draggable paper cup. Position is controlled by the parent so the string
   can stay attached to it. */
function DraggableCup({ left, top, offset, onOffset, variant, fill, wave }) {
  const drag = useRef(null);

  function onPointerDown(e) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    onOffset({
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
      style={{
        position: "absolute",
        left,
        top,
        width: CUP_W,
        height: CUP_H,
        zIndex: 2,
        cursor: "grab",
        touchAction: "none",
        pointerEvents: "auto",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    >
      <svg width="92" height="84" viewBox="0 0 92 84" fill="none" style={{ pointerEvents: "none", overflow: "visible" }}>
        {/* tin can: straight cylindrical body with a rounded bottom */}
        <path d="M18 22 L18 66 Q38 78 58 66 L58 22 Z" fill={fill} stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
        {/* can ridges */}
        <path d="M19 37 Q38 42 57 37" fill="none" stroke={INK} strokeWidth="2" opacity="0.22" />
        <path d="M19 55 Q38 60 57 55" fill="none" stroke={INK} strokeWidth="2" opacity="0.22" />
        {/* little emblem stamped on the can */}
        {variant === "top" ? (
          <path d="M38 52 C30 45 30 39 35 39 C37 39 38 41 38 42 C38 41 39 39 41 39 C46 39 46 45 38 52 Z" fill={wave} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        ) : (
          <path transform="translate(29 37.5) scale(0.74)" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        )}
        {/* open rim */}
        <ellipse cx="38" cy="22" rx="20" ry="6.5" fill="#fff" stroke={INK} strokeWidth="4.5" />
        <ellipse cx="38" cy="22" rx="12" ry="3.6" fill={fill} opacity="0.45" />
        {/* little sound waves coming out of the can */}
        <path d="M64 14 q11 8 0 18 M70 9 q17 13 0 28" stroke={wave} strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* Tin-can phone: top cup at top-left, bottom cup at bottom-right. The string
   is a little gravity simulation: its midpoint hangs and swings (spring +
   damping) and settles, so dragging a cup makes it flow like a real string. */
function TinCanDoodle() {
  const layerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0, vh: 0 });
  const [topOff, setTopOff] = useState({ x: 0, y: 0 });
  const [botOff, setBotOff] = useState({ x: 0, y: 0 });
  const [ctrls, setCtrls] = useState(null); // animated string control points

  // Keep the latest values available to the animation loop without re-binding.
  const stateRef = useRef({ size, topOff, botOff });
  stateRef.current = { size, topOff, botOff };

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight, vh: window.innerHeight });
    measure();
    const t = setTimeout(measure, 400);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Base (un-dragged) cup positions for a given measured size.
  function basePositions(s) {
    return {
      topLeft: s.w - CUP_W - CUP_X, // top cup: top-right
      topTop: Math.round((s.vh || 800) * TOP_FACTOR), // ~midway down the screen
      botLeft: CUP_X, // bottom cup: bottom-left
      botTop: s.h - FOOTER_APPROX - CUP_H, // resting on the footer break
    };
  }

  // String endpoints from current state.
  function endpoints() {
    const { size: s, topOff: to, botOff: bo } = stateRef.current;
    const b = basePositions(s);
    return {
      // string leaves the base of the top cup, arrives at the rim of the bottom cup
      p0: { x: b.topLeft + CUP_W / 2 + to.x, y: b.topTop + 71 + to.y },
      p1: { x: b.botLeft + CUP_W / 2 + bo.x, y: b.botTop + 22 + bo.y },
    };
  }

  // Fluid string: it drops from the top cup, pools along a "floor" line just
  // above the footer, then runs to the bottom cup. The two control points ease
  // toward gently swaying targets so the rope flows continuously and trails
  // softly when a cup is dragged.
  useEffect(() => {
    let raf;
    const c1 = { x: 0, y: 0 };
    const c2 = { x: 0, y: 0 };
    let primed = false;

    const tick = (now) => {
      const { size: s } = stateRef.current;
      if (s.h > 0) {
        const { p0, p1 } = endpoints();
        const floorY = s.h - FOOTER_APPROX - 50; // resting line, above the footer
        const t = now / 1000;
        // Layered waves give the rope a looser, more fluid undulation.
        const bob1 = Math.sin(t * 0.9) * 12 + Math.sin(t * 1.9) * 5;
        const bob2 = Math.sin(t * 0.8 + 1) * 12 + Math.sin(t * 2.2 + 0.5) * 5;
        // c1 pulls the rope down from the top cup toward the floor;
        // c2 lays it along the floor toward the bottom cup.
        const target1 = {
          x: p0.x + Math.sin(t * 1.1) * 24 + Math.sin(t * 2.4) * 9,
          y: floorY + bob1,
        };
        const target2 = {
          x: p1.x + Math.sin(t * 1.5 + 1) * 30 + Math.sin(t * 2.8 + 0.6) * 11,
          y: floorY - bob2,
        };

        if (!primed) {
          c1.x = target1.x; c1.y = target1.y;
          c2.x = target2.x; c2.y = target2.y;
          primed = true;
        }
        const ease = 0.07; // lower = looser, more trailing/fluid
        c1.x += (target1.x - c1.x) * ease;
        c1.y += (target1.y - c1.y) * ease;
        c2.x += (target2.x - c2.x) * ease;
        c2.y += (target2.y - c2.y) * ease;

        setCtrls({ c1: { x: c1.x, y: c1.y }, c2: { x: c2.x, y: c2.y } });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ready = size.h > 0;
  const { topLeft, topTop, botLeft, botTop } = basePositions(size);

  let stringPath = "";
  if (ready && ctrls) {
    const { p0, p1 } = endpoints();
    const c1 = ctrls.c1, c2 = ctrls.c2;
    const time = (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
    // Sample the base cubic into a smooth polyline, then add a perpendicular
    // wiggle whose amplitude peaks in the near-cup halves (|sin(2pi t)| is 0 at
    // the cups, so the rope stays attached, and largest closer to each cup).
    const N = 40;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const mt = 1 - t;
      const bx = mt * mt * mt * p0.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p1.x;
      const by = mt * mt * mt * p0.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p1.y;
      const dx = 3 * mt * mt * (c1.x - p0.x) + 6 * mt * t * (c2.x - c1.x) + 3 * t * t * (p1.x - c2.x);
      const dy = 3 * mt * mt * (c1.y - p0.y) + 6 * mt * t * (c2.y - c1.y) + 3 * t * t * (p1.y - c2.y);
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const env = Math.abs(Math.sin(Math.PI * 2 * t)); // 0 at cups, peaks near them
      const off = env * (16 * Math.sin(t * Math.PI * 6 + time * 3.4) + 6 * Math.sin(t * Math.PI * 11 - time * 2.1));
      pts.push([bx + nx * off, by + ny * off]);
    }
    stringPath = "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  }

  return (
    <div
      ref={layerRef}
      className="tincan-doodle"
      style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", overflow: "visible" }}
      aria-hidden="true"
    >
      {ready && (
        <>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
            {stringPath ? (
              <path d={stringPath} stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeDasharray="10 10" />
            ) : null}
          </svg>
          <DraggableCup left={topLeft} top={topTop} offset={topOff} onOffset={setTopOff} variant="top" fill="#FCE7C8" wave="#E58A8A" />
          <DraggableCup left={botLeft} top={botTop} offset={botOff} onOffset={setBotOff} variant="bottom" fill="#D6E8D5" wave="#9CC79A" />
        </>
      )}
    </div>
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
          <svg width="30" height="30" viewBox="0 0 24 24" style={{ position: "absolute", right: 30, top: 60, animation: "popPulse 3.4s ease-in-out infinite" }}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#D6E8D5" stroke={INK} strokeWidth="1.6" /></svg>
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ position: "absolute", right: 120, bottom: 30, animation: "popPulse 4.2s ease-in-out infinite .6s" }}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#FBD5D5" stroke={INK} strokeWidth="1.6" /></svg>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: `2.5px solid ${INK}`, borderRadius: 30, padding: "7px 15px", fontSize: 14, fontWeight: 800, transform: "rotate(-1.2deg)", boxShadow: "3px 3px 0 #D6E8D5" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E58A8A", animation: "blink 2.6s ease-in-out infinite" }} />
            a tiny window for a real talk
          </div>

          <h1 className="marker" style={{ fontWeight: 700, fontSize: "clamp(46px,6.4vw,82px)", lineHeight: 1.08, margin: "20px 0 6px", letterSpacing: "-0.5px" }}>
            just{" "}
            <span style={{ position: "relative", whiteSpace: "nowrap", display: "inline-block" }}>
              8 minutes
              <svg viewBox="0 0 240 24" fill="none" preserveAspectRatio="none" style={{ position: "absolute", left: "-1%", bottom: "-0.12em", width: "102%", height: "0.28em", overflow: "visible" }}>
                <path d="M6 13 C74 6 168 6 234 11" stroke="#E58A8A" strokeWidth="5" strokeLinecap="round" strokeDasharray="280" strokeDashoffset="280" style={{ animation: "drawIn 1.1s ease-out .35s forwards" }} />
                <path d="M12 18 C82 14 158 14 228 17" stroke="#E58A8A" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" strokeDasharray="280" strokeDashoffset="280" style={{ animation: "drawIn 1.1s ease-out .5s forwards" }} />
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

        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "min(300px, 72vw)", aspectRatio: "1", display: "grid", placeItems: "center", animation: "floatY 6s ease-in-out infinite" }}>
            <HeroEightBall />
          </div>
          <HeroChatBubbles />
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
