import { Conversation } from "../shared/models/Conversation.model.js";

export async function getTargetAudience(businessId, audienceFilters) {
  const query = { businessId, status: { $ne: "blocked" } }; // Blocked ko kabhi mat bhejo

  // 1. Tag Filtering
  if (!audienceFilters.allUsers) {
    if (audienceFilters.tags && audienceFilters.tags.length > 0) {
      query.tags = { $in: audienceFilters.tags };
    }
  }

  // 2. Exclude Tags (e.g. "Competitors")
  if (audienceFilters.excludeTags && audienceFilters.excludeTags.length > 0) {
    query.tags = { ...query.tags, $nin: audienceFilters.excludeTags };
  }

  // Users fetch karo (Sirf phone number chahiye)
  const users = await Conversation.find(query).select("userPhone name");
  return users;
}