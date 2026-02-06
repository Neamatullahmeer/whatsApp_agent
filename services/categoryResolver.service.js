import { CATEGORY_REGISTRY } from "../categories/categoryRegistry.js";

export function resolveCategory(business) {
  // 1. Category Type nikalo (e.g. "real_estate")
  const key = business.categoryType || "appointment";
  
  // 2. Static Rules (Files se)
  const staticConfig = CATEGORY_REGISTRY[key] || CATEGORY_REGISTRY.appointment;

  // 3. Dynamic Intents (Database se)
  // Agar DB me intents set hain, toh wo use karo. Warna file wale defaults lo.
  const dbIntents = business.agentConfig?.enabledIntents;

  return {
    ...staticConfig, // Baaki rules (extraction logic etc.) file se lo
    enabledIntents: (dbIntents && dbIntents.length > 0) ? dbIntents : staticConfig.enabledIntents
  };
}