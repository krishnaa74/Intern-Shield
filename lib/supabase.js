import { createClient } from "@supabase/supabase-js";

// Server-side only. The service key must NEVER be exposed to the browser,
// so do not prefix these variables with NEXT_PUBLIC_.
export function getDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // database is optional: the app works without it
  return createClient(url, key, { auth: { persistSession: false } });
}
