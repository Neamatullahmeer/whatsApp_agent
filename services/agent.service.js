import { ACTIONS } from "../constants/actionTypes.js";

export function decideNextStep(intentResult, context = {}) {
  const { intent, entities = {} } = intentResult;
  const { business } = context;

  // User ka original message (intentResult ya context se nikalo)
  // Note: Ensure karna ki handler.js mein aap ye pass kar rahe ho
  const userMsg = (intentResult.originalMessage || context.userMessage || "").toLowerCase();

  switch (intent) {
    /* ---------------- GREETING ---------------- */
    /* ---------------- SMART GREETING / CLOSING ---------------- */
    case "greeting":
      // Keywords check karo: Kya ye 'Hello' hai ya 'Bye/Thanks'?
      const isClosing = userMsg.includes("bye") ||
        userMsg.includes("shukriya") ||
        userMsg.includes("thanks") ||
        userMsg.includes("thank you") ||
        (userMsg.includes("nahi") && userMsg.includes("ji")); // "Ji nahi" logic

      if (isClosing) {
        return {
          message: "User is saying Thanks or Goodbye. Reply politely: 'You're welcome! Have a great day! 👋'",
          action: ACTIONS.NONE
        };
      }

      // Agar ye normal Hello hai, toh DB wala greeting uthao
      const dbGreeting = business?.agentConfig?.responses?.greeting;
      return {
        message: dbGreeting || "Hello! 👋 How can I help you today?",
        action: ACTIONS.NONE
      };
    /* ---------------- ASK SERVICES / INDUSTRY PITCH (NEW 🚀) ---------------- */
    case "ask_services":
      return {
        message: `User is talking about their Business Industry or asking 'What do you do?'.
        
        INSTRUCTION FOR AI:
        1. If the user mentioned a specific Industry (e.g., Real Estate, Gym, Clinic, Salon), ACKNOWLEDGE it enthusiastically.
        2. PITCH a specific benefit for THAT industry.
           - Real Estate: Mention "Auto-sending Property Photos, Brochures & Site Visit Reminders".
           - Healthcare/Clinic: Mention "Appointment Reminders & Patient Follow-ups".
           - Education: Mention "Student Updates & Fee Reminders".
           - Retail/E-commerce: Mention "Order Updates & Abandoned Cart Recovery".
           - General: Mention "Automating 24/7 Support & Lead Collection".
        3. End by asking: "Shall I show you a specific DEMO for your industry?"`,
        action: ACTIONS.NONE
      };

    /* ---------------- PRODUCT INQUIRY (SMART SALES 🧠) ---------------- */
    case "product_inquiry":
      const interest = entities.product || entities.service;

      // 1️⃣ CHECK: Kya user buying mood mein hai? (Stop explaining, Start selling)
      if (userMsg.includes("chahiye") || userMsg.includes("buy") || userMsg.includes("interested") || userMsg.includes("purchase") || userMsg.includes("want")) {
        return {
          message: `User explicitly wants to BUY/GET '${interest || "your service"}'. 
                    Don't explain features anymore. 
                    Enthusiastically accept the request.
                    Tell them you are noting down their request.
                    Ask for their Name or Email to finalize.`,
          action: ACTIONS.CREATE_LEAD, // 🔥 Seedha Lead banao
          payload: { interest }
        };
      }

      if (!interest) {
        // Agar product specify nahi kiya
        const allServices = business.services?.map(s => s.name).join(", ") || "our services";
        return {
          message: `List these services: ${allServices}. Ask which one they want to know about.`,
          action: ACTIONS.ASK_MISSING_INFO
        };
      }

      // 2️⃣ DB LOOKUP: Product Knowledge nikalna
      const serviceDetails = business.services?.find(s =>
        s.name.toLowerCase().includes(interest.toLowerCase())
      );

      if (serviceDetails) {
        // 🔥 Found in DB! AI ko bolo features samjhaye
        return {
          message: `User asked about '${serviceDetails.name}'. 
                    Explain these FEATURES enthusiastically: "${serviceDetails.description}". 
                    
                    Start with "Great choice!"
                    After explaining, ask: "Would you like to see a Live Demo or check Pricing?"`,
          action: ACTIONS.NONE
        };
      } else {
        // Not found in DB
        return {
          message: `We provide ${interest}. Ask if they want to arrange a call to discuss custom requirements.`,
          action: ACTIONS.CREATE_LEAD,
          payload: { interest }
        };
      }

    /* ---------------- PRICE / BUDGET ---------------- */
    case "ask_price":
    case "pricing_request":
      const product = entities.product || entities.service;

      // DB se price nikalo
      const priceInfo = product
        ? business.services?.find(s => s.name.toLowerCase().includes(product.toLowerCase()))
        : null;

      if (priceInfo) {
        return {
          message: `User asked price for ${priceInfo.name}. 
                    Tell them the price is **${priceInfo.price}**. 
                    Add a quick value line (e.g., "It's our best-selling plan"). 
                    Ask if they want to proceed.`,
          action: ACTIONS.NONE
        };
      }

      return {
        message: "Pricing depends on customization. Standard starting price is competitive. Shall I send the rate card?",
        action: ACTIONS.NONE
      };

    /* ---------------- APPOINTMENT / VISIT ---------------- */
    case "book_appointment":
    case "schedule_site_visit":
      if (!entities.date && !entities.time) {
        // Agar date/time nahi hai, toh AI ko bolo maangne ko
        return {
          message: "User wants to book, but Date/Time is missing. Ask for preferred Date and Time politely.",
          action: ACTIONS.ASK_MISSING_INFO
        };
      }
      return {
        message: `Confirm appointment for ${entities.service || "Meeting"} on ${entities.date} at ${entities.time}. Say 'Booked successfully! ✅'`,
        action: ACTIONS.CREATE_APPOINTMENT,
        payload: { service: entities.service || "Meeting", date: entities.date, time: entities.time }
      };

    /* ---------------- REAL ESTATE SEARCH ---------------- */
    case "search_property": {
      const { budget, location, property_type } = entities;
      if (!location) return { message: "Ask which Location they prefer?", action: ACTIONS.ASK_MISSING_INFO };

      return {
        message: `User is looking for ${property_type || "property"} in ${location}. 
                  Acknowledge their budget (${budget || "flexible"}). 
                  Say "We have great options". Ask if they want to see Photos or Visit?`,
        action: ACTIONS.CREATE_LEAD,
        payload: { budget, location, property_type }
      };
    }

    /* ---------------- GENERIC ACTIONS ---------------- */
    case "request_callback":
      return {
        message: "Acknowledge callback request. Say the team will call shortly.",
        action: ACTIONS.REQUEST_CALLBACK
      };

    case "report_issue":
      return {
        message: "Sympathize with the issue. Say a Ticket has been created.",
        action: ACTIONS.CREATE_TICKET,
        payload: { issue: entities.issue || "Reported Issue" }
      };

    case "check_ticket_status":
      return { message: "Checking ticket status... Say it is In Progress.", action: ACTIONS.NONE };

    case "request_human":
      return { message: "Connect to human agent. Say 'Connecting you now...'", action: ACTIONS.ESCALATE_TO_HUMAN };

    /* ---------------- FALLBACK ---------------- */
    default:
      return {
        message: "I didn't understand. Ask them to clarify or choose from services.",
        action: ACTIONS.ASK_CLARIFICATION
      };
  }
}