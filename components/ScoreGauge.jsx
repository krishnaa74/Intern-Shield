const COLORS = { likely_safe: "#1B998B", suspicious: "#E09F00", likely_scam: "#D7263D" };

export default function ScoreGauge({ score, verdict }) {
  const color = COLORS[verdict] || "#14213D";
  const r = 52;
  const circ = Math.PI * r; // half circle length
  const offset = circ * (1 - score / 100);
  return (
    <div className="relative w-44 shrink-0" role="img" aria-label={`Risk score ${score} out of 100`}>
      <svg viewBox="0 0 120 70" className="w-full">
        <path d="M 8 62 A 52 52 0 0 1 112 62" fill="none" stroke="#CBD5E3" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 8 62 A 52 52 0 0 1 112 62"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center leading-none">
        <span className="font-display text-4xl font-extrabold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted"> / 100</span>
      </div>
    </div>
  );
}
