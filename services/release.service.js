import { Assignment } from "../shared/models/Assignment.model.js";
import { Conversation } from "../shared/models/Conversation.model.js";
import { logEvent } from "./audit.service.js";

/**
 * 🔄 Release conversation back to AI
 * - Closes all active assignments
 * - Switches conversation to AI mode
 * - Removes assigned Agent ID
 * - Logs audit event
 */
export async function releaseConversation({
  conversationId,
  userId,
  businessId
}) {
  // 1️⃣ Release all active assignments (Add End Time for Analytics)
  await Assignment.updateMany(
    { conversationId, status: "active" },
    { 
      $set: { 
        status: "released",
        endedAt: new Date() // 🕒 Reporting ke liye useful hai (Chat Duration)
      } 
    }
  );

  // 2️⃣ Switch conversation back to AI & REMOVE AGENT
  await Conversation.updateOne(
    { _id: conversationId },
    { 
      $set: { status: "active" },  // Status wapas AI mode
      $unset: { assignedTo: "" }   // 🔥 IMPORTANT: Agent ka naam hatao
    }
  );

  // 3️⃣ Audit log
  await logEvent({
    businessId,
    conversationId,
    actorType: "human",
    actorId: userId,
    event: "conversation_released_to_ai"
  });

  return { released: true };
}