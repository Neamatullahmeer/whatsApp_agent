import crypto from "crypto";
import { messageQueue } from "../queue/message.queue.js";
import { isAllowed } from "../services/rateLimiter.service.js";
import { sendTextMessage } from "../services/whatsapp.service.js";

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
 *
 * ROLE:
 * - Receive WhatsApp webhook
 * - Normalize message
 * - Rate limit
 * - Push to queue (idempotent via jobId)
 *
 * ❗ NO business logic
 * ❗ NO dedup DB writes
 */
export const handleWebhook = async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages || !Array.isArray(value.messages)) {
      return res.sendStatus(200);
    }

    const phoneNumberId = value.metadata?.phone_number_id;

    for (const msg of value.messages) {
      // ❌ Ignore non-text / self messages
      if (msg.from_me || msg.type !== "text") continue;

      const msgBody = msg.text?.body?.trim();
      if (!msgBody) continue;

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
       */
      if (!(await isAllowed(`rl:user:${from}`, 10, 60))) {
        await sendTextMessage(
          from,
          "⚠️ Aap bahut tez messages bhej rahe hain. Thoda ruk kar try karein 🙂"
        );
        continue;
      }

      /**
       * 📥 Queue push
       * 🔐 BullMQ dedup via jobId
       */
      await messageQueue.add(
        "incoming-message",
        {
          phoneNumberId,
          from,
          msgBody,
          messageId
        },
        {
          jobId: messageId, // 🔥 SAME ID → SAME JOB (NO DUPES)
          removeOnComplete: true
        }
      );

      console.log("📥 Job queued:", messageId);
    }

    // ✅ Always 200 (WhatsApp retry safe)
    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.sendStatus(200);
  }
};
