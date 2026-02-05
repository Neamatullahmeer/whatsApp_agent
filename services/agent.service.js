import { ACTIONS } from "../constants/actionTypes.js";

export function decideNextStep(intentResult) {
  const { intent, entities = {} } = intentResult;

  switch (intent) {
    case "greeting":
      return {
        message: "Hello! 👋 Aap kaise madad chahte hain?",
        action: ACTIONS.NONE
      };

    /* ---------------- APPOINTMENT ---------------- */
    case "book_appointment":
      if (!entities.service || !entities.date || !entities.time) {
        return {
          message: "Booking ke liye service, date aur time batayein 🙂",
          action: ACTIONS.ASK_MISSING_INFO
        };
      }

      return {
        message: `✅ Appointment request received for ${entities.service} on ${entities.date} at ${entities.time}.`,
        action: ACTIONS.CREATE_APPOINTMENT,
        payload: {
          service: entities.service,
          date: entities.date,
          time: entities.time
        }
      };

    /* ---------------- REAL ESTATE (FIXED) ---------------- */
    case "search_property": {
      const { budget, location } = entities;

      if (!budget && !location) {
        return {
          message: "Aapka budget bata denge?",
          action: ACTIONS.ASK_MISSING_INFO
        };
      }

      if (!budget) {
        return {
          message: "Budget bata denge?",
          action: ACTIONS.ASK_MISSING_INFO
        };
      }

      if (!location) {
        return {
          message: "Kaunsa area / city prefer karenge?",
          action: ACTIONS.ASK_MISSING_INFO
        };
      }

      return {
        message: `👍 Perfect! ${budget} budget me ${location} ke options nikal rahe hain.`,
        action: ACTIONS.CREATE_LEAD,
        payload: { budget, location }
      };
    }

    /* ---------------- REAL ESTATE ENTITY FILLERS ---------------- */
    case "ask_budget":
    case "ask_location":
      return {
        message: "Theek hai 👍",
        action: ACTIONS.NONE
      };

    /* ---------------- SITE VISIT ---------------- */
    case "schedule_site_visit":
      if (!entities.date || !entities.time) {
        return {
          message: "Site visit ke liye date aur time batayein 🙂",
          action: ACTIONS.ASK_MISSING_INFO
        };
      }

      return {
        message: "📅 Site visit request noted.",
        action: ACTIONS.SCHEDULE_SITE_VISIT,
        payload: {
          date: entities.date,
          time: entities.time
        }
      };

    /* ---------------- PRODUCT / SALES ---------------- */
    case "product_inquiry":
      if (!entities.product) {
        return {
          message: "Kaunsa product dekh rahe hain?",
          action: ACTIONS.ASK_MISSING_INFO
        };
      }

      return {
        message: "👍 Product details note kar liye hain. Price ya callback chahiye?",
        action: ACTIONS.CREATE_LEAD,
        payload: {
          interest: entities.product
        }
      };

    case "pricing_request":
      return {
        message: "💰 Pricing details ke liye callback schedule kar dete hain?",
        action: ACTIONS.REQUEST_CALLBACK
      };

    case "request_callback":
      return {
        message: "📞 Callback request receive ho gayi hai.",
        action: ACTIONS.REQUEST_CALLBACK
      };

    /* ---------------- SUPPORT ---------------- */
    case "report_issue":
      return {
        message: "🙏 Issue note kar liya hai. Hum ticket bana rahe hain.",
        action: ACTIONS.CREATE_TICKET,
        payload: {
          issue: entities.issue || "User reported an issue"
        }
      };

    case "check_ticket_status":
      return {
        message: "📄 Aapki ticket process me hai. Team jaldi update degi.",
        action: ACTIONS.NONE
      };

    case "request_human":
      return {
        message: "👩‍💼 Aapko human support se connect kiya ja raha hai.",
        action: ACTIONS.ESCALATE_TO_HUMAN
      };

    /* ---------------- FALLBACK ---------------- */
    default:
      return {
        message: "Main samajh nahi paaya. Thoda aur batayenge?",
        action: ACTIONS.ASK_CLARIFICATION
      };
  }
}
