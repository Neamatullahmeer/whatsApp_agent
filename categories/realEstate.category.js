import { ACTIONS } from "../constants/actionTypes.js";

export const realEstateCategory = {
  key: "real_estate",

  enabledIntents: [
    "greeting",
    "search_property",
    "ask_location",
    "ask_budget",
    "schedule_site_visit",
    "ask_contact"
  ],

  actions: {
    [ACTIONS.CREATE_LEAD]: true,
    [ACTIONS.SCHEDULE_SITE_VISIT]: true
  },

  rules: {
    workingHoursOnly: true
  },

  responses: {
    greeting:
      "Hello! 👋 Aap kis area ya type ki property dekh rahe hain?",
    leadCaptured:
      "✅ Details mil gayi hain. Hamari team aapse jaldi contact karegi.",
    visitScheduled:
      "📅 Site visit request receive ho gayi hai. Agent confirm karega."
  }
};
