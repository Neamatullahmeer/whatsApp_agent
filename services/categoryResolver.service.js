import { CATEGORY_REGISTRY } from "../categories/categoryRegistry.js";

/* ─────────────────────────────────────────────────────────────────
   🚀 AUTOMATIC CATEGORY RESOLVER
   
   Is file ka kaam hai Business Category ke hisaab se 
   "Default Features" automatically enable karna.
   
   Fayda: Baar-baar Database mein 'enabledIntents' update nahi karna padega.
───────────────────────────────────────────────────────────────── */

// 1. Define Default Intents per Category
const CATEGORY_DEFAULTS = {
  // 🏢 CRM & SAAS BUSINESS
  crm: [
    "greeting",
    "ask_services",       // Industry pitch / "Kya karte ho?"
    "product_inquiry",    // Features & Sales
    "pricing_request",    // Price puchna
    "ask_price",          // (Alternate)
    "book_appointment",   // Demo/Meeting
    "request_callback",
    "report_issue",
    "check_ticket_status",
    "request_human"
  ],

  // 🏠 REAL ESTATE BUSINESS
  real_estate: [
    "greeting",
    "ask_services",       // "Real estate business hai mera"
    "search_property",    // "2BHK Pune mein chahiye"
    "ask_budget",
    "ask_location",
    "schedule_site_visit", // "Site visit kab karu?"
    "book_appointment",    // (Backup for visit)
    "request_callback",
    "request_human",
    "ask_hours"
  ],

  // 🏥 HEALTHCARE / CLINIC (Future Use)
  healthcare: [
    "greeting",
    "book_appointment",   // Doctor appointment
    "ask_services",
    "ask_price",          // Consultation fee
    "request_human"
  ],

  // 🛒 GENERIC / OTHER (Fallback)
  other: [
    "greeting",
    "ask_services",
    "product_inquiry",
    "ask_price",
    "request_callback",
    "request_human"
  ]
};

export function resolveCategory(business) {
  // 1. Business ka category type nikalo (Database se)
  // Agar null hai, toh 'other' maano.
  const type = business.categoryType || "other";

  // 2. Us category ke Code-Level Default Intents uthao
  const defaultIntents = CATEGORY_DEFAULTS[type] || CATEGORY_DEFAULTS["other"];

  // 3. Agar DB mein kuch EXTRA intents enable kiye hain toh wo bhi lelo
  // (Client specific customization ke liye)
  const dbIntents = business.agentConfig?.enabledIntents || [];

  // 4. 🔥 THE MAGIC MERGE 🔥
  // Code Defaults + DB Custom Intents ko jod do.
  // Set use karke duplicates hata do.
  const finalIntents = [...new Set([...defaultIntents, ...dbIntents])];

  console.log(`🔍 Resolved Category: [${type}] | Active Intents: ${finalIntents.length}`);

  return {
    type: type,
    enabledIntents: finalIntents, // Ab ye list Handler ko milegi
    config: business.agentConfig || {}
  };
}