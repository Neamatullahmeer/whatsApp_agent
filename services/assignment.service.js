import { Assignment } from "../shared/models/Assignment.model.js";
import { Conversation } from "../shared/models/Conversation.model.js";
import { logEvent } from "./audit.service.js";

export async function assignConversation({
  conversationId,
  userId,    // Agent ID
  assignedBy, // Admin or System AI
  businessId
}) {
  // 1️⃣ Close old assignments (Safety Check)
  // Jo bhi purana banda assigned tha, uska status 'released' karo aur time note karo
  await Assignment.updateMany(
    { conversationId, status: "active" },
    { 
      $set: { 
        status: "released",
        endedAt: new Date() // 🕒 Analytics ke liye zaroori hai
      } 
    }
  );

  // 2️⃣ Create new assignment entry
  const assignment = await Assignment.create({
    conversationId,
    userId,
    assignedBy,
    businessId, // Business ID bhi store karna accha rehta hai reporting ke liye
    status: "active",
    startedAt: new Date()
  });

  // 3️⃣ Switch conversation to human mode & LINK AGENT
  await Conversation.updateOne(
    { _id: conversationId },
    { 
      $set: { 
        status: "human",     // Mode change
        assignedTo: userId,  // 🔥 IMPORTANT: Agent ka naam chipkao wapas
        assignedAt: new Date()
      } 
    }
  );

  // 4️⃣ Audit log
  await logEvent({
    businessId,
    conversationId,
    actorType: "human", // or 'system' depends on assignedBy
    actorId: assignedBy,
    event: "conversation_assigned",
    meta: {
      assignedTo: userId
    }
  });

  return assignment;
}