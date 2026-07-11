import Link from "next/link";
import { useRouter } from "next/router";
import { EightBall } from "./eightball";
import { useSupabase } from "../lib/supabase/context";

const INK = "#1c1917";

const links = [
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
        padding: "26px 32px",
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
        <EightBall size={40} />
        <span className="brand" style={{ fontSize: 16, color: INK }}>
          minutes
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 14, fontWeight: 500 }}>
        <span className="nav-links-text" style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} style={{ color: INK, textDecoration: "none", opacity: 0.75 }}>
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
                background: "transparent",
                border: `1.5px solid ${INK}`,
                borderRadius: 999,
                padding: "8px 16px",
                fontWeight: 500,
              }}
            >
              account
            </Link>
            <button
              onClick={signOut}
              className="hard-link-sm"
              style={{
                cursor: "pointer",
                color: "#fffcf7",
                background: INK,
                border: `1.5px solid ${INK}`,
                borderRadius: 999,
                padding: "8px 16px",
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
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
              color: "#fffcf7",
              background: INK,
              border: `1.5px solid ${INK}`,
              borderRadius: 999,
              padding: "8px 18px",
              fontWeight: 500,
            }}
          >
            sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
