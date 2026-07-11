import { ImageResponse } from "next/og";

export const config = { runtime: "edge" };

const INK = "#1c1917";

// One tin can, matching the landing-page doodle (76x84 viewBox), placed and
// scaled on the 1200x630 canvas.
function cup(x, y, s, fill, wave, emblem) {
  const mark =
    emblem === "heart"
      ? `<path d="M38 52 C30 45 30 39 35 39 C37 39 38 41 38 42 C38 41 39 39 41 39 C46 39 46 45 38 52 Z" fill="${wave}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
      : `<path transform="translate(29 37.5) scale(0.74)" d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#fffcf7" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M18 22 L18 66 Q38 78 58 66 L58 22 Z" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M19 37 Q38 42 57 37" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.22"/>
      <path d="M19 55 Q38 60 57 55" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.22"/>
      ${mark}
      <ellipse cx="38" cy="22" rx="20" ry="6.5" fill="#fffcf7" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="38" cy="22" rx="12" ry="3.6" fill="${fill}" opacity="0.45"/>
      <path d="M64 14 q11 8 0 18 M70 9 q17 13 0 28" stroke="${wave}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </g>`;
}

function backdrop() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#f9f6f0"/>
    <path d="M 1012 206 C 1092 282 950 360 1012 440"
          fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 9"/>
    ${cup(936, 58, 2.0, "#f5e6c8", "#c4a84a", "star")}
    ${cup(936, 396, 2.0, "#d9e4d4", "#7a9a78", "star")}
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default async function handler() {
  // Keep using the bundled font file for OG (edge-safe local asset).
  const fontData = await fetch(
    new URL("../../public/fonts/ShantellSans-Bold.ttf", import.meta.url)
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          position: "relative",
          backgroundColor: "#f9f6f0",
          fontFamily: "Shantell Sans",
        }}
      >
        <img
          width={1200}
          height={630}
          src={backdrop()}
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 70px",
            width: 900,
            color: INK,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 26,
              color: "#5c5650",
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                background: "#e8d56b",
                border: `1.5px solid ${INK}`,
                marginRight: 12,
              }}
            />
            a tiny window for a real talk
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", fontSize: 80, lineHeight: 1 }}>
            <span style={{ marginRight: 24 }}>just</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span>8 minutes</span>
              <div
                style={{
                  width: "100%",
                  height: 13,
                  borderRadius: 8,
                  background: "#e8d56b",
                  marginTop: 2,
                  transform: "rotate(-1deg)",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 80, lineHeight: 1.05, marginTop: 8 }}>
            to feel less alone
          </div>

          <div style={{ display: "flex", fontSize: 29, color: "#5c5650", marginTop: 32, maxWidth: 600 }}>
            one stranger. eight honest minutes. feel a little less alone.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Shantell Sans", data: fontData, weight: 700, style: "normal" }],
    }
  );
}
