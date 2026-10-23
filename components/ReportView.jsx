"use client";
import { useState } from "react";
import ScoreGauge from "./ScoreGauge";
import AnnotatedPosting from "./AnnotatedPosting";

const VERDICT = {
  likely_safe: { label: "Likely safe", color: "text-safe", border: "border-safe", note: "No major scam signals found. Still verify before sharing documents." },
  suspicious: { label: "Suspicious", color: "text-warn", border: "border-warn", note: "Some warning signs. Verify the employer before going further." },
  likely_scam: { label: "Likely scam", color: "text-danger", border: "border-danger", note: "Do not pay money or send documents." },
};
const SEV = { high: "bg-danger", medium: "bg-warn", low: "bg-muted" };

function Section({ title, children }) {
  return (
    <section className="border-t border-line pt-6">
      <h3 className="mb-4 font-display text-xl font-bold">{title}</h3>
      {children}
    </section>
  );
}

export default function ReportView({ report, postingText, inputs = {} }) {
  const [copied, setCopied] = useState(false);
  const [reportState, setReportState] = useState("idle"); // idle | sending | done | error
  const [reportMsg, setReportMsg] = useState("");
  const [checked, setChecked] = useState({});
  const v = VERDICT[report.verdict] || VERDICT.suspicious;

  // Rule hits that the AI did not already cover (avoid duplicate highlights)
  const extraRules = (report.rule_signals || []).filter(
    (s) => !report.red_flags.some((f) => (f.quote || "").toLowerCase().includes(s.match.toLowerCase()))
  );

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(report.recruiter_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function submitReport() {
    setReportState("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputs.text || postingText,
          email: inputs.email || "",
          url: inputs.url || "",
          scam_type: report.red_flags?.[0]?.title || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save the report.");
      setReportMsg(data.message);
      setReportState("done");
    } catch (e) {
      setReportMsg(e.message);
      setReportState("error");
    }
  }

  return (
    <div className="space-y-8" aria-live="polite">
      {/* Verdict */}
      <div className={`flex flex-col items-start gap-5 border-l-4 bg-white p-6 sm:flex-row sm:items-center ${v.border}`}>
        <ScoreGauge score={report.risk_score} verdict={report.verdict} />
        <div>
          <p className={`font-display text-3xl font-extrabold ${v.color}`}>{v.label}</p>
          <p className="mt-1 text-sm font-medium">{v.note}</p>
          <p className="mt-3 max-w-prose leading-relaxed text-muted">{report.summary}</p>
        </div>
      </div>

      {report.note && <p className="text-sm text-muted">{report.note}</p>}

      {/* Community reports */}
      {report.community?.length > 0 && (
        <Section title="Reported by other students">
          <ul className="space-y-2">
            {report.community.map((c, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                <span className="break-all font-semibold">{c.value}</span>
                <span className="text-sm text-muted">({c.type})</span>
                <span className="font-medium text-danger">
                  reported by {c.count} {c.count === 1 ? "user" : "users"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Reports come from other users and are unverified. Treat them as a warning, not proof.</p>
        </Section>
      )}

      {/* Annotated posting */}
      <Section title="Your posting, marked up">
        <div className="bg-white p-5">
          <AnnotatedPosting text={postingText} flags={report.red_flags} ruleSignals={extraRules} />
        </div>
      </Section>

      {/* Red flags */}
      <Section title={`Red flags (${report.red_flags.length})`}>
        {report.red_flags.length === 0 ? (
          <p className="text-muted">No red flags found in the text.</p>
        ) : (
          <ol className="space-y-4">
            {report.red_flags.map((f, i) => (
              <li key={i} className="flex gap-4">
                <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${SEV[f.severity] || SEV.low}`}>{i + 1}</span>
                <div>
                  <p className="font-semibold">{f.title} <span className="text-sm font-normal text-muted">({f.severity})</span></p>
                  {f.quote ? <p className="mt-1 border-l-2 border-line pl-3 text-sm italic text-muted">{f.quote}</p> : null}
                  <p className="mt-1 leading-relaxed">{f.explanation}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Green signals */}
      {report.green_signals?.length > 0 && (
        <Section title="Good signs">
          <ul className="space-y-3">
            {report.green_signals.map((g, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-0.5 text-safe">✔</span>
                <p><span className="font-semibold">{g.title}.</span> {g.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Verification */}
      <Section title="Verify the employer">
        <ul className="space-y-3">
          {report.verification_steps.map((s, i) => (
            <li key={i}>
              <label className="flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  className="mt-1.5 h-4 w-4 accent-[#14213D]"
                  checked={!!checked[i]}
                  onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                />
                <span className={checked[i] ? "text-muted line-through" : ""}>
                  <span className="font-semibold">{s.step}.</span> {s.how}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Section>

      {/* Reply */}
      {report.recruiter_reply && (
        <Section title="Reply to the recruiter">
          <div className="bg-white p-5">
            <p className="leading-relaxed">{report.recruiter_reply}</p>
            <button
              onClick={copyReply}
              className="mt-4 bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#22345f]"
            >
              {copied ? "Copied" : "Copy message"}
            </button>
          </div>
        </Section>
      )}

      {report.db_enabled && report.verdict !== "likely_safe" && (
        <Section title="Help other students">
          {reportState === "done" ? (
            <p className="font-medium text-safe">{reportMsg}</p>
          ) : (
            <>
              <p className="mb-3 leading-relaxed text-muted">
                Think this is a scam? Report it. We save only the email, website and phone number found in the message, never the message itself.
              </p>
              <button
                onClick={submitReport}
                disabled={reportState === "sending"}
                className="border border-danger px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white disabled:opacity-50"
              >
                {reportState === "sending" ? "Saving…" : "Report this as a scam"}
              </button>
              {reportState === "error" && <p role="alert" className="mt-3 text-sm font-medium text-danger">{reportMsg}</p>}
            </>
          )}
        </Section>
      )}

      <p className="text-xs text-muted">
        InternShield gives guidance, not proof. If you already paid, call 1930 or report at cybercrime.gov.in.
      </p>
    </div>
  );
}
