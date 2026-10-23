"use client";
import { useRef, useState } from "react";
import ReportView from "@/components/ReportView";
import { SAMPLES } from "@/lib/samples";

export default function Home() {
  const [text, setText] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [analyzedInputs, setAnalyzedInputs] = useState({});
  const reportRef = useRef(null);

  function loadSample(s) {
    setText(s.text);
    setCompany(s.company);
    setEmail(s.email);
    setUrl(s.url);
    setReport(null);
    setError("");
  }

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, company, email, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReport(data);
      setAnalyzedText(text);
      setAnalyzedInputs({ text, email, url });
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const field = "w-full border border-line bg-white px-3 py-2.5 text-[15px] placeholder:text-[#8A98B0]";

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
      <header className="mb-10 flex items-center gap-3">
        <svg width="34" height="38" viewBox="0 0 34 38" aria-hidden>
          <path d="M17 2 3 7v10c0 9 6 16 14 19 8-3 14-10 14-19V7L17 2Z" fill="#14213D" />
          <path d="m11 19 4.5 4.5L24 14" fill="none" stroke="#EEF2F7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-display text-2xl font-extrabold tracking-tight">InternShield</span>
      </header>

      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Paste the offer. See what it&apos;s hiding.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Check any internship or job message for scam signals, and get a step-by-step way to verify the employer before you reply, pay or share documents.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Input */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Try an example:</span>
            {SAMPLES.map((s) => (
              <button key={s.id} onClick={() => loadSample(s)} className="border border-ink px-3 py-1 font-medium transition hover:bg-ink hover:text-white">
                {s.name}
              </button>
            ))}
          </div>

          <label htmlFor="posting" className="mb-1.5 block font-semibold">Internship or job posting</label>
          <textarea
            id="posting"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="Paste the posting, WhatsApp message or recruiter email here"
            className={`${field} resize-y leading-relaxed`}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className="mb-1.5 block text-sm font-semibold">Company name (optional)</label>
              <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Recruiter email (optional)</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="url" className="mb-1.5 block text-sm font-semibold">Company website (optional)</label>
            <input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="acmeanalytics.com" className={field} />
          </div>

          <button
            onClick={analyze}
            disabled={loading || text.trim().length < 40}
            className="mt-6 w-full bg-ink px-5 py-3.5 font-display text-lg font-bold text-white transition hover:bg-[#22345f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Checking the offer…" : "Check this offer"}
          </button>
          {error && <p role="alert" className="mt-3 text-sm font-medium text-danger">{error}</p>}
        </div>

        {/* Output */}
        <div ref={reportRef} className="min-h-[200px] scroll-mt-6">
          {report ? (
            <ReportView report={report} postingText={analyzedText} inputs={analyzedInputs} />
          ) : (
            <div className="border border-dashed border-line p-8 text-muted">
              <p className="font-display text-xl font-bold text-ink">Your report appears here</p>
              <p className="mt-2 leading-relaxed">
                You&apos;ll get a risk score, the exact lines that look suspicious, and a checklist to confirm whether the company is real. Not sure what to paste? Start with one of the examples.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
