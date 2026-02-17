import { Business } from "../../shared/models/Business.model.js";
import { Conversation } from "../../shared/models/Conversation.model.js";
import { Message } from "../../shared/models/Message.model.js";
import { Usage } from "../../shared/models/Usage.model.js";
import { Campaign } from "../../shared/models/Campaign.model.js";

// Services
import { detectIntent } from "../../services/intent.service.js";
import { decideNextStep } from "../../services/agent.service.js";
import { dispatchAction } from "../../services/actionDispatcher.service.js";
import { sendWhatsAppMessage } from "../../services/whatsapp.service.js";
import { generateAIResponse } from "../../services/response.generator.js";
import { resolveCategory } from "../../services/categoryResolver.service.js";
import { isDuplicateMessage } from "../../services/messageDedup.service.js";
import { logEvent } from "../../services/audit.service.js";

import { ACTIONS } from "../../constants/actionTypes.js";

export async function handleIncomingMessage(job) {
  const {
    phoneNumberId,
    from,
    profileName, // 👈 IMPORTED FROM QUEUE (Zaroori hai)
    msgBody,
    messageId,
    campaignId 
  } = job.data;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`👷 [WORKER STARTED] Job: ${job.id} | User: ${profileName} (${from})`);

  try {
    /* ─────────────────────────────
       0️⃣ DUPLICATE CHECK
    ───────────────────────────── */
    const duplicate = await isDuplicateMessage(messageId);
    if (duplicate) {
      console.log("⚠️ [STOP] Duplicate message ignored:", messageId);
      return { status: "ignored", reason: "duplicate_message" };
    }

    /* ─────────────────────────────
       1️⃣ LOAD BUSINESS
    ───────────────────────────── */
    const business = await Business.findOne({ phoneNumberId });
    if (!business || business.status !== "active") {
      console.log("❌ [STOP] Business not found or inactive");
      return { status: "ignored", reason: "business_inactive" };
    }

    /* ─────────────────────────────
       2️⃣ ENSURE CONVERSATION & SAVE USER MESSAGE
    ───────────────────────────── */
    let conversation = await Conversation.findOne({
      businessId: business._id,
      userPhone: from,
      status: { $in: ["active", "human"] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        businessId: business._id,
        userPhone: from,
        status: "active",
        lastMessageAt: new Date()
      });
    } else {
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    // Save User Message
    if (!campaignId) {
      await Message.create({
        conversationId: conversation._id,
        from: "user",
        text: msgBody,
        messageId
      });
    }

    // 🛑 HUMAN TAKEOVER CHECK
    if (conversation.status === "human") {
      console.log("👨‍💼 [STOP] Conversation is in HUMAN mode. AI paused.");
      return { status: "paused", reason: "human_mode" };
    }

    /* ─────────────────────────────
       3️⃣ FETCH HISTORY (CONTEXT)
    ───────────────────────────── */
    const rawHistory = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const history = rawHistory
      .reverse()
      .map(msg => `${msg.from === "user" ? "User" : "Agent"}: ${msg.text}`)
      .join("\n");

    /* ─────────────────────────────
       4️⃣ INTENT DETECTION
    ───────────────────────────── */
    const category = resolveCategory(business);

    const intentResult = await detectIntent({
      context: { business, category },
      userMessage: msgBody,
      history: history
    });

    console.log(`📦 Intent Detected: ${intentResult.intent} (Conf: ${intentResult.confidence})`);

    /* ─────────────────────────────
       5️⃣ LOW CONFIDENCE HANDLING
    ───────────────────────────── */
    if (
      intentResult.confidence < 0.6 ||
      (category.enabledIntents && !category.enabledIntents.includes(intentResult.intent))
    ) {
      const fallbackMsg = business.agentConfig?.responses?.lowConfidence || "Maaf kijiye, main samajh nahi paya. 🤔 Kya aap thoda detail mein batayenge?";

      await sendWhatsAppMessage(from, { text: fallbackMsg }, phoneNumberId);

      await Message.create({
        conversationId: conversation._id,
        from: "agent",
        text: fallbackMsg
      });

      return { status: "success", type: "fallback" };
    }

    /* ─────────────────────────────
       6️⃣ AGENT BRAIN DECISION 🧠
    ───────────────────────────── */
    
    // ✅ PASS CONTEXT TO AGENT (Including Profile Name)
    const decision = await decideNextStep(intentResult, {
      businessId: business._id,
      userPhone: from,
      profileName: profileName, // 👈 PASSED HERE
      business,
      category,
      userMessage: msgBody,
      history: history
    });

    /* ─────────────────────────────
       7️⃣ ACTION DISPATCH
    ───────────────────────────── */
    let actionResult = null;

    if (decision.action && decision.action !== ACTIONS.NONE) {
      console.log(`⚡ Dispatching Action: ${decision.action}`);
      actionResult = await dispatchAction(decision, {
        businessId: business._id,
        userPhone: from,
        conversationId: conversation._id
      });
    }

    /* ─────────────────────────────
       8️⃣ RESPONSE GENERATION & SENDING
    ───────────────────────────── */
    let finalMessageText = decision.message;

    // AI Response Generation (If needed)
    if (!finalMessageText || finalMessageText.includes("[SYSTEM INSTRUCTION") || decision.useAI) {
      console.log("🤖 Generating AI Response...");
      finalMessageText = await generateAIResponse(business, intentResult, { ...decision, actionResult }, history);
    }

    // 📤 Send via WhatsApp
    await sendWhatsAppMessage(
      from,
      {
        text: finalMessageText || "...",
        media: decision.media
      },
      phoneNumberId
    );

    /* ─────────────────────────────
       9️⃣ LOGGING & TRACKING
    ───────────────────────────── */
    
    // Save Agent Message
    await Message.create({
      conversationId: conversation._id,
      from: "agent",
      text: finalMessageText,
    });

    // Stats
    const month = new Date().toISOString().slice(0, 7);
    await Usage.updateOne(
      { businessId: business._id, month },
      { $inc: { messages: 1 } },
      { upsert: true }
    );

    console.log("✅ [FINISHED] Job processed successfully:", messageId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return { status: "success", action: decision.action };

  } catch (err) {
    console.error("❌ [FATAL ERROR] Job failed inside handler:", messageId);
    console.error(err);
    return { status: "failed", error: err.message };
  }
}