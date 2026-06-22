import { createServerSupabase } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;

  const { data: request, error: fetchError } = await supabaseAdmin
    .from("talk_requests")
    .select("id, sender_id, recipient_id, status")
    .eq("id", id)
    .single();
  if (fetchError || !request)
    return res.status(404).json({ error: "Envelope not found" });

  // Must be an open, unclaimed envelope and not your own.
  if (request.status !== "pending" || request.recipient_id !== request.sender_id) {
    return res.status(409).json({ error: "ALREADY_TAKEN" });
  }
  if (request.sender_id === user.id) {
    return res.status(400).json({ error: "Can't open your own envelope" });
  }

  // Atomically create the conversation (talker = sender, listener = me),
  // which also debits the talker's credit and takes me off the queue.
  const { data: conversationId, error: matchError } = await supabaseAdmin.rpc(
    "app_create_match",
    { p_talker: request.sender_id, p_listener: user.id }
  );
  if (matchError) {
    if (matchError.message?.includes("INSUFFICIENT_CREDITS")) {
      // The talker ran out of credits; retire the envelope.
      await supabaseAdmin
        .from("talk_requests")
        .update({ status: "declined" })
        .eq("id", id);
      return res.status(409).json({ error: "TALKER_OUT_OF_CREDITS" });
    }
    return res.status(500).json({ error: matchError.message });
  }

  // Claim the envelope.
  const { error: claimError } = await supabaseAdmin
    .from("talk_requests")
    .update({ recipient_id: user.id, status: "accepted", conversation_id: conversationId })
    .eq("id", id)
    .eq("status", "pending");
  if (claimError) return res.status(500).json({ error: claimError.message });

  return res.status(200).json({ conversation_id: conversationId });
}
