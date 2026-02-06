/* import axios from "axios";

export async function sendTextMessage(to, body) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}*/

import axios from "axios";

export async function sendTextMessage(to, text, phoneNumberId, meta = {}) {
  const mode = process.env.WHATSAPP_MODE || "live";

  /* =========================
     🧪 MOCK MODE (NO API CALL)
  ========================= */
  if (mode === "mock") {
    console.log("\n📤 ================================");
    console.log("📤 [AGENT FINAL REPLY]");
    console.log("➡️ To:", to);
    console.log("💬 Message:", text);
    if (meta.intent) console.log("🧠 Intent:", meta.intent);
    if (meta.confidence !== undefined)
      console.log("📊 Confidence:", meta.confidence);
    console.log("📤 ================================\n");
    return;
  }

  /* =========================
     🚀 LIVE WHATSAPP MODE
  ========================= */
  if (!phoneNumberId) {
    throw new Error("❌ phoneNumberId missing for WhatsApp API");
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  return axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

