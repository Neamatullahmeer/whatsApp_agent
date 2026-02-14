import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      index: true
    },
    actorType: {
      type: String,
      // 🚨 FIX: 'ai' ko yahan add karna zaroori hai
      enum: ["user", "system", "admin", "ai", "webhook"], 
      required: true
    },
    action: {
      type: String, // e.g., "message_sent", "lead_created", "status_change"
      required: true
    },
    meta: {
      type: Object, // Flexible storage for details (e.g., intent name, error msg)
      default: {}
    }
  },
  {
    timestamps: true 
  }
);

// TTL Index: Logs ko auto-delete karne ke liye (Optional: 90 days)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);