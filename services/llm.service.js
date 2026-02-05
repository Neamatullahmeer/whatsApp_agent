import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
  
});
console.log("ENV LOADED:", process.env.OPENAI_API_KEY);


export async function generateReply({ context, userMessage }) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    input: [
      {
        role: "system",
        content: `
You are a WhatsApp business assistant.

Rules:
- Answer ONLY using the provided business context
- Be polite and concise
- If information is missing, ask a relevant question
- Do NOT hallucinate
- If the user is booking an appointment, do NOT ask unnecessary questions.
- Confirm date and time clearly.
- Keep Hinglish simple and consistent.

        `
      },
      {
        role: "system",
        content: context
      },
      {
        role: "user",
        content: userMessage
      }
    ]
  });

  // Clean text output
  return response.output_text;
}
