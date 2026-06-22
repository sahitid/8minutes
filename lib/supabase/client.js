import { createBrowserClient } from "@supabase/ssr";

let browserClient;

/**
 * Browser-side Supabase client (singleton). Uses the public anon key and the
 * logged-in user's session cookies.
 */
export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return browserClient;
}
