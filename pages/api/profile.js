import { createServerSupabase } from "../../lib/supabase/server";
import { supabaseAdmin } from "../../lib/supabase/admin";

export default async function handler(req, res) {
  const supabase = createServerSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, display_name, phone, bio, avatar_url, credits, is_listener_available, last_seen, created_at"
      )
      .eq("id", user.id)
      .single();
    if (error) return res.status(500).json({ error: error.message });

    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("id, amount, reason, conversation_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Resolve who the user talked to for each conversation-linked transaction.
    const txs = transactions || [];
    const convIds = [...new Set(txs.map((t) => t.conversation_id).filter(Boolean))];
    const partnerByConv = new Map();
    if (convIds.length) {
      const { data: convs } = await supabaseAdmin
        .from("conversations")
        .select("id, talker_id, listener_id")
        .in("id", convIds);
      const { data: reqs } = await supabaseAdmin
        .from("talk_requests")
        .select("conversation_id, sender_id, is_anonymous")
        .in("conversation_id", convIds);
      const anonByConv = new Map();
      for (const r of reqs || []) anonByConv.set(r.conversation_id, r);

      const partnerIds = [];
      const convPartner = new Map();
      for (const c of convs || []) {
        const partnerId = c.talker_id === user.id ? c.listener_id : c.talker_id;
        convPartner.set(c.id, partnerId);
        partnerIds.push(partnerId);
      }
      const { data: people } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", partnerIds.length ? partnerIds : [user.id]);
      const nameById = new Map((people || []).map((p) => [p.id, p.display_name]));

      for (const c of convs || []) {
        const partnerId = convPartner.get(c.id);
        const anonReq = anonByConv.get(c.id);
        const partnerWasAnonTalker =
          anonReq && anonReq.is_anonymous && anonReq.sender_id === partnerId;
        partnerByConv.set(
          c.id,
          partnerWasAnonTalker ? "anonymous" : nameById.get(partnerId) || "a stranger"
        );
      }
    }

    const enriched = txs.map((t) => ({
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      created_at: t.created_at,
      partner: t.conversation_id ? partnerByConv.get(t.conversation_id) || null : null,
    }));

    return res.status(200).json({ profile, transactions: enriched });
  }

  if (req.method === "PATCH") {
    const { display_name, bio } = req.body || {};
    const updates = {};
    if (typeof display_name === "string") updates.display_name = display_name.trim();
    if (typeof bio === "string") updates.bio = bio;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data });
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Method not allowed" });
}
