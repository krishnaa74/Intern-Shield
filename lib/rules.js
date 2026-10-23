// Fast, deterministic scam checks that run BEFORE the LLM.
// They give instant results, ground the AI, and still work if the API is down.

const WEIGHTS = { high: 25, medium: 12, low: 6 };

const RULES = [
  {
    id: "fee",
    severity: "high",
    label: "Asks you to pay money",
    why: "Real employers never charge candidates. Registration, training, kit or security fees are the most common internship scam.",
    pattern:
      /(registration|security|training|refundable|processing|kit|onboarding|verification|joining|certificate)\s*(fee|fees|deposit|charge|charges|amount)|(pay|deposit|transfer)\s*(rs\.?|₹|inr|\$)?\s*\d[\d,]*|(fee|deposit)\s+of\s+(rs\.?|₹|inr|\$)?\s*\d[\d,]*/i,
  },
  {
    id: "purchase",
    severity: "high",
    label: "Requires you to buy something",
    why: "Being told to buy a toolkit, course or software to get the offer letter or certificate is a paid-placement scam in disguise.",
    pattern: /(purchase|buy|pay for)\s+(our|the|a)\s+[^.\n]{0,50}(toolkit|kit|course|software|laptop|training|package)/i,
  },
  {
    id: "cheque",
    severity: "high",
    label: "Cheque or equipment-purchase trick",
    why: "Scammers send a fake cheque or ask you to buy equipment from a 'vendor', then disappear with the money.",
    pattern:
      /(send|issue|deposit|cash)[^.\n]{0,30}(cheque|check|demand draft)|buy\s+(a\s+)?(laptop|equipment|software)[^.\n]{0,30}(vendor|our)/i,
  },
  {
    id: "sensitive",
    severity: "high",
    label: "Asks for sensitive details too early",
    why: "Aadhaar, PAN, bank details or OTPs should only be shared after a verified offer and onboarding, never during application.",
    pattern: /(aadhaar|aadhar|pan card|passport|bank (account|details)|\botp\b|\bcvv\b|upi pin)/i,
  },
  {
    id: "no_interview",
    severity: "medium",
    label: "Guaranteed selection, no interview",
    why: "Legitimate companies screen candidates. 'Direct joining' and 'guaranteed placement' are bait.",
    pattern: /(no interview|direct (selection|joining)|guaranteed (job|placement|selection|offer)|100%\s*(placement|job|selection))/i,
  },
  {
    id: "urgency",
    severity: "medium",
    label: "Pressure to act fast",
    why: "Artificial urgency stops you from checking the company properly.",
    pattern: /(limited (seats|slots|positions)|only \d+ (seats|slots|positions)|apply (immediately|now)|within 24 hours|last date (is )?today|hurry|urgent(ly)? hiring)/i,
  },
  {
    id: "unrealistic_pay",
    severity: "medium",
    label: "Unrealistic earnings",
    why: "High pay for little or no skill is a classic lure.",
    pattern: /(earn|make)\s+(up to\s+)?(rs\.?|₹|inr|\$)\s*\d[\d,]*\s*(per|\/|a)\s*(day|week)/i,
  },
  {
    id: "easy_task",
    severity: "medium",
    label: "Vague 'easy work from home' task",
    why: "Typing, copy-paste, liking videos or form filling from home are frequently used in task scams.",
    pattern: /(data entry|typing|copy[- ]?paste|like (posts|videos)|form filling)[^.\n]{0,60}(from home|work from home|wfh)/i,
  },
  {
    id: "messaging_app",
    severity: "medium",
    label: "Hiring over WhatsApp or Telegram",
    why: "Companies hire through official email or portals. Chat-app-only recruiting is a red flag.",
    pattern: /(whatsapp|telegram)/i,
  },
  {
    id: "free_email",
    severity: "low",
    label: "Free email address used by the 'company'",
    why: "Established companies email from their own domain, not Gmail, Yahoo or Outlook.",
    pattern: /[a-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|rediffmail|proton(mail)?)\.(com|me|in)/i,
  },
];

export function runRules(text) {
  const signals = [];
  for (const rule of RULES) {
    const m = text.match(rule.pattern);
    if (m) {
      signals.push({
        id: rule.id,
        severity: rule.severity,
        label: rule.label,
        why: rule.why,
        match: m[0].trim(),
      });
    }
  }
  const score = Math.min(100, signals.reduce((s, x) => s + WEIGHTS[x.severity], 0));
  return { signals, score };
}

const FREE_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com"];

// Compares recruiter email domain with the company website
export function checkDomain(email, url) {
  if (!email || !url) return null;
  const emailDomain = email.split("@")[1]?.toLowerCase().trim();
  let host = "";
  try {
    host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
  if (!emailDomain || !host) return null;
  if (FREE_DOMAINS.includes(emailDomain)) return null; // already caught by free_email rule
  if (emailDomain === host || emailDomain.endsWith(`.${host}`)) return null;
  return {
    id: "domain_mismatch",
    severity: "high",
    label: "Email domain doesn't match the company website",
    why: `The recruiter writes from ${emailDomain} but the company site is ${host}. Lookalike domains are a common impersonation trick.`,
    match: email,
  };
}
