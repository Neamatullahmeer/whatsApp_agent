import mongoose from "mongoose";

const sequenceTrackerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  
  // User Details
  userPhone: { type: String, required: true },
  userName: { type: String },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },

  // Progress Tracking
  currentStep: { type: Number, default: 1 }, // 1 = Msg 1, 2 = Msg 2...
  status: { type: String, enum: ["active", "completed", "paused", "failed"], default: "active" },
  
  // Next Message Kab Jayega?
  nextRunAt: { type: Date, required: true, index: true }, // ⚡ Indexed for speed

  // Meta
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

export const SequenceTracker = mongoose.models.SequenceTracker || mongoose.model("SequenceTracker", sequenceTrackerSchema);