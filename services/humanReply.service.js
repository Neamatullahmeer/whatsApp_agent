import { Assignment } from "../shared/models/Assignment.model.js";
import { Conversation } from "../shared/models/Conversation.model.js";
import { User } from "../shared/models/User.model.js"; // 👈 New Import (Role check ke liye)

export async function canHumanReply({
  conversationId,
  userId
}) {
  // 1️⃣ Ensure conversation exists
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // 🕵️‍♂️ 2️⃣ CHECK USER ROLE (Admin Super-Power 🦸‍♂️)
  const user = await User.findById(userId);
  
  // Agar user Admin hai, toh saare rules bypass!
  if (user && user.role === "admin") {
    return { 
      allowed: true, 
      conversationId,
      role: "admin" // Frontend ko pata chalega ki ye Admin intervention hai
    };
  }

  // 🛑 3️⃣ Standard Checks for Normal Agents

  // Rule A: Chat Human Mode mein honi chahiye
  if (conversation.status !== "human") {
    throw new Error("Conversation is not assigned to human mode");
  }

  // Rule B: Agent ke paas Active Assignment honi chahiye
  const assignment = await Assignment.findOne({
    conversationId,
    userId,
    status: "active"
  });

  if (!assignment) {
    throw new Error("You are not assigned to this conversation");
  }

  // ✅ Permission granted for Agent
  return {
    allowed: true,
    assignmentId: assignment._id
  };
}