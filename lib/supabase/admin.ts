import { createClient } from "@supabase/supabase-js";

// Server-only client using the SECRET key. Bypasses RLS.
// Never import from a Client Component or a Server Component that streams
// to the browser — only from Server Actions / route handlers.
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("SUPABASE_SECRET_KEY not set — admin client unavailable.");
  }
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
