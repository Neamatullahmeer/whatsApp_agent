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
    msgBody,
    messageId,
    campaignId // 👈 If broadcast job
  } = job.data;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👷 [WORKER STARTED] Processing Job:", job.id);

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
    // Find active conversation
    let conversation = await Conversation.findOne({
      businessId: business._id,
      userPhone: from,
      status: { $in: ["active", "human"] } 
    });

    // Create new if not exists
    if (!conversation) {
      conversation = await Conversation.create({
        businessId: business._id,
        userPhone: from,
        status: "active",
        lastMessageAt: new Date()
      });
    } else {
      // Update last activity
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    // Save incoming User Message (Skip if it's a broadcast trigger)
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
       3️⃣ FETCH HISTORY (CONTEXT) - CRITICAL UPDATE
    ───────────────────────────── */
    // Fetch last 10 messages for context
    const rawHistory = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Format history for AI (Oldest first)
    // Format: "User: Hello\nAgent: Hi there"
    const history = rawHistory
      .reverse()
      .map(msg => `${msg.from === "user" ? "User" : "Agent"}: ${msg.text}`)
      .join("\n");

    /* ─────────────────────────────
       4️⃣ INTENT DETECTION
    ───────────────────────────── */
    const category = resolveCategory(business);
    
    const intentResult = await detectIntent({
      context: { business, category }, // Pass business info
      userMessage: msgBody,
      history: history // Pass history context
    });

    console.log(`📦 Intent Detected: ${intentResult.intent} (Conf: ${intentResult.confidence})`);
    
    // Log detected entities
    if (intentResult.entities && Object.keys(intentResult.entities).length > 0) {
        console.log("🧩 Entities:", intentResult.entities);
    }

    /* ─────────────────────────────
       5️⃣ LOW CONFIDENCE HANDLING
    ───────────────────────────── */
    // If confidence is low OR intent is not allowed for this business
    if (
      intentResult.confidence < 0.6 ||
      (category.enabledIntents && !category.enabledIntents.includes(intentResult.intent))
    ) {
      const fallbackMsg = business.agentConfig?.responses?.lowConfidence || "Maaf kijiye, main samajh nahi paya. 🤔 Kya aap thoda detail mein batayenge?";
      
      // Send fallback
      await sendWhatsAppMessage(from, { text: fallbackMsg }, phoneNumberId);
      
      // Save agent response
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
    intentResult.originalMessage = msgBody;
    
    // Pass history to Agent Service for smarter replies
    const decision = await decideNextStep(intentResult, {
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
    
    // If text is missing or contains instruction placeholder, generate via AI
    if (!finalMessageText || finalMessageText.includes("[SYSTEM INSTRUCTION") || decision.useAI) {
       console.log("🤖 Generating AI Response...");
       finalMessageText = await generateAIResponse(business, intentResult, { ...decision, actionResult }, history);
    }

    // 📤 Send via WhatsApp
    await sendWhatsAppMessage(
      from, 
      {
        text: finalMessageText || "...", // Fallback text
        media: decision.media 
      }, 
      phoneNumberId
    );

    /* ─────────────────────────────
       9️⃣ TRACKING & LOGGING
    ───────────────────────────── */
    
    // 1. Save Agent Message to DB
    await Message.create({
      conversationId: conversation._id,
      from: "agent",
      text: finalMessageText,
    });

    // 2. Update Campaign Stats (If Broadcast)
    if (campaignId) {
        await Campaign.updateOne(
            { _id: campaignId },
            { $inc: { "stats.sent": 1 } }
        );
    }

    // 3. Audit Log
    await logEvent({
      businessId: business._id,
      conversationId: conversation._id,
      actorType: "ai",
      event: "ai_reply_sent",
      action: decision.action || "response_sent", 
      meta: {
        intent: intentResult.intent,
        hasMedia: !!decision.media
      }
    });

    // 4. Usage Update
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
    // Don't throw error to stop worker from crashing, just log it
    return { status: "failed", error: err.message };
  }
}