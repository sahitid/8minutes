import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSupabase } from "../lib/supabase/context";

const INK = "#1c1917";
const NOTE_FILLS = ["#f5e6c8", "#d9e4d4", "#f0d9d4", "#fffcf7"];
const PIN_COLORS = ["#e8d56b", "#7a9a78", "#c4a84a", "#e8d56b"];
const ROTATIONS = ["-1.5deg", "1.2deg", "-0.8deg", "1.6deg", "-1.2deg", "0.9deg"];

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
      <span className="marker" style={{ fontSize: 22, color: "#c4a84a" }}>
        the bulletin
      </span>
      <h2 className="display" style={{ fontSize: "clamp(26px,3.4vw,40px)", margin: "8px 0 8px" }}>
        little notes from strangers
      </h2>
      <p style={{ fontSize: 16, color: "#5c5650", margin: "0 0 32px", fontWeight: 400 }}>
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
            className="doodle-input"
            style={{
              flex: "1 1 280px",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={posting}
            className="doodle-btn hard-link-sm"
            style={{
              padding: "12px 22px",
              fontSize: 15,
            }}
          >
            {posting ? "pinning..." : "pin it"}
          </button>
        </form>
      ) : (
        <p style={{ fontSize: 15, color: "#5c5650", margin: "0 0 40px", fontWeight: 500 }}>
          <Link href="/login" style={{ color: "#c4a84a" }}>
            sign in
          </Link>{" "}
          to pin your own note.
        </p>
      )}

      <div
        style={{
          position: "relative",
          maxWidth: 960,
          margin: "0 auto",
          border: `1.5px solid ${INK}`,
          borderRadius: 28,
          background: "#e8dcc4",
          backgroundImage:
            "radial-gradient(rgba(28,25,23,0.08) 1.2px, transparent 1.2px), radial-gradient(rgba(255,255,255,0.18) 1.2px, transparent 1.2px)",
          backgroundSize: "14px 14px, 14px 14px",
          backgroundPosition: "0 0, 7px 7px",
          boxShadow: "0 12px 32px rgba(28,25,23,0.08)",
          padding: "40px 26px",
          minHeight: 200,
        }}
      >
        {posts.length === 0 ? (
          <p className="marker" style={{ color: "#5c5650", fontSize: 20 }}>
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
                  border: `1.5px solid ${INK}`,
                  borderRadius: 6,
                  padding: "26px 18px 16px",
                  boxShadow: "0 6px 16px rgba(28,25,23,0.08)",
                  transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})`,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 34% 30%, #ffffffcc, ${PIN_COLORS[i % PIN_COLORS.length]} 60%, rgba(0,0,0,0.35))`,
                    border: `1.5px solid ${INK}`,
                    boxShadow: "1px 2px 4px rgba(0,0,0,0.2)",
                  }}
                />
                <p style={{ fontSize: 15, lineHeight: 1.5, color: "#2a2a2a", margin: 0, fontWeight: 500 }}>
                  {post.body}
                </p>
                <p className="marker" style={{ marginTop: 12, fontSize: 16, color: "#6a5a44" }}>
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
