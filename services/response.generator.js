import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

// 👇 "history" parameter add kiya
export async function generateAIResponse(business, intentResult, context, history) {
  const internalMessage = context.message; 
  const action = context.action;           
  const userText = intentResult.originalMessage; 
  
  if (!openai) {
    return internalMessage;
  }

  // 👇 History ko prompt ke liye format kiya
  const historyContext = history 
    ? `\nPREVIOUS CONVERSATION:\n${history}\n`
    : "";

  const systemPrompt = `
    You are an intelligent WhatsApp AI Agent for "${business.profile.name}".
    Tone: ${business.profile.description || "Professional & Helpful"}

    CONTEXT:
    ${historyContext}
    - User's Current Message: "${userText}"
    - System Action: ${action}
    - System Internal Note: "${internalMessage}"

    YOUR TASK:
    Rewrite the "System Internal Note" into a natural reply.
    
    CRITICAL RULES:
    1. **Check Previous Conversation:** If the Agent asked a question (like "Visit plan karein?") and the User ignored it to give a detail (like "2 BHK only"), you MUST **Acknowledge the detail AND Repeat the question**.
    2. Example: User says "2 BHK only". You say: "Noted, 2 BHK only. ✅ To kya hum is weekend visit plan karein?"
    3. Do NOT simply copy the System Note if it breaks the flow.
    4. Keep it short and human-like.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate reply." }
      ],
      temperature: 0.7, 
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("❌ AI Generation Failed:", error.message);
    return internalMessage; 
  }
}