import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSupabase } from "../lib/supabase/context";

const INK = "#1a1a1a";
const NOTE_FILLS = ["#FCE7C8", "#D6E8D5", "#FBD5D5", "#fff"];
const PIN_COLORS = ["#E58A8A", "#9CC79A", "#E8B873", "#E58A8A"];
const ROTATIONS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "1deg"];

export function Bulletin() {
  const { supabase, user } = useSupabase();
  const [posts, setPosts] = useState([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("bulletin_posts")
      .select("id, display_name, body, created_at")
      .order("created_at", { ascending: false })
      .limit(24);
    setPosts(data || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitPost(e) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !user) return;
    setPosting(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("bulletin_posts").insert({
      author_id: user.id,
      display_name: profile?.display_name || "friend",
      body: trimmed,
    });
    setPosting(false);
    if (!error) {
      setBody("");
      load();
    }
  }

  return (
    <section
      id="bulletin"
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1100,
        margin: "0 auto",
        padding: "10px 32px 96px",
        textAlign: "center",
      }}
    >
      <span className="marker" style={{ fontSize: 17, color: "#E8B873", fontWeight: 600 }}>
        the bulletin
      </span>
      <h2 className="marker" style={{ fontWeight: 700, fontSize: "clamp(28px,3.6vw,42px)", margin: "8px 0 8px" }}>
        little notes from strangers
      </h2>
      <p style={{ fontSize: 17, color: "#5a5a5a", margin: "0 0 32px" }}>
        pin a bit of kindness for whoever needs it next.
      </p>

      {user ? (
        <form
          onSubmit={submitPost}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", maxWidth: 560, margin: "0 auto 40px" }}
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={140}
            placeholder="pin a kind note (140 chars)"
            style={{
              flex: "1 1 280px",
              minWidth: 0,
              background: "#fff",
              border: `2.5px solid ${INK}`,
              borderRadius: 16,
              padding: "12px 18px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: INK,
              boxShadow: `3px 3px 0 #D6E8D5`,
            }}
          />
          <button
            type="submit"
            disabled={posting}
            className="hard-link-sm marker"
            style={{
              cursor: "pointer",
              background: "#FBD5D5",
              border: `2.5px solid ${INK}`,
              borderRadius: 16,
              padding: "12px 22px",
              fontWeight: 700,
              fontSize: 17,
              color: INK,
              boxShadow: `3px 3px 0 ${INK}`,
              transition: "transform .15s ease, box-shadow .15s ease",
            }}
          >
            {posting ? "pinning..." : "pin it"}
          </button>
        </form>
      ) : (
        <p style={{ fontSize: 15, color: "#5a5a5a", margin: "0 0 40px", fontWeight: 700 }}>
          <Link href="/login" style={{ color: "#E58A8A" }}>
            sign in
          </Link>{" "}
          to pin your own note.
        </p>
      )}

      {/* the cork board */}
      <div
        style={{
          position: "relative",
          maxWidth: 960,
          margin: "0 auto",
          border: "12px solid #7a4a24",
          borderRadius: 16,
          background: "#c79a52",
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.16) 1.6px, transparent 1.6px), radial-gradient(rgba(255,255,255,0.10) 1.6px, transparent 1.6px)",
          backgroundSize: "14px 14px, 14px 14px",
          backgroundPosition: "0 0, 7px 7px",
          boxShadow:
            "8px 8px 0 #1a1a1a, inset 0 0 50px rgba(0,0,0,0.28), inset 0 0 0 3px rgba(0,0,0,0.15)",
          padding: "40px 26px",
          minHeight: 200,
        }}
      >
        {posts.length === 0 ? (
          <p className="marker" style={{ color: "#fff8ee", fontWeight: 600, fontSize: 18, textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}>
            no notes pinned yet. be the first to leave a little kindness.
          </p>
        ) : (
          <div style={{ columnWidth: 230, columnGap: 22, textAlign: "left" }}>
            {posts.map((post, i) => (
              <div
                key={post.id}
                style={{
                  position: "relative",
                  breakInside: "avoid",
                  marginBottom: 26,
                  background: NOTE_FILLS[i % NOTE_FILLS.length],
                  borderRadius: 3,
                  padding: "26px 18px 16px",
                  boxShadow: "2px 5px 10px rgba(0,0,0,0.32)",
                  transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})`,
                }}
              >
                {/* push pin */}
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 34% 30%, #ffffffcc, ${PIN_COLORS[i % PIN_COLORS.length]} 60%, rgba(0,0,0,0.4))`,
                    border: `2px solid ${INK}`,
                    boxShadow: "1px 3px 4px rgba(0,0,0,0.35)",
                  }}
                />
                <p style={{ fontSize: 15.5, lineHeight: 1.5, color: "#2a2a2a", margin: 0, fontWeight: 700 }}>
                  {post.body}
                </p>
                <p className="marker" style={{ marginTop: 12, fontSize: 14, color: "#6a5a44", fontWeight: 500 }}>
                  love, {post.display_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
