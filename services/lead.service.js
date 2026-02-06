import { Lead } from "../shared/models/Lead.model.js";
import { Conversation } from "../shared/models/Conversation.model.js";

/**
 * CREATE LEAD
 * Used by:
 * - Real Estate category
 * - CRM / Sales category
 */
export async function createLead(payload, meta) {
  const {
    businessId,
    userPhone,
    conversationId
  } = meta;

  // 1️⃣ Save lead to DB
  const lead = await Lead.create({
    businessId,
    userPhone,
    category: payload.category || "crm",
    data: payload,
    stage: "new"
  });

  // 2️⃣ Tag conversation (useful for UI + analytics)
  await Conversation.updateOne(
    { _id: conversationId },
    { $addToSet: { tags: ["lead"] } }
  );

  // 3️⃣ (Optional hook) Notify sales team
  // 🔔 Later integrate:
  // - WhatsApp notify owner
  // - Slack webhook
  // - Email
  console.log("📌 New lead created:", {
    leadId: lead._id,
    businessId,
    userPhone
  });

  // 4️⃣ Return lead (important for further processing)
  return lead;
}
