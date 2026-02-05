import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business"
    },

    month: String, // "2026-02"

    messages: Number,
    aiCalls: Number,
    appointments: Number
  },
  { timestamps: true }
);

export const Usage = mongoose.model("Usage", usageSchema);
