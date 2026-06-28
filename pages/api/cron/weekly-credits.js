import { supabaseAdmin } from "../../../lib/supabase/admin";
import { grantWeeklyCredits } from "../../../lib/credits";

// Weekly cron (see vercel.json): gives every member their free credit.
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is
// set; we enforce it when present. The grant is idempotent regardless.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const result = await grantWeeklyCredits(supabaseAdmin);
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
