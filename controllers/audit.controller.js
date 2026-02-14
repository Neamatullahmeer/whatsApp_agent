import { AuditLog } from "../shared/models/AuditLog.model.js";

export async function getConversationAudit(req, res) {
  const { conversationId } = req.params;
  const businessId = req.user.businessId; // ✅ Security: Token se lo

  const logs = await AuditLog.find({ 
    conversationId, 
    businessId // ✅ Sirf apne business ke logs dikhao
  })
  .sort({ createdAt: 1 })
  .populate("actorId", "name email"); // ✨ Bonus: ID ki jagah Name dikhega (agar User model linked hai)

  res.json(logs);
}