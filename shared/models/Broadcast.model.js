import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business"
    },

    title: String,
    message: String,

    audience: {
      type: String, // all | tagged
      default: "all"
    },

    status: {
      type: String,
      enum: ["draft", "scheduled", "sent"],
      default: "draft"
    },

    sentAt: Date
  },
  { timestamps: true }
);

export const Broadcast = mongoose.model(
  "Broadcast",
  broadcastSchema
);
