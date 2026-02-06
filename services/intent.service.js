import OpenAI from "openai";

/* =========================
   🔍 ENV CHECK
========================= */
console.log("🔍 [IntentService] ENV CHECK");
console.log(
  "OPENAI_API_KEY loaded:",
  process.env.OPENAI_API_KEY
    ? "✅ YES (length: " + process.env.OPENAI_API_KEY.length + ")"
    : "❌ NO"
);

/* =========================
   🤖 OpenAI Client
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log("🤖 [IntentService] OpenAI client initialized");

/* =========================
   🧠 Intent Detection
========================= */
export async function detectIntent({ context, userMessage }) {
  console.log("🧠 [IntentService] detectIntent called");
  console.log("➡️ User message:", userMessage);

  /* -------------------------------------------------
     🔒 VERY IMPORTANT
     OpenAI NEVER accepts object in message.content
  -------------------------------------------------- */
  const contextString = `
BUSINESS:
${JSON.stringify(context?.business || {}, null, 2)}

CATEGORY:
${JSON.stringify(context?.category || {}, null, 2)}
`;

  console.log("🧪 ContextString type:", typeof contextString); // must be "string"

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are an intent and entity extraction engine for a WhatsApp business assistant.

--------------------------------
ALLOWED INTENTS:
- greeting
- ask_services
- ask_price
- ask_hours
- book_appointment

REAL ESTATE:
- search_property
- ask_budget
- ask_location
- schedule_site_visit

SALES / CRM:
- product_inquiry
- pricing_request
- request_callback

SUPPORT:
- report_issue
- check_ticket_status
- request_human

--------------------------------
ENTITY RULES (VERY IMPORTANT)

APPOINTMENT:
- Service name → entities.service
- Date → entities.date
- Time → entities.time

REAL ESTATE:
- Budget / price / lakh / crore → entities.budget
- City / area / location → entities.location
- 1 bhk / 2 bhk / flat / villa → entities.property_type
- NEVER put real-estate info in "service"

--------------------------------
RULES:
- Respond ONLY in valid JSON
- Do NOT explain anything
- confidence must be between 0 and 1
- ALWAYS return all entity keys
- If entity is missing, set it to null

--------------------------------
JSON FORMAT (STRICT):

{
  "intent": string,
  "confidence": number,
  "entities": {
    "service": string | null,
    "date": string | null,
    "time": string | null,
    "budget": string | null,
    "location": string | null,
    "property_type": string | null
  }
}
          `
        },
        {
          role: "system",
          content: contextString   // ✅ STRING ONLY
        },
        {
          role: "user",
          content: String(userMessage) // ✅ STRING ONLY
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;
    console.log("📦 Raw model output:", raw);

    const parsed = JSON.parse(raw);
    console.log("✅ Parsed intent result:", parsed);

    return parsed;
  } catch (error) {
    console.error("❌ [IntentService] ERROR while detecting intent");
    console.error(error.message);

    // 🔒 SAFE FALLBACK (never throw from here)
    return {
      intent: "unknown",
      confidence: 0,
      entities: {
        service: null,
        date: null,
        time: null,
        budget: null,
        location: null,
        property_type: null
      }
    };
  }
}
