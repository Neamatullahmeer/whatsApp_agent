import crypto from "crypto";
import { messageQueue } from "../queue/message.queue.js";
import { isAllowed } from "../services/rateLimiter.service.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";
import { Business } from "../shared/models/Business.model.js"; // 👈 Business Model Import
import { Lead } from "../shared/models/Lead.model.js";         // 👈 Lead Model Import

/**
 * ✅ Webhook verification (GET)
 */
export const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

/**
 * ✅ Handle incoming WhatsApp messages (POST)
 */
export const handleWebhook = async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages || !Array.isArray(value.messages)) {
      return res.sendStatus(200);
    }

    // 1. WhatsApp Business ID nikalo
    const phoneNumberId = value.metadata?.phone_number_id;

    // 2. Database se Business dhoondo (Taaki humein Business ka _id mile)
    // ⚠️ Note: Yeh step zaroori hai kyunki Lead model ko 'businessId' (ObjectId) chahiye
    const business = await Business.findOne({ phoneNumberId });

    if (!business) {
      console.error(`❌ Business not found for Phone ID: ${phoneNumberId}`);
      return res.sendStatus(200);
    }

    // 3. User ka Profile Name nikalo (WhatsApp aksar ye 'contacts' array me bhejta hai)
    const profileName = value.contacts?.[0]?.profile?.name || "Unknown User";

    for (const msg of value.messages) {
      if (msg.from_me) continue; // Ignore self-sent

      // --- Content Extraction ---
      let msgBody = "";
      let msgType = msg.type;

      if (msgType === "text") {
        msgBody = msg.text?.body?.trim();
      } else if (msgType === "image") {
        msgBody = msg.image?.caption || "[User sent an image]";
      } else {
        continue; // Audio/Video ignore for now
      }

      if (!msgBody) continue;

      const from = msg.from; // User's Phone Number

      // 🔥 UNIVERSAL SAVE / UPDATE LOGIC 🔥
      // Queue me dalne se pehle DB me entry ensure karo
      await Lead.findOneAndUpdate(
        { 
          businessId: business._id, 
          userPhone: from 
        },
        {
          $set: {
            profileName: profileName, // Naam update karo agar badla ho
            lastActive: new Date(),   // Abhi online aaya
            source: "whatsapp_bot"
          },
          $setOnInsert: {
            // Agar pehli baar aaya hai to ye fields set hongi
            type: "visitor", 
            stage: "new",
            data: {}
          }
        },
        { upsert: true, new: true } // Upsert: Nahi hai to banao, Hai to update karo
      );

      // --- Rate Limiting ---
      if (!(await isAllowed(`rl:user:${from}`, 10, 60))) {
        console.warn(`⚠️ Rate limit exceeded for ${from}`);
        await sendWhatsAppMessage(
          from,
          { text: "⚠️ You are sending messages too fast. Please wait a minute. ⏳" },
          phoneNumberId
        );
        continue;
      }

      // --- Message ID ---
      const messageId = msg.id || crypto.createHash("sha1").update(`${phoneNumberId}|${from}|${msgBody}`).digest("hex");

      // --- Push to Queue ---
      await messageQueue.add(
        "incoming-message",
        {
          businessId: business._id, // 🔥 Worker ko bhi Business ID bhejo
          phoneNumberId,
          from,
          profileName,
          msgBody,
          msgType,
          messageId,
          timestamp: msg.timestamp
        },
        {
          jobId: messageId,
          removeOnComplete: true,
          attempts: 3
        }
      );

      console.log(`📥 Job queued: ${messageId} | User: ${profileName} (${from})`);
    }

    return res.sendStatus(200);

  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.sendStatus(200);
  }
};