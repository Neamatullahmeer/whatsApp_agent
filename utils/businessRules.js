export function isSundayClosed(business) {
  if (!business?.rules?.length) return false;

  return business.rules.some(rule => {
    const r = rule.toLowerCase();
    return r.includes("sunday") && r.includes("close");
  });
}

export function isSunday(dateValue) {
  if (!dateValue) return false;
  return dateValue.toString().toLowerCase().includes("sunday");
}
