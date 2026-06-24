// One-time setup for the AI fallback listener.
//
// Creates (or reuses) a dedicated bot account that owns the AI listener's
// messages, then prints its UUID. Paste that into AI_LISTENER_ID in .env.local
// (and your Vercel project env).
//
// Run: node --env-file=.env.local scripts/setup-ai-listener.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BOT_EMAIL = "ai-listener@8minutes.local";
const BOT_NAME = "sam"; // default human-ish name; per-conversation names are derived at runtime

async function findExistingByEmail(email) {
  // Page through users to find a matching email (admin API has no direct lookup).
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = (data?.users || []).find((u) => u.email === email);
    if (hit) return hit;
    if (!data || data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let userId;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: BOT_EMAIL,
    email_confirm: true,
    user_metadata: { display_name: BOT_NAME },
  });

  if (createErr) {
    const existing = await findExistingByEmail(BOT_EMAIL);
    if (!existing) {
      console.error("Could not create or find the bot user:", createErr.message);
      process.exit(1);
    }
    userId = existing.id;
    console.log("Reusing existing AI listener account.");
  } else {
    userId = created.user.id;
    console.log("Created new AI listener account.");
  }

  // Ensure a profile row exists (the handle_new_user trigger usually makes one),
  // with a friendly name and never flagged as an available human listener.
  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      display_name: BOT_NAME,
      is_listener_available: false,
      credits: 0,
    },
    { onConflict: "id" }
  );
  if (profileErr) {
    console.error("Failed to upsert bot profile:", profileErr.message);
    process.exit(1);
  }

  console.log("\nAI_LISTENER_ID=" + userId);
  console.log("\nPaste the line above into .env.local (and your Vercel env), then redeploy.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
