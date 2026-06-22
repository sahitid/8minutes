import Link from "next/link";
import Nav from "../../components/nav";
import HeadObject from "../../components/head";

export default function ChatIndex() {
  return (
    <div className="doodle-page">
      <HeadObject />
      <Nav />
      <main style={{ display: "flex", justifyContent: "center", padding: "80px 20px" }}>
        <div className="doodle-card" style={{ maxWidth: 460, textAlign: "center", padding: 40, transform: "rotate(-0.5deg)" }}>
          <div style={{ fontSize: 46, marginBottom: 12 }}>💬</div>
          <h1 className="marker" style={{ fontWeight: 700, fontSize: 26, margin: "0 0 8px" }}>no active conversation</h1>
          <p style={{ fontSize: 14.5, color: "#5a5a5a", margin: "0 0 24px" }}>
            take the quick quiz to get matched with a listener, or wait for an envelope in your account.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/survey" className="doodle-btn">find someone to talk to</Link>
            <Link href="/account" className="doodle-btn doodle-btn-outline">go to account</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
