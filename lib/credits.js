// Weekly free-credit grant for 8 Minutes.
//
// Everyone gets 1 credit a week, on the house. Listening earns extra credits on
// top of this. The grant is idempotent within a rolling ~6-day window, so it's
// safe to run repeatedly (cron retries, manual runs) without double-granting.

const WINDOW_MS = 6 * 24 * 60 * 60 * 1000;

/**
 * Grant 1 weekly credit to every member who hasn't received one recently.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin service-role client
 * @returns {Promise<{granted:number, skipped:number}>}
 */
export async function grantWeeklyCredits(admin) {
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();

  // Who already got their free credit this cycle?
  const { data: recent, error: recentErr } = await admin
    .from("credit_transactions")
    .select("user_id")
    .eq("reason", "weekly_free_credit")
    .gte("created_at", cutoff);
  if (recentErr) throw recentErr;
  const already = new Set((recent || []).map((r) => r.user_id));

  const { data: profiles, error: profilesErr } = await admin
    .from("profiles")
    .select("id");
  if (profilesErr) throw profilesErr;

  const botId = process.env.AI_LISTENER_ID || "";
  const rows = (profiles || [])
    .filter((p) => !already.has(p.id) && p.id !== botId)
    .map((p) => ({ user_id: p.id, amount: 1, reason: "weekly_free_credit" }));

  // The credit-transaction trigger keeps profiles.credits in sync per inserted row.
  if (rows.length) {
    const { error: insertErr } = await admin.from("credit_transactions").insert(rows);
    if (insertErr) throw insertErr;
  }

  return { granted: rows.length, skipped: (profiles?.length || 0) - rows.length };
}
