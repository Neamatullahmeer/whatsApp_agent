import { Assignment } from "../shared/models/Assignment.model.js";
import { Conversation } from "../shared/models/Conversation.model.js";
import { User } from "../shared/models/User.model.js"; // User model chahiye role check karne ke liye

/**
 * 🔐 Check whether a human agent is allowed to reply
 */
export async function canHumanReply({
  conversationId,
  userId
}) {
  // 1️⃣ Validate conversation
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Agar Chat CLOSED hai toh koi reply nahi kar sakta
  if (conversation.status === "closed") {
    throw new Error("Cannot reply to a closed conversation");
  }

  // 2️⃣ Check User Role (Admin ko sab allowed hai)
  const user = await User.findById(userId);
  if (user && user.role === "admin") {
     return { allowed: true, conversationId }; // Admin Bypass 🚀
  }

  // 3️⃣ Regular Agent Logic
  if (conversation.status !== "human") {
    throw new Error("Conversation is managed by AI. Please assign it to yourself first.");
  }

  // 4️⃣ Validate Assignment (Sirf Assigned Agent ke liye)
  const assignment = await Assignment.findOne({
    conversationId,
    userId,
    status: "active"
  });

  if (!assignment) {
    throw new Error("You are not assigned to this conversation");
  }

  return {
    allowed: true,
    assignmentId: assignment._id,
    conversationId
  };
}