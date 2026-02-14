/* =========================================================================
   🧠 AGENT BRAIN (Decision Logic)
   Path: src/services/agent.service.js
   Description: Decides WHAT to do based on Intent & Entities
   ========================================================================= */

import { ACTIONS } from "../constants/actionTypes.js";

// 📦 Standard Services Menu (Hardcoded for generic replies)
const SERVICES_MENU_TEXT = `Humare paas ye options available hain: 👇

*1. WhatsApp Automation*
   💰 1500 INR/Month

*2. CRM Integration*
   💰 5000 INR

*3. Email Marketing*
   💰 3000 INR

Aap kiske baare mein aur details (ya photos 📸) dekhna chahenge?`;

/**
 * Decides the next action and response message.
 * @param {Object} intentResult - The output from detectIntent { intent, entities, confidence }
 * @param {Object} context - { business, category, history, userMessage }
 */
export function decideNextStep(intentResult, context) {
  const { intent, entities } = intentResult;

  console.log("🤔 [AgentService] Deciding next step for:", intent);

  // 🛡️ Default Decision Object
  let decision = {
    action: ACTIONS.NONE,
    message: null,
    media: null,
    useAI: false // 👈 New Flag: If true, messageHandler will generate text via LLM
  };

  switch (intent) {
    
    // -----------------------------------------------------
    // 👋 GREETING
    // -----------------------------------------------------
    case "greeting":
      decision.action = ACTIONS.SEND_TEXT;
      decision.message = "Hello 👋 Welcome to SmartBiz CRM Support. How can we help you today?";
      break;

    // -----------------------------------------------------
    // 🛠️ ASK SERVICES (Modified for Business Logic)
    // -----------------------------------------------------
    case "ask_services":
      
      // ✅ CASE 1: Business Type Detected (e.g., "Real Estate")
      if (entities && entities.business_type) {
        console.log("💡 Context Found: User is in", entities.business_type);
        
        decision.action = ACTIONS.SEND_TEXT;
        decision.useAI = true; // 👈 Forces messageHandler to call generateAIResponse
        
        // Hum AI ko instruction bhej rahe hain taaki wo dynamic reply banaye
        decision.message = `[SYSTEM INSTRUCTION: The user has a '${entities.business_type}' business. 
        Instead of listing all services, recommend only the ONE or TWO services from (WhatsApp Automation, CRM, Email Marketing) that are best for '${entities.business_type}'.
        Explain WHY it helps their specific business in 1-2 sentences (Hinglish).]`;
      
      } 
      // ❌ CASE 2: No Business Type (Generic Query)
      else {
        decision.action = ACTIONS.SEND_TEXT;
        decision.message = SERVICES_MENU_TEXT;
      }
      break;

    // -----------------------------------------------------
    // 💰 ASK PRICE
    // -----------------------------------------------------
    case "ask_pricing":
      decision.action = ACTIONS.SEND_TEXT;
      // Agar specific service ka price poocha hai
      if (entities && entities.service) {
         decision.useAI = true;
         decision.message = `[SYSTEM INSTRUCTION: User asked price for '${entities.service}'. Tell them it starts from standard rates but depends on customization. Ask for requirements.]`;
      } else {
         decision.message = "Pricing starts at 1500 INR/month. Kaunsi service ka price janna chahenge aap?";
      }
      break;

    // -----------------------------------------------------
    // 📅 BOOK APPOINTMENT / SITE VISIT
    // -----------------------------------------------------
    case "schedule_site_visit":
    case "book_appointment":
      decision.action = ACTIONS.SEND_TEXT;
      
      if (entities.date && entities.time) {
        decision.message = `Great! I have noted your request for ${entities.date} at ${entities.time}. Our team will confirm shortly.`;
        // Future: Add functionality to actually save to DB
      } else if (entities.date) {
        decision.message = `Okay, ${entities.date} works. What time should we meet?`;
      } else {
        decision.message = "Sure! When would you like to schedule this? (Date and Time)";
      }
      break;

    // -----------------------------------------------------
    // 🏠 REAL ESTATE SPECIFIC
    // -----------------------------------------------------
    case "ask_budget":
      decision.action = ACTIONS.SEND_TEXT;
      decision.message = "Humare paas properties 50 Lakhs se lekar 5 Cr tak available hain. Aapka budget range kya hai?";
      break;

    case "ask_location":
      decision.action = ACTIONS.SEND_TEXT;
      decision.message = "Hum abhi Mumbai, Pune aur Bangalore mein active hain. Aap kahan property dhoond rahe hain?";
      break;

    // -----------------------------------------------------
    // 📞 HUMAN HANDOFF
    // -----------------------------------------------------
    case "request_human":
      decision.action = ACTIONS.HUMAN_HANDOFF; // This should trigger status change in DB
      decision.message = "Okay, main ek human agent ko connect kar raha hoon. Please wait...";
      break;

    // -----------------------------------------------------
    // ❓ UNKNOWN / FALLBACK
    // -----------------------------------------------------
    default:
      decision.action = ACTIONS.SEND_TEXT;
      decision.useAI = true; // Use AI to handle small talk or unknown queries politely
      decision.message = `[SYSTEM INSTRUCTION: User said: "${context.userMessage}". Reply politely saying you are a support bot and can help with Services, Pricing, or Appointments.]`;
      break;
  }

  return decision;
}