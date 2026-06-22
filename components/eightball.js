const INK = "#1a1a1a";

/**
 * Hand-drawn billiards 8-ball logo. Solid black ball with a white circle and a
 * marker "8", plus a little shine highlight.
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
      <circle cx="24" cy="24" r="21" fill={INK} stroke={INK} strokeWidth="3" />
      <circle cx="16" cy="15" r="4.5" fill="#fff" opacity="0.35" />
      <circle cx="24" cy="26" r="11.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <text
        x="24"
        y="26"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="'Shantell Sans', cursive"
        fontWeight="700"
        fontSize={fontSize}
        fill={INK}
      >
        8
      </text>
    </svg>
  );
}
