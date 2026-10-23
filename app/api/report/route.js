import { getDb } from "@/lib/supabase";
import { extractIndicators } from "@/lib/indicators";
import { hashReporter } from "@/lib/community";

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    if (rateLimited(ip)) {
      return Response.json({ error: "Too many reports. Wait a minute and try again." }, { status: 429 });
    }

    const db = getDb();
    if (!db) return Response.json({ error: "Reporting isn't set up on this server." }, { status: 503 });

    const body = await req.json();
    const text = String(body.text || "").slice(0, 8000);
    const email = String(body.email || "").slice(0, 120);
    const url = String(body.url || "").slice(0, 200);
    const scamType = String(body.scam_type || "").slice(0, 80) || null;

    const indicators = extractIndicators({ text, email, url });
    if (indicators.length === 0) {
      return Response.json({ error: "No email, website or phone number found to report." }, { status: 400 });
    }

    const reporter = hashReporter(ip);
    const rows = indicators.map((i) => ({
      indicator_type: i.type,
      indicator_value: i.value,
      scam_type: scamType,
      reporter_hash: reporter,
    }));

    const { error } = await db
      .from("reports")
      .upsert(rows, { onConflict: "indicator_type,indicator_value,reporter_hash", ignoreDuplicates: true });
    if (error) throw error;

    return Response.json({
      ok: true,
      saved: indicators.map((i) => ({ type: i.type, value: i.value })),
      message: "Thanks. Only the email, website and phone number were saved, never your message.",
    });
  } catch (err) {
    console.error("Report error:", err);
    return Response.json({ error: "Couldn't save the report. Please try again." }, { status: 500 });
  }
}
