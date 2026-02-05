export async function createLead(payload, meta) {
  console.log("🏠 New Real Estate Lead:", {
    businessId: meta.businessId,
    userPhone: meta.userPhone,
    ...payload
  });

  // Later:
  // - Save to DB
  // - Send to CRM
}
