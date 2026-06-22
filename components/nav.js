import Link from "next/link";
import { useRouter } from "next/router";
import { EightBall } from "./eightball";
import { useSupabase } from "../lib/supabase/context";

const INK = "#1a1a1a";

const links = [
  { label: "home", href: "/" },
  { label: "about", href: "/#idea" },
  { label: "how it works", href: "/#how" },
  { label: "volunteer", href: "/#volunteer" },
];

export default function Nav() {
  const router = useRouter();
  const { supabase, user, loading } = useSupabase();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav
      style={{
        position: "relative",
        zIndex: 5,
        maxWidth: 1180,
        margin: "0 auto",
        padding: "22px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <Link
        href="/"
        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
      >
        <EightBall size={44} />
        <span className="marker" style={{ fontWeight: 600, fontSize: 20, color: INK }}>
          minutes
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 15.5, fontWeight: 700 }}>
        <span className="nav-links-text" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} style={{ color: INK, textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
        </span>

        {!loading && user ? (
          <>
            <Link
              href="/account"
              className="hard-link-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                color: INK,
                background: "#FCE7C8",
                border: `2.5px solid ${INK}`,
                borderRadius: "14px 11px 13px 12px",
                padding: "8px 16px",
                boxShadow: `3px 3px 0 ${INK}`,
                transition: "transform .15s ease, box-shadow .15s ease",
              }}
            >
              account
            </Link>
            <button
              onClick={signOut}
              className="hard-link-sm"
              style={{
                cursor: "pointer",
                color: INK,
                background: "#fff",
                border: `2.5px solid ${INK}`,
                borderRadius: "12px 13px 11px 14px",
                padding: "8px 16px",
                fontWeight: 700,
                fontFamily: "'Nunito', sans-serif",
                boxShadow: `3px 3px 0 ${INK}`,
                transition: "transform .15s ease, box-shadow .15s ease",
              }}
            >
              sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="hard-link-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              color: INK,
              background: "#fff",
              border: `2.5px solid ${INK}`,
              borderRadius: "14px 11px 13px 12px",
              padding: "8px 16px",
              boxShadow: `3px 3px 0 ${INK}`,
              transition: "transform .15s ease, box-shadow .15s ease",
            }}
          >
            sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
