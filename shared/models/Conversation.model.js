import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    userPhone: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "closed", "human"],
      default: "active"
    },

    lastMessageAt: Date,

    tags: [String] // "appointment", "lead", "support"
  },
  { timestamps: true }
);

export const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);
