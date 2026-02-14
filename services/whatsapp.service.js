import axios from "axios";

/**
 * 📨 SEND MESSAGE (TEXT OR IMAGE)
 * Ye function check karega ki Media hai ya Text, aur us hisaab se bheja.
 */
export async function sendWhatsAppMessage(to, messageData, phoneNumberId) {
  const mode = process.env.WHATSAPP_MODE || "mock"; // Default: MOCK (Testing)

  // Message Data Destructuring
  const { text, media } = messageData; 

  /* =========================
     🧪 MOCK MODE (CONSOLE LOG ONLY)
     Bina API ke test karne ke liye.
  ========================= */
  if (mode === "mock") {
    console.log("\n📤 =========================================");
    console.log("🚀 [WHATSAPP OUTGOING - MOCK]");
    console.log(`📱 To: ${to}`);
    
    if (media && media.type === "image") {
      console.log("🖼️  IMAGE SENT");
      console.log(`🔗 URL: ${media.url}`);
      console.log(`📝 Caption: ${media.caption || text}`);
    } else {
      console.log("💬 TEXT SENT");
      console.log(`📄 Body: ${text}`);
    }
    
    console.log("📤 =========================================\n");
    return { success: true, mode: "mock" };
  }

  /* =========================
     🚀 LIVE MODE (REAL WHATSAPP API)
     Jab API key aa jaye, tab ye chalega.
  ========================= */
  
  if (!phoneNumberId) {
    console.error("❌ ERROR: phoneNumberId missing for Live WhatsApp API");
    throw new Error("phoneNumberId missing");
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const token = process.env.WHATSAPP_TOKEN;

  let payload = {
    messaging_product: "whatsapp",
    to: to,
  };

  // 1. 🖼️ SEND IMAGE
  if (media && media.type === "image") {
    payload.type = "image";
    payload.image = {
      link: media.url,
      caption: media.caption || text // Caption me text daal do
    };
  } 
  // 2. 💬 SEND TEXT
  else {
    payload.type = "text";
    payload.text = { body: text };
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;

  } catch (error) {
    console.error("❌ WhatsApp API Error:", error.response?.data || error.message);
    throw new Error("Failed to send WhatsApp message");
  }
}
