import { Business } from "../../shared/models/Business.model.js";
import { Conversation } from "../../shared/models/Conversation.model.js";
import { Message } from "../../shared/models/Message.model.js";
import { Usage } from "../../shared/models/Usage.model.js";

import { detectIntent } from "../../services/intent.service.js";
import { decideNextStep } from "../../services/agent.service.js";
import { dispatchAction } from "../../services/actionDispatcher.service.js";
// import { sendTextMessage } from "../../services/whatsapp.service.js"; 

// AI Response Generator Import
import { generateAIResponse } from "../../services/response.generator.js";

import { resolveCategory } from "../../services/categoryResolver.service.js";
import { isDuplicateMessage } from "../../services/messageDedup.service.js";

import { ACTIONS } from "../../constants/actionTypes.js";

export async function handleIncomingMessage(job) {
  const {
    phoneNumberId,
    from,
    msgBody,
    messageId
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
    console.log("✅ [STEP 0] Message is unique");

    /* ─────────────────────────────
       1️⃣ LOAD BUSINESS
    ───────────────────────────── */
    const business = await Business.findOne({ phoneNumberId });
    if (!business || business.status !== "active") {
      console.log("❌ [STOP] Business not found or inactive");
      return { status: "ignored", reason: "business_inactive" };
    }

    /* ─────────────────────────────
       2️⃣ ENSURE CONVERSATION
    ───────────────────────────── */
    let conversation = await Conversation.findOne({
      businessId: business._id,
      userPhone: from,
      status: "active"
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

    /* ─────────────────────────────
       3️⃣ SAVE USER MESSAGE
    ───────────────────────────── */
    await Message.create({
      conversationId: conversation._id,
      from: "user",
      text: msgBody,
      messageId
    });

    /* ─────────────────────────────
       4️⃣ USAGE UPDATE
    ───────────────────────────── */
    const month = new Date().toISOString().slice(0, 7);
    await Usage.updateOne(
      { businessId: business._id, month },
      { $inc: { messages: 1 } },
      { upsert: true }
    );

    /* ─────────────────────────────
       4.5️⃣ FETCH CONVERSATION HISTORY (MEMORY LAYER)
    ───────────────────────────── */
    // Pichle 5 messages nikalo (Recent to Old)
    const rawHistory = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 }) // Newest first
      .limit(6); // Current msg + 5 old

    // Chronological order me convert karo (Old -> New)
    const history = rawHistory
      .reverse()
      .map(msg => `${msg.from === "user" ? "User" : "Agent"}: ${msg.text}`)
      .join("\n");

    console.log(`🧠 Context Loaded: ${rawHistory.length - 1} previous messages.`);

    /* ─────────────────────────────
       5️⃣ CATEGORY & INTENT
    ───────────────────────────── */
    const category = resolveCategory(business);

    console.log("🧠 [STEP 6] Detecting Intent with Context...");

    // 👇 History pass kar rahe hain intent detection ke liye
    const intentResult = await detectIntent({
      context: { business, category },
      userMessage: msgBody,
      history: history
    });

    console.log(`📦 Intent Detected: ${intentResult.intent} (Conf: ${intentResult.confidence})`);

    /* ─────────────────────────────
       6️⃣ LOW CONFIDENCE / FALLBACK
    ───────────────────────────── */
    if (
      intentResult.confidence < 0.6 ||
      !category.enabledIntents.includes(intentResult.intent)
    ) {
      const fallback =
        business.agentConfig?.responses?.lowConfidence ||
        "Mujhe thoda confusion ho raha hai 🙂";

      console.log("\n🔸🔸🔸 [MOCK WHATSAPP REPLY] 🔸🔸🔸");
      console.log(`📤 Sending to: ${from}`);
      console.log(`💬 Message: "${fallback}"`);
      console.log("🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸\n");

      await Message.create({
        conversationId: conversation._id,
        from: "agent",
        text: fallback
      });

      return { status: "success", type: "fallback" };
    }

    /* ─────────────────────────────
       7️⃣ DECISION & ACTION (LOGIC LAYER)
    ───────────────────────────── */
    intentResult.originalMessage = msgBody;
    const decision = decideNextStep(intentResult, {
      business,
      category
    });

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
       8️⃣ AI RESPONSE GENERATION (LANGUAGE LAYER)
    ───────────────────────────── */
    console.log("🤖 Generating AI Response...");

    intentResult.originalMessage = msgBody;

    const aiContext = {
      ...decision,
      actionResult
    };

    // 👇 UPDATED: Pass 'history' to AI generator so it remembers context
    const aiReply = await generateAIResponse(business, intentResult, aiContext, history);

    if (aiReply) {
      console.log("\n🔹🔹🔹 [AI GENERATED REPLY] 🔹🔹🔹");
      console.log(`📤 Sending to: ${from}`);
      console.log(`💬 Message: "${aiReply}"`);
      console.log("🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹\n");

      // await sendTextMessage(from, aiReply, phoneNumberId); 

      await Message.create({
        conversationId: conversation._id,
        from: "agent",
        text: aiReply
      });
    }

    console.log("✅ [FINISHED] Job processed successfully:", messageId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return { status: "success", action: decision.action };

  } catch (err) {
    console.error("❌ [FATAL ERROR] Job failed inside handler:", messageId);
    console.error(err);
    throw err;
  }
}