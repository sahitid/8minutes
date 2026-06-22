import { useState } from "react";
import { useRouter } from "next/router";
import Nav from "../components/nav";
import HeadObject from "../components/head";
import { useSupabase } from "../lib/supabase/context";

const INK = "#1a1a1a";

export default function Login() {
  const router = useRouter();
  const { supabase } = useSupabase();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function normalizePhone(value) {
    const trimmed = value.trim().replace(/[\s()-]/g, "");
    return trimmed.startsWith("+") ? trimmed : `+1${trimmed}`;
  }

  async function sendCode(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(phone),
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: code.trim(),
      type: "sms",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    const redirect =
      typeof router.query.redirect === "string" ? router.query.redirect : "/account";
    router.push(redirect);
  }

  return (
    <div className="doodle-page">
      <HeadObject />
      <Nav />

      <main style={{ display: "flex", justifyContent: "center", padding: "48px 20px 80px" }}>
        <div className="doodle-card" style={{ width: "100%", maxWidth: 420, padding: 32, transform: "rotate(-0.6deg)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ margin: "0 auto 12px", display: "grid", placeItems: "center", width: 60, height: 60, borderRadius: "55% 50% 52% 48%", border: `3px solid ${INK}`, background: "#FBD5D5", fontSize: 28, transform: "rotate(-4deg)" }}>💌</div>
            <h1 className="marker" style={{ fontWeight: 700, fontSize: 28, margin: 0 }}>welcome to 8 minutes</h1>
            <p style={{ fontSize: 14.5, color: "#5a5a5a", marginTop: 6 }}>
              {step === "phone" ? "sign in with your phone number" : `we sent a code to ${normalizePhone(phone)}`}
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={sendCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="tel"
                inputMode="tel"
                required
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="doodle-input"
              />
              <button type="submit" disabled={busy} className="doodle-btn" style={{ width: "100%" }}>
                {busy ? "sending..." : "send code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="doodle-input"
                style={{ textAlign: "center", letterSpacing: "0.4em", fontSize: 18 }}
              />
              <button type="submit" disabled={busy} className="doodle-btn" style={{ width: "100%" }}>
                {busy ? "verifying..." : "verify & continue"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError("");
                }}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14, color: "#5a5a5a" }}
              >
                use a different number
              </button>
            </form>
          )}

          {error ? <p style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: "#c0392b", fontWeight: 700 }}>{error}</p> : null}
        </div>
      </main>
    </div>
  );
}
