import { createHash } from "crypto";

export function hashReporter(ip) {
  const salt = process.env.REPORT_SALT || "internshield";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// Looks up how many DIFFERENT people reported each indicator
export async function lookupReports(db, indicators) {
  if (!db || indicators.length === 0) return [];
  const values = [...new Set(indicators.map((i) => i.value))];
  const { data, error } = await db
    .from("reports")
    .select("indicator_type, indicator_value, reporter_hash")
    .in("indicator_value", values)
    .limit(1000);
  if (error) throw error;

  const groups = new Map();
  for (const row of data || []) {
    const key = `${row.indicator_type}|${row.indicator_value}`;
    if (!groups.has(key)) groups.set(key, { type: row.indicator_type, value: row.indicator_value, reporters: new Set() });
    groups.get(key).reporters.add(row.reporter_hash);
  }
  // Only keep hits that match what was actually found in this message
  const wanted = new Set(indicators.map((i) => `${i.type}|${i.value}`));
  return [...groups.entries()]
    .filter(([key]) => wanted.has(key))
    .map(([, g]) => ({ type: g.type, value: g.value, count: g.reporters.size }))
    .sort((a, b) => b.count - a.count);
}

// Turn community hits into signals that join the rule engine's list.
// Needs 2+ different reporters to count as high severity, to blunt false reports.
export function communitySignals(hits) {
  return hits.map((h) => {
    const strong = h.count >= 2;
    return {
      id: strong ? "community_reported" : "community_reported_once",
      severity: strong ? "high" : "medium",
      label: strong ? `Reported by ${h.count} other users` : "Reported by another user",
      why: `This ${h.type} (${h.value}) was reported as part of a suspected scam in InternShield's community database. Reports are unverified, so treat this as a warning sign, not proof.`,
      match: h.value,
    };
  });
}
