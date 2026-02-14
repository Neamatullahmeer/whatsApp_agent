import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true // ⚡ Fast search ke liye
    },

    userId: { // The Agent
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // 🛠️ FIX: Type changed to String to allow "system_ai"
    assignedBy: {
      type: String, // Can be User ID (Manual) or "system_ai" (Auto)
      required: true
    },

    // 🏢 NEW: Multi-tenant filtering ke liye zaroori hai
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["active", "released"],
      default: "active"
    },

    // 📊 NEW: Duration calculate karne ke liye
    endedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// ⚡ Compound Indexing (Super Fast Querying)
// "Is agent ki active chats nikalo" -> 0.01ms response
assignmentSchema.index({ userId: 1, status: 1 });
assignmentSchema.index({ businessId: 1, status: 1 });

export const Assignment = mongoose.model(
  "Assignment",
  assignmentSchema
);