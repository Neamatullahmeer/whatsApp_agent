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
      📜 History String (Memory)
   -------------------------------------------------- */
  const historyContext = history 
    ? `\n=== CONVERSATION HISTORY (Last 5 messages) ===\n${history}\n==========================================\n`
    : "\n=== NO PREVIOUS HISTORY (New Conversation) ===\n";

  console.log("🧪 ContextString type:", typeof contextString); 

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0, // Strict logic for classification
      messages: [
        {
          role: "system",
          content: `
You are an intent and entity extraction engine for a WhatsApp business assistant.

${historyContext}

--------------------------------
🧠 CONTEXT AWARENESS RULES:
1. **Look at the HISTORY first.**
2. If the user answers "Yes", "Agreed", or provides a Date/Time, check the LAST message from the AGENT to determine context.
3. If the user is confirming a time for a visit, extract that time into 'entities.time' and 'entities.date'.

--------------------------------
ALLOWED INTENTS:
- greeting
- ask_services         (User asks what you do or for suggestions)
- ask_pricing
- ask_hours
- book_appointment     (Scheduling a call or meeting)
- search_property      (Real Estate specific)
- ask_budget           (Real Estate specific)
- ask_location         (Real Estate specific)
- schedule_site_visit  (Real Estate specific)
- request_human        (Talk to support)

--------------------------------
ENTITY EXTRACTION RULES (CRITICAL):

1. **BUSINESS TYPE (👇 NEW):**
   - If user mentions their industry or profession (e.g., "Real Estate", "Gym", "Salon", "Doctor", "Restaurant"), extract it to 'entities.business_type'.
   - Example: "I run a gym" -> business_type: "gym"
   - Example: "Real estate business suggestion?" -> business_type: "real_estate"

2. **APPOINTMENT / TIME:**
   - Date -> entities.date (e.g., "tomorrow", "sunday")
   - Time -> entities.time (e.g., "5pm", "morning")

3. **REAL ESTATE DETAILS:**
   - Budget / price -> entities.budget
   - City / area -> entities.location
   - Property -> entities.property_type (e.g., 2bhk, villa)

4. **SERVICE:**
   - Specific service name -> entities.service (e.g., "crm", "whatsapp bot")

--------------------------------
RULES:
- Respond ONLY in valid JSON.
- Do NOT explain anything.
- Confidence must be between 0 and 1.
- If entity is missing, set it to null.

--------------------------------
JSON FORMAT (STRICT):

{
  "intent": string,
  "confidence": number,
  "entities": {
    "service": string | null,
    "business_type": string | null,   
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
          role: "user",
          content: `Context:\n${contextString}\n\nUser Message:\n${String(userMessage)}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;
    
    // Clean up if Markdown code blocks are returned
    const cleanJson = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    console.log("📦 Raw model output:", cleanJson);

    const parsed = JSON.parse(cleanJson);
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
        business_type: null,
        date: null,
        time: null,
        budget: null,
        location: null,
        property_type: null
      }
    };
  }
}