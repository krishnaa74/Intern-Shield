// Shows the student's pasted text with suspicious phrases marked up.
// Numbered marks match the numbered red flags in the report.

const RANK = { low: 1, medium: 2, high: 3 };

function buildSegments(text, marks) {
  const lower = text.toLowerCase();
  const ranges = [];
  for (const m of marks) {
    const q = (m.quote || "").trim().toLowerCase();
    if (q.length < 3) continue;
    const i = lower.indexOf(q);
    if (i >= 0) ranges.push({ start: i, end: i + q.length, severity: m.severity || "low", n: m.n });
  }
  ranges.sort((a, b) => a.start - b.start);

  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start < last.end) {
      last.end = Math.max(last.end, r.end);
      if (RANK[r.severity] > RANK[last.severity]) last.severity = r.severity;
      last.n = last.n ?? r.n;
    } else merged.push({ ...r });
  }

  const out = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) out.push({ text: text.slice(cursor, r.start) });
    out.push({ text: text.slice(r.start, r.end), severity: r.severity, n: r.n });
    cursor = r.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

export default function AnnotatedPosting({ text, flags, ruleSignals = [] }) {
  const marks = [
    ...flags.map((f, i) => ({ quote: f.quote, severity: f.severity, n: i + 1 })),
    ...ruleSignals.map((s) => ({ quote: s.match, severity: s.severity })),
  ];
  const segments = buildSegments(text, marks);
  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
      {segments.map((s, i) =>
        s.severity ? (
          <mark key={i} className={`hl hl-${s.severity}`}>
            {s.text}
            {s.n ? <sup>{s.n}</sup> : null}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </p>
  );
}
