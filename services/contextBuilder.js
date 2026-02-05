export function buildBusinessContext(business) {
  return `
Business Name: ${business.name || "New Business"}
Category: ${business.category || "Not specified"}

Services:
${
  business.services?.length
    ? business.services
        .map(s => (typeof s === "string" ? s : s.name))
        .join(", ")
    : "Not specified"
}

Rules:
${business.rules?.length ? business.rules.join(", ") : "None"}

Tone: ${business.tone || "polite"}
Language: ${business.language || "hinglish"}
`;
}

