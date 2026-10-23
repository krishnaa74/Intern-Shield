import Anthropic from "@anthropic-ai/sdk";
import { runRules, checkDomain } from "@/lib/rules";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { getDb } from "@/lib/supabase";
import { extractIndicators } from "@/lib/indicators";
import { lookupReports, communitySignals } from "@/lib/community";

export const maxDuration = 30;

// Very small in-memory rate limiter (per server instance) to protect your API credits
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

function verdictFor(score) {
  if (score < 35) return "likely_safe";
  if (score < 65) return "suspicious";
  return "likely_scam";
}

function extractJson(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

// Used when no API key is set or the model call fails, so the demo never breaks
function fallbackReport(rules, note) {
  const score = rules.score;
  return {
    risk_score: score,
    verdict: verdictFor(score),
    summary:
      rules.signals.length > 0
        ? "Our instant checks found warning signs in this posting. Do not pay money or share documents until you have verified the employer."
        : "Our instant checks found no obvious scam patterns, but that doesn't prove it's real. Verify the employer before sharing personal details.",
    company_name: null,
    red_flags: rules.signals.map((s) => ({
      title: s.label,
      quote: s.match,
      explanation: s.why,
      severity: s.severity,
    })),
    green_signals: [],
    verification_steps: [
      { step: "Search the company on LinkedIn", how: "Check employee count, age of the page and whether the recruiter actually works there." },
      { step: "Search '<company> scam' or 'fake'", how: "Look at Reddit, Quora and Google reviews for reports from other students." },
      { step: "Match the email to the official website", how: "Open the company's own site and compare the contact domain." },
      { step: "Never pay to get a job", how: "If money was already sent, call 1930 or report at cybercrime.gov.in." },
    ],
    recruiter_reply:
      "Hello, thank you for the opportunity. Before proceeding, could you share your official company email, a link to this role on your careers page, and details of the selection process? I'm not able to share documents or make any payment at this stage. Thank you.",
    mode: "rules-only",
    note,
  };
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    if (rateLimited(ip)) {
      return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
    }

    const body = await req.json();
    const text = String(body.text || "").trim();
    const company = String(body.company || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 120);
    const url = String(body.url || "").trim().slice(0, 200);

    if (text.length < 40) {
      return Response.json({ error: "Paste the full posting or message (at least a few sentences)." }, { status: 400 });
    }
    if (text.length > 8000) {
      return Response.json({ error: "That's too long. Paste up to 8,000 characters." }, { status: 400 });
    }

    // Step 1: instant rule checks
    const rules = runRules(`${text}\n${email}`);
    const domainSignal = checkDomain(email, url);
    if (domainSignal) {
      rules.signals.push(domainSignal);
      rules.score = Math.min(100, rules.score + 25);
    }

    // Step 2: community database lookup (optional, skipped if Supabase isn't configured)
    const db = getDb();
    let community = [];
    if (db) {
      try {
        const indicators = extractIndicators({ text, email, url });
        community = await lookupReports(db, indicators);
        const extra = communitySignals(community);
        rules.signals.push(...extra);
        rules.score = Math.min(100, rules.score + extra.reduce((s, x) => s + (x.severity === "high" ? 30 : 12), 0));
      } catch (err) {
        console.error("Community lookup failed:", err); // never break the analysis because of the DB
      }
    }
    const extras = { community, db_enabled: !!db, rule_signals: rules.signals };

    // Step 3: LLM analysis
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ ...fallbackReport(rules, "No API key set. Showing instant checks only."), ...extras });
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt({ text, company, email, url, signals: rules.signals }) }],
      });

      const raw = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const ai = extractJson(raw);

      // Step 4: blend AI judgement with rule score, and enforce hard rules
      let score = Math.round(0.7 * Number(ai.risk_score || 0) + 0.3 * rules.score);
      const hardFail = rules.signals.some((s) =>
        ["fee", "cheque", "purchase", "domain_mismatch", "community_reported"].includes(s.id)
      );
      if (hardFail) score = Math.max(score, 75);
      score = Math.max(0, Math.min(100, score));

      return Response.json({
        risk_score: score,
        verdict: verdictFor(score),
        summary: ai.summary || "",
        company_name: ai.company_name || company || null,
        red_flags: Array.isArray(ai.red_flags) ? ai.red_flags : [],
        green_signals: Array.isArray(ai.green_signals) ? ai.green_signals : [],
        verification_steps: Array.isArray(ai.verification_steps) ? ai.verification_steps : [],
        recruiter_reply: ai.recruiter_reply || "",
        mode: "ai+rules",
        ...extras,
      });
    } catch (err) {
      console.error("LLM error:", err);
      return Response.json({ ...fallbackReport(rules, "AI analysis was unavailable. Showing instant checks only."), ...extras });
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
