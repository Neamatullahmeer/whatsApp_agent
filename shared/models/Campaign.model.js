import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    
    // Type: Manual Blast ya Auto-Sequence
    type: { 
      type: String, 
      enum: ["manual", "sequence"], 
      default: "manual" 
    },

    // Kisko bhejna hai? (Audience)
    audience: {
      tags: [{ type: String }], // e.g., ["VIP", "Hot Lead"]
      excludeTags: [{ type: String }], // e.g., ["Blocked", "DND"]
      allUsers: { type: Boolean, default: false }
    },

    // Kya bhejna hai? (Template)
    content: {
      templateName: { type: String }, // WhatsApp Template Name
      templateParams: [{ type: String }], // Variables {{1}}, {{2}}
      text: { type: String }, // For testing/non-template
      mediaUrl: { type: String }
    },

    // Kab bhejna hai?
    scheduledAt: { type: Date },
    
    status: { 
      type: String, 
      enum: ["draft", "scheduled", "processing", "completed", "failed", "paused"], 
      default: "draft" 
    },

    // Tracking Stats (Real-time updates ke liye)
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);