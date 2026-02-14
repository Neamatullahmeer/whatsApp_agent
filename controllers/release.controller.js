import { releaseConversation } from "../services/release.service.js";

/**
 * 🔄 Release chat back to AI
 * Only human/admin can do this
 */
export async function releaseChat(req, res) {
  try {
    const { conversationId } = req.body;

    await releaseConversation({
      conversationId,
      userId: req.user._id,           // human / admin
      businessId: req.user.businessId
    });

    res.json({
      success: true,
      message: "🤖 Chat AI ko wapas de di gayi hai"
    });
  } catch (err) {
    console.error("❌ Release chat failed:", err.message);

    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}
