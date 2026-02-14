import { canHumanReply } from "../services/humanPermission.service.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";
import { logEvent } from "../services/audit.service.js";
import { Conversation } from "../shared/models/Conversation.model.js";
import { Message } from "../shared/models/Message.model.js";

export async function humanSendMessage(req, res) {
  try {
    const { conversationId, text } = req.body;
    const userId = req.user._id; // agent
    const businessId = req.user.businessId;

    // 1️⃣ Permission check
    await canHumanReply({
      conversationId,
      userId
    });

    // 2️⃣ Load conversation (for user phone)
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const to = conversation.userPhone;

    // 3️⃣ Send WhatsApp message
    await sendWhatsAppMessage(to, text);

    // 4️⃣ Save message in DB
    await Message.create({
      conversationId,
      from: "human",
      userId,
      text
    });

    // 5️⃣ Audit log
    await logEvent({
      businessId,
      conversationId,
      actorType: "human",
      actorId: userId,
      event: "human_reply_sent",
      meta: {
        message: text
      }
    });

    res.json({ sent: true });
  } catch (err) {
    console.error("❌ Human reply failed:", err.message);
    res.status(403).json({ error: err.message });
  }
}
