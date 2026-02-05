import { CATEGORY_REGISTRY } from "../categories/categoryRegistry.js";

export function resolveCategory(business) {
  const key = business.categoryType || "appointment";
  return CATEGORY_REGISTRY[key] || CATEGORY_REGISTRY.appointment;
}
