import { ACTIONS } from "../constants/actionTypes.js";

export const appointmentCategory = {
  key: "appointment",

  enabledIntents: [
    "greeting",
    "ask_services",
    "ask_price",
    "ask_hours",
    "book_appointment"
  ],

  actions: {
    [ACTIONS.CREATE_APPOINTMENT]: true
  },

  rules: {
    sundayClosed: true
  },

  responses: {
    greeting: "Hello! 👋 Aap kaise madad chahte hain?",
    bookingSuccess:
      "✅ Aapki appointment request receive ho gayi hai."
  }
};
