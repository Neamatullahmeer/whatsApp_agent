import { ACTIONS } from "../constants/actionTypes.js";

export const crmCategory = {
  key: "crm",

  enabledIntents: [
    "greeting",
    "product_inquiry",
    "pricing_request",
    "request_callback",
    "ask_features"
  ],

  actions: {
    [ACTIONS.CREATE_LEAD]: true,
    [ACTIONS.REQUEST_CALLBACK]: true
  },

  rules: {
    businessHoursOnly: true
  },

  responses: {
    greeting:
      "Hello! 👋 Aap kis product ya service ke baare me jaanana chahte hain?",
    leadCaptured:
      "✅ Aapki request mil gayi hai. Hamari sales team aapse jaldi contact karegi.",
    callbackScheduled:
      "📞 Callback request note kar li gayi hai."
  }
};
