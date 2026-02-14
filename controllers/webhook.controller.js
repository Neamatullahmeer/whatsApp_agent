import crypto from "crypto";
import { messageQueue } from "../queue/message.queue.js";
import { isAllowed } from "../services/rateLimiter.service.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js"; // 👈 Updated Import

/**
 * ✅ Webhook verification (GET)
 * Meta verifies if the URL is active.
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
 * * ROLE:
 * - Receive WhatsApp webhook
 * - Normalize message (Text & Image)
 * - Rate limit
 * - Push to queue (idempotent via jobId)
 */
export const handleWebhook = async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages || !Array.isArray(value.messages)) {
      return res.sendStatus(200);
    }

    // 🔑 Multi-tenant ID (Kaunse Business ke liye msg aaya)
    const phoneNumberId = value.metadata?.phone_number_id;

    for (const msg of value.messages) {
      
      // ❌ Ignore self-sent messages (Loop prevention)
      if (msg.from_me) continue;

      // 🛠️ EXTRACT CONTENT (TEXT OR IMAGE)
      let msgBody = "";
      let msgType = msg.type;

      if (msgType === "text") {
        msgBody = msg.text?.body?.trim();
      } 
      else if (msgType === "image") {
        // Agar Image hai, toh Caption uthao ya placeholder do
        // (Worker isse AI ko batayega ki "User sent an image")
        msgBody = msg.image?.caption || "[User sent an image]"; 
      }
      else {
        // Audio/Video/Document abhi ignore kar rahe hain
        continue; 
      }

      if (!msgBody) continue; // Empty message skip

      const from = msg.from;

      /**
       * 🔑 Message ID (WhatsApp-first, fallback safe)
       */
      const messageId =
        msg.id ||
        crypto
          .createHash("sha1")
          .update(`${phoneNumberId}|${from}|${msgBody}`)
          .digest("hex");

      /**
       * 🔒 Rate limit (per user)
       * 10 messages per 60 seconds allowed
       */
      if (!(await isAllowed(`rl:user:${from}`, 10, 60))) {
        console.warn(`⚠️ Rate limit exceeded for ${from}`);
        
        // 🚀 Updated: Using new service signature
        await sendWhatsAppMessage(
          from,
          { text: "⚠️ You are sending messages too fast. Please wait a minute. ⏳" },
          phoneNumberId
        );
        continue;
      }

      /**
       * 📥 Queue push
       * Worker will handle AI logic & Database
       */
      await messageQueue.add(
        "incoming-message",
        {
          phoneNumberId,
          from,
          msgBody, // Caption or Text
          msgType, // 'text' or 'image' (Worker needs this info)
          messageId,
          timestamp: msg.timestamp
        },
        {
          jobId: messageId, // 🔥 SAME ID → SAME JOB (NO DUPES)
          removeOnComplete: true,
          attempts: 3 // Retry logic if worker fails
        }
      );

      console.log(`📥 Job queued: ${messageId} | Type: ${msgType}`);
    }

    // ✅ Always 200 (WhatsApp retry safe)
    return res.sendStatus(200);
    
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.sendStatus(200); // Crash hone par bhi Meta ko 200 do taaki retry loop na bane
  }
};