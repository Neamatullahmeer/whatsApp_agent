export async function requestCallback(payload, meta) {
  console.log("📞 Callback requested:", {
    businessId: meta.businessId,
    userPhone: meta.userPhone
  });

  // Later:
  // - Save to CRM DB
  // - Notify sales team
}
