import { Lead } from "../shared/models/Lead.model.js";
import { Conversation } from "../shared/models/Conversation.model.js";

/**
 * REQUEST CALLBACK
 * Used by CRM / Sales category
 */
export async function requestCallback(payload, meta) {
  const {
    businessId,
    userPhone,
    conversationId
  } = meta;

  // 1️⃣ Ensure lead exists (upsert)
  const lead = await Lead.findOneAndUpdate(
    { businessId, userPhone },
    {
      $setOnInsert: {
        category: "crm",
        data: {}
      },
      $set: {
        stage: "contacted"
      }
    },
    { upsert: true, new: true }
  );

  // 2️⃣ Mark conversation as HUMAN HANDOFF
  await Conversation.updateOne(
    { _id: conversationId },
    {
      status: "human",
      $addToSet: { tags: ["callback"] }
    }
  );

  // 3️⃣ (Optional hook) Notify sales immediately
  // 🔔 Future integrations:
  // - WhatsApp owner alert
  // - Phone dialer
  // - CRM webhook
  console.log("📞 Callback requested:", {
    leadId: lead._id,
    businessId,
    userPhone
  });

  // 4️⃣ Return lead (for logging / analytics)
  return lead;
}

