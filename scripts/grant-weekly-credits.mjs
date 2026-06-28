// Grant this week's free credit to every existing account, right now.
//
// Run: node --env-file=.env.local scripts/grant-weekly-credits.mjs
//
// Safe to run repeatedly: it's idempotent within a rolling ~6-day window, so
// re-running won't hand out duplicate credits.

import { createClient } from "@supabase/supabase-js";
import { grantWeeklyCredits } from "../lib/credits.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const result = await grantWeeklyCredits(admin);
console.log(`weekly credits granted: ${result.granted}, skipped (already had one): ${result.skipped}`);
