export async function escalateToHuman(payload, meta) {
  console.log("🚨 Escalation requested:", {
    businessId: meta.businessId,
    userPhone: meta.userPhone
  });

  // Later:
  // - Assign to agent
  // - Notify support team
}
