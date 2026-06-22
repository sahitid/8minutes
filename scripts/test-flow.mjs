// End-to-end simulation of two participants going through 8 Minutes.
//
// Run with:  node --env-file=.env.local scripts/test-flow.mjs
//
// Uses the Supabase service-role key to play both people: it creates two
// users, gives them surveys, runs the matching RPC, exchanges messages,
// exercises the moderation flag, ends the session, and checks the credit
// ledger. Everything it creates is deleted at the end.

import { createClient } from "@supabase/supabase-js";
import matching from "../lib/matching.js";

const { scoreListener, pickBestListener } = matching;

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;
function assert(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    console.log(`  \u2717 ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

const rand = Math.floor(1000 + Math.random() * 8999);
const talkerPhone = `+1500${rand}0001`;
const listenerPhone = `+1500${rand}0002`;
const decoyPhone = `+1500${rand}0003`;

const created = [];

async function makeUser(phone, displayName) {
  const { data, error } = await admin.auth.admin.createUser({
    phone,
    phone_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw new Error(`createUser ${phone}: ${error.message}`);
  created.push(data.user.id);
  // The profile is created by a trigger; give it a beat and confirm.
  for (let i = 0; i < 10; i++) {
    const { data: p } = await admin
      .from("profiles")
      .select("id, credits")
      .eq("id", data.user.id)
      .maybeSingle();
    if (p) return data.user.id;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`profile not created for ${phone}`);
}

async function setSurvey(userId, conversation_type, mood, interests) {
  const { error } = await admin
    .from("survey_responses")
    .insert({ user_id: userId, conversation_type, mood, interests });
  if (error) throw new Error(`survey ${userId}: ${error.message}`);
}

async function getCredits(userId) {
  const { data } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  return data?.credits;
}

async function run() {
  console.log("\n=== Unit: scoring algorithm ===");
  const talkerSurvey = {
    conversation_type: "vent",
    mood: "low",
    interests: ["topic:life", "topic:music", "vibe:deep", "pref:talk", "depth:heavy"],
  };
  const goodListener = {
    conversation_type: "heard",
    mood: "good",
    interests: ["topic:life", "topic:music", "vibe:deep", "pref:listen", "depth:heavy"],
  };
  const poorListener = {
    conversation_type: "laugh",
    mood: "stressed",
    interests: ["topic:sports", "vibe:playful", "pref:talk", "depth:light"],
  };
  const goodScore = scoreListener(talkerSurvey, goodListener);
  const poorScore = scoreListener(talkerSurvey, poorListener);
  console.log(`  good listener score=${goodScore}, poor listener score=${poorScore}`);
  assert("compatible listener scores higher", goodScore > poorScore);
  assert("good listener score is meaningful", goodScore >= 8);
  const best = pickBestListener(talkerSurvey, [
    { id: "poor", survey: poorListener },
    { id: "good", survey: goodListener },
  ]);
  assert("pickBestListener picks the compatible one", best?.id === "good");

  console.log("\n=== Integration: full pairing + chat ===");
  const talkerId = await makeUser(talkerPhone, "talker-test");
  const listenerId = await makeUser(listenerPhone, "listener-test");
  const decoyId = await makeUser(decoyPhone, "decoy-test");
  assert("two+ users created with profiles", !!(talkerId && listenerId && decoyId));

  assert("talker starts with 1 credit", (await getCredits(talkerId)) === 1);
  assert("listener starts with 1 credit", (await getCredits(listenerId)) === 1);

  await setSurvey(talkerId, "vent", "low", talkerSurvey.interests);
  await setSurvey(listenerId, "heard", "good", goodListener.interests);
  await setSurvey(decoyId, "laugh", "stressed", poorListener.interests);

  // Mark both candidates available, then pick the best like the API does.
  await admin.from("profiles").update({ is_listener_available: true, last_seen: new Date().toISOString() }).in("id", [listenerId, decoyId]);

  const { data: surveys } = await admin
    .from("survey_responses")
    .select("*")
    .in("user_id", [listenerId, decoyId]);
  const surveyByUser = new Map(surveys.map((s) => [s.user_id, s]));
  const chosen = pickBestListener(talkerSurvey, [
    { id: listenerId, survey: surveyByUser.get(listenerId) },
    { id: decoyId, survey: surveyByUser.get(decoyId) },
  ]);
  assert("algorithm chooses the compatible listener over the decoy", chosen?.id === listenerId);

  // Create the match atomically via the RPC.
  const { data: conversationId, error: matchErr } = await admin.rpc("app_create_match", {
    p_talker: talkerId,
    p_listener: listenerId,
  });
  assert("app_create_match returned a conversation id", !!conversationId, matchErr?.message);

  const { data: conv } = await admin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();
  assert("conversation is active", conv?.status === "active");
  assert("conversation has both participants", conv?.talker_id === talkerId && conv?.listener_id === listenerId);
  assert("conversation duration is 8 minutes", conv?.duration_seconds === 480);

  assert("talker was debited 1 credit", (await getCredits(talkerId)) === 0);

  const { data: listenerProfile } = await admin
    .from("profiles")
    .select("is_listener_available")
    .eq("id", listenerId)
    .single();
  assert("matched listener taken off the queue", listenerProfile?.is_listener_available === false);

  // Exchange a few messages.
  await admin.from("messages").insert([
    { conversation_id: conversationId, sender_id: talkerId, content: "hey, thanks for being here" },
    { conversation_id: conversationId, sender_id: listenerId, content: "of course, what's on your mind?" },
  ]);
  const { data: msgs } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  assert("both messages stored", msgs?.length === 2);
  assert("normal messages are not flagged", msgs?.every((m) => m.flagged === false));

  // Moderation: a harmful message should be auto-flagged.
  await admin.from("messages").insert({ conversation_id: conversationId, sender_id: talkerId, content: "kys" });
  const { data: flagged } = await admin
    .from("messages")
    .select("flagged")
    .eq("conversation_id", conversationId)
    .eq("content", "kys")
    .single();
  assert("harmful message is flagged by moderation", flagged?.flagged === true);

  // Phone privacy: phone is never null-leaked through anything but admin; ensure
  // the column exists only on profiles and isn't part of conversations/messages.
  assert("conversation row exposes no phone", conv && !("phone" in conv));

  // Backdate the start so ending awards the listener credit (>= 7 min rule).
  await admin
    .from("conversations")
    .update({ started_at: new Date(Date.now() - 9 * 60 * 1000).toISOString() })
    .eq("id", conversationId);

  const { error: endErr } = await admin.rpc("app_end_conversation", {
    p_conversation: conversationId,
    p_user: talkerId,
  });
  assert("app_end_conversation succeeded", !endErr, endErr?.message);

  const { data: endedConv } = await admin
    .from("conversations")
    .select("status, ended_at")
    .eq("id", conversationId)
    .single();
  assert("conversation marked ended", endedConv?.status === "ended");
  assert("listener earned 1 credit for the full session", (await getCredits(listenerId)) === 2);

  // Idempotency: ending again must not double-credit.
  await admin.rpc("app_end_conversation", { p_conversation: conversationId, p_user: listenerId });
  assert("ending again does not double-credit", (await getCredits(listenerId)) === 2);

  console.log("\n=== Integration: envelope board (drop -> browse -> open) ===");
  const dropperPhone = `+1500${rand}0004`;
  const openerPhone = `+1500${rand}0005`;
  const dropperId = await makeUser(dropperPhone, "dropper-test");
  const openerId = await makeUser(openerPhone, "opener-test");
  await setSurvey(dropperId, "vent", "lonely", ["topic:life", "vibe:supportive", "pref:talk", "depth:medium"]);

  // Dropper posts an open envelope (recipient_id == sender_id sentinel).
  const { data: envelope } = await admin
    .from("talk_requests")
    .insert({ sender_id: dropperId, recipient_id: dropperId, is_anonymous: true, status: "pending" })
    .select("id")
    .single();
  assert("envelope dropped into the board", !!envelope?.id);

  // Board query: open, unclaimed, not mine.
  const { data: board } = await admin
    .from("talk_requests")
    .select("id, sender_id, recipient_id, status")
    .eq("status", "pending");
  const openForOpener = (board || []).filter(
    (r) => r.recipient_id === r.sender_id && r.sender_id !== openerId
  );
  assert("opener can see the dropped envelope on the board", openForOpener.some((r) => r.id === envelope.id));

  // Opener opens the envelope -> starts a conversation.
  const { data: convB, error: convBErr } = await admin.rpc("app_create_match", {
    p_talker: dropperId,
    p_listener: openerId,
  });
  assert("opening envelope creates a conversation", !!convB, convBErr?.message);
  await admin
    .from("talk_requests")
    .update({ recipient_id: openerId, status: "accepted", conversation_id: convB })
    .eq("id", envelope.id);

  assert("dropper was charged 1 credit when opened", (await getCredits(dropperId)) === 0);

  const { data: claimed } = await admin
    .from("talk_requests")
    .select("status, recipient_id, conversation_id")
    .eq("id", envelope.id)
    .single();
  assert("envelope marked accepted + linked to conversation", claimed?.status === "accepted" && claimed?.conversation_id === convB && claimed?.recipient_id === openerId);

  // It should no longer be an open board item.
  const stillOpen = claimed?.recipient_id === dropperId;
  assert("opened envelope leaves the board", stillOpen === false);
}

async function cleanup() {
  for (const id of created) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

run()
  .catch((e) => {
    failed++;
    console.error("\nFATAL:", e.message);
  })
  .finally(async () => {
    await cleanup();
    console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
    process.exit(failed === 0 ? 0 : 1);
  });
