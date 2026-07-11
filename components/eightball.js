const INK = "#1c1917";

/**
 * Hand-drawn billiards 8-ball logo. Solid black ball with a white circle and a
 * display "8", plus a little shine highlight.
 */
export function EightBall({ size = 46, tilt = -4 }) {
  const fontSize = size * 0.32;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ transform: `rotate(${tilt}deg)`, display: "block" }}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="21" fill={INK} stroke={INK} strokeWidth="2.2" />
      <circle cx="16" cy="15" r="4.5" fill="#fff" opacity="0.35" />
      <circle cx="24" cy="26" r="11.5" fill="#fffcf7" stroke={INK} strokeWidth="2" />
      <text
        x="24"
        y="26"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        fill={INK}
      >
        8
      </text>
    </svg>
  );
}
