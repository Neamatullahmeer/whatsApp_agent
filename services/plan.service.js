import { PLANS } from "../constants/plans.js";

export function resolvePlan(business) {
  const planKey = business.plan || "free";
  return PLANS[planKey] || PLANS.free;
}
