import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER ONLY. Never import this into client
 * code. Bypasses RLS, so it is used for trusted operations like matching,
 * crediting, and reading partner profile info.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);
