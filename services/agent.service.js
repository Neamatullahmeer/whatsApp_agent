/* =========================================================================
   🧠 AGENT BRAIN (Decision Logic Only)
   Path: src/services/agent.service.js
   Description: ONLY decides the Action and Payload. 
   Actual execution happens in actionDispatcher.service.js
   ========================================================================= */

import { ACTIONS } from "../constants/actionTypes.js";

const PRICING_CONFIG = {
  whatsapp: "1500 INR/Month",
  crm: "5000 INR",
  email: "3000 INR",
  base: "1500 INR/month"
};

const SERVICES_MENU_TEXT = `Humare paas ye options available hain: 👇
*1. WhatsApp Automation* - 💰 ${PRICING_CONFIG.whatsapp}
*2. CRM Integration* - 💰 ${PRICING_CONFIG.crm}
*3. Email Marketing* - 💰 ${PRICING_CONFIG.email}

Aap kiske baare mein aur details dekhna chahenge?`;

export async function decideNextStep(intentResult, context) {
  const { intent, entities = {} } = intentResult || {};
  const { profileName } = context;

  console.log(`🤔 [AgentBrain] Deciding for Intent: ${intent}`);

  let decision = {
    action: ACTIONS.NONE,
    payload: {}, // Dispatcher isi payload ko use karega
    message: null,
    useAI: false
  };

  switch (intent) {
    // -----------------------------------------------------
    // 👋 GREETING
    // -----------------------------------------------------
    case "greeting":
      decision.action = ACTIONS.NONE; // Sirf text bhejna hai, koi DB action nahi
      const greetingName = profileName && profileName !== "Unknown User" ? ` ${profileName}` : "";
      decision.message = `Hello${greetingName}! 👋 Welcome to SmartBiz. How can we help?`;
      break;

    // -----------------------------------------------------
    // 🛠️ ASK SERVICES / PRICING (Lead Promotion)
    // -----------------------------------------------------
    case "ask_services":
    case "ask_pricing":
      // Dispatcher ko bolo ki ise Lead bana de
      decision.action = ACTIONS.CREATE_LEAD;
      decision.payload = { stage: 'contacted', type: 'lead' };

      if (intent === "ask_pricing" && entities?.service) {
        decision.useAI = true;
        decision.message = `[SYSTEM INSTRUCTION: Explain pricing for ${entities.service} based on base price ${PRICING_CONFIG.base}.]`;
      } else if (intent === "ask_services") {
        decision.message = SERVICES_MENU_TEXT;
      }
      break;

    // -----------------------------------------------------
    // 📅 BOOK APPOINTMENT (Pure Payload)
    // -----------------------------------------------------
    case "schedule_site_visit":
    case "book_appointment":
      const { date, time, service } = entities;

      if (date && time) {
        decision.action = ACTIONS.CREATE_APPOINTMENT;
        decision.payload = { date, time, service: service || "General Inquiry" };
        decision.message = `Great! Maine aapki meeting fix kar di hai:\n📅 *${date}*\n⏰ *${time}*\n\nHumari team jald hi call karegi. ✅`;
      } else {
        decision.message = "Zaroor! Aap kis din aur waqt milna chahenge?";
      }
      break;

    // -----------------------------------------------------
    // 📞 HUMAN HANDOFF (Smart Routing)
    // -----------------------------------------------------
    case "request_human":
      decision.action = ACTIONS.ESCALATE_TO_HUMAN;
      // Dispatcher ko batana hai ki kis department mein bhejnat hai
      decision.payload = { department: entities?.service === "crm" ? "sales" : "support" };
      decision.message = "Okay, main aapko ek expert agent se connect kar raha hoon. Please wait...";
      break;

    // -----------------------------------------------------
    // ❓ UNKNOWN / FALLBACK
    // -----------------------------------------------------
    default:
      decision.action = ACTIONS.NONE;
      decision.useAI = true;
      decision.message = `[SYSTEM INSTRUCTION: Reply politely to "${context.userMessage}".]`;
      break;
  }

  return decision;
}