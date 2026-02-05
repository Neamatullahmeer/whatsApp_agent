export async function scheduleSiteVisit(payload, meta) {
  console.log("📅 Site visit scheduled:", {
    businessId: meta.businessId,
    userPhone: meta.userPhone,
    ...payload
  });
}
