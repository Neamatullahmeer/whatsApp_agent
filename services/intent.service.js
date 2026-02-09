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
// 👇 UPDATE: Added 'history' parameter
export async function detectIntent({ context, userMessage, history }) {
  console.log("🧠 [IntentService] detectIntent called");
  console.log("➡️ User message:", userMessage);

  /* -------------------------------------------------
     🔒 Context String (Business Data)
  -------------------------------------------------- */
  const contextString = `
BUSINESS PROFILE:
${JSON.stringify(context?.business || {}, null, 2)}

CATEGORY RULES:
${JSON.stringify(context?.category || {}, null, 2)}
`;

  /* -------------------------------------------------
     📜 History String (Memory) - NEW
  -------------------------------------------------- */
  const historyContext = history 
    ? `\n=== CONVERSATION HISTORY (Last 5 messages) ===\n${history}\n==========================================\n`
    : "\n=== NO PREVIOUS HISTORY (New Conversation) ===\n";

  console.log("🧪 ContextString type:", typeof contextString); 

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0, // Strict logic
      messages: [
        {
          role: "system",
          content: `
You are an intent and entity extraction engine for a WhatsApp business assistant.

${historyContext}  <-- 🧠 THIS IS THE MEMORY

--------------------------------
🧠 CONTEXT AWARENESS RULES (CRITICAL):
1. **Look at the HISTORY first.**
2. If the user answers "Yes", "Agreed", or provides a Date/Time (e.g., "Sunday", "Tomorrow"), check the LAST message from the AGENT.
   - If Agent asked about a Site Visit -> Intent is 'schedule_site_visit' or 'book_appointment'.
   - If Agent asked about Budget -> Intent is 'ask_budget'.
   - If Agent asked about Location -> Intent is 'ask_location'.
3. Do NOT classify as "ask_hours" unless the user explicitly asks "When are you open?" or "What are your timings?".
4. If the user is confirming a time for a visit, extract that time into 'entities.time' and 'entities.date'.

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
ENTITY RULES:

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
          content: contextString   // ✅ Business Data
        },
        {
          role: "user",
          content: String(userMessage) // ✅ User's Current Message
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

    // 🔒 SAFE FALLBACK
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