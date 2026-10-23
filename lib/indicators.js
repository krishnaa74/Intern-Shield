// Pulls out the identifiers worth remembering (emails, domains, phone numbers).
// We store ONLY these, never the full message text.

const FREE_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.in", "outlook.com", "hotmail.com", "rediffmail.com",
  "proton.me", "protonmail.com", "icloud.com", "live.com",
]);

// Big general-purpose sites that appear in legit and scam posts alike
const IGNORED_DOMAINS = new Set([
  "linkedin.com", "google.com", "docs.google.com", "forms.gle", "github.com", "wa.me", "t.me",
  "youtube.com", "facebook.com", "instagram.com", "twitter.com", "x.com",
  "naukri.com", "internshala.com", "indeed.com", "unstop.com", "cybercrime.gov.in",
]);

function cleanHost(host) {
  return host.toLowerCase().replace(/^www\./, "").replace(/[.,;:!?)]+$/, "");
}

export function extractIndicators({ text = "", email = "", url = "" }) {
  const found = new Map(); // key = type|value
  const add = (type, value) => {
    if (!value) return;
    found.set(`${type}|${value}`, { type, value });
  };

  // Emails (and the company domain behind each)
  const emailRe = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
  for (const m of `${text}\n${email}`.match(emailRe) || []) {
    const addr = m.toLowerCase();
    add("email", addr);
    const domain = cleanHost(addr.split("@")[1]);
    if (!FREE_DOMAINS.has(domain) && !IGNORED_DOMAINS.has(domain)) add("domain", domain);
  }

  // Website links in the text, plus the website field
  const urlRe = /(?:https?:\/\/|www\.)[^\s)"'<>]+/gi;
  const urls = [...(text.match(urlRe) || [])];
  if (url) urls.push(url);
  for (const u of urls) {
    try {
      const host = cleanHost(new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname);
      if (host.includes(".") && !IGNORED_DOMAINS.has(host) && !FREE_DOMAINS.has(host)) add("domain", host);
    } catch {}
  }

  // Indian mobile numbers, normalised to 10 digits
  const phoneRe = /(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}/g;
  for (const m of text.match(phoneRe) || []) {
    const digits = m.replace(/\D/g, "").slice(-10);
    if (digits.length === 10) add("phone", digits);
  }

  return [...found.values()].slice(0, 10);
}
