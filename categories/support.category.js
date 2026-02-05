import { ACTIONS } from "../constants/actionTypes.js";

export const supportCategory = {
  key: "support",

  enabledIntents: [
    "greeting",
    "report_issue",
    "check_ticket_status",
    "request_human",
    "thank_you"
  ],

  actions: {
    [ACTIONS.CREATE_TICKET]: true,
    [ACTIONS.ESCALATE_TO_HUMAN]: true
  },

  rules: {
    businessHoursOnly: false
  },

  responses: {
    greeting:
      "Hello! 👋 Aap apni problem short me bata sakte hain?",
    ticketCreated:
      "🎫 Aapki complaint register ho gayi hai. Ticket ID: {{ticketId}}",
    escalated:
      "👩‍💼 Aapko human support se connect kiya ja raha hai."
  }
};
