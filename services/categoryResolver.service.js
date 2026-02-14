/* ─────────────────────────────────────────────────────────────────
   🚀 AUTOMATIC CATEGORY RESOLVER & DEFAULTS
   
   Is file ka kaam hai Business Category ke hisaab se:
   1. Default Features (Intents) enable karna.
   2. Default Greetings (Hindi/English) set karna.
───────────────────────────────────────────────────────────────── */

// 1. Define Default Intents per Category
const CATEGORY_INTENTS = {
  crm: [
    "greeting", "product_inquiry", "pricing_request", "request_callback", "ask_features"
  ],
  real_estate: [
    "greeting", "search_property", "ask_location", "ask_budget", "schedule_site_visit", "ask_contact"
  ],
  support: [
    "greeting", "report_issue", "check_ticket_status", "request_human", "thank_you"
  ],
  adtech: [
    "greeting", "ask_services", "product_inquiry", "pricing_request", "request_human", "report_issue"
  ],
  appointment: [
    "greeting", "ask_services", "ask_price", "ask_hours", "book_appointment"
  ],
  other: [
    "greeting", "ask_services", "product_inquiry", "ask_price", "request_callback"
  ]
};

// 2. Define Default Responses (Hindi/Hinglish flavor preserved 🌶️)
const CATEGORY_RESPONSES = {
  crm: "Hello! 👋 Aap kis product ya service ke baare me jaanana chahte hain?",
  
  real_estate: "Hello! 👋 Aap kis area ya type ki property dekh rahe hain?",
  
  support: "Hello! 👋 Aap apni problem short me bata sakte hain?",
  
  appointment: "Hello! 👋 Aap kaise madad chahte hain? Appointment book karna hai?",
  
  adtech: "Hello! 🚀 Ready to scale your campaigns? Kaise help kar sakte hain?",
  
  other: "Hello! 👋 How can I help you today?"
};

export function resolveCategory(business) {
  // 1. Category Type nikalo
  const type = business.categoryType || "other";

  // 2. Default Intents uthao
  const defaultIntents = CATEGORY_INTENTS[type] || CATEGORY_INTENTS["other"];
  const dbIntents = business.agentConfig?.enabledIntents || [];

  // 3. Merge Intents (Unique)
  const finalIntents = [...new Set([...defaultIntents, ...dbIntents])];

  // 4. Greeting Logic (DB Override > Category Default)
  const dbGreeting = business.agentConfig?.responses?.greeting;
  const defaultGreeting = CATEGORY_RESPONSES[type] || CATEGORY_RESPONSES["other"];

  console.log(`🔍 Resolved Category: [${type}] | Greeting: "${dbGreeting || defaultGreeting}"`);

  return {
    type: type,
    enabledIntents: finalIntents,
    
    // Config object jo controller use karega default set karne ke liye
    config: {
      ...business.agentConfig,
      responses: {
        ...business.agentConfig?.responses,
        greeting: dbGreeting || defaultGreeting
      }
    }
  };
}