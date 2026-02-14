import { AuditLog } from "../shared/models/AuditLog.model.js";

export async function logEvent({
  businessId,
  conversationId = null,
  actorType, // 'system', 'agent', 'user', 'ai'
  action,    // 🚨 FIX: Ye parameter missing tha, isliye error aa raha tha
  event,     // e.g., 'message_sent'
  meta = {}
}) {
  try {
    // Validation check
    if (!businessId) {
      console.warn("⚠️ Audit Log skipped: Missing businessId");
      return null;
    }

    return await AuditLog.create({
      businessId,
      conversationId,
      actorType: actorType || "system",
      
      // ✅ FIX: Action field ab sahi se pass hoga
      // Agar action undefined hai, toh event ka naam use kar lo, warna default value
      action: action || event || "unknown_action", 
      
      event: event || "log_event",
      
      meta: meta || {}
    });

  } catch (error) {
    // 🛑 Logging fail hone par main flow rukna nahi chahiye
    console.error("❌ Failed to create audit log:", error.message);
    return null;
  }
}