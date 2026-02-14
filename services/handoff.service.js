import { Conversation } from "../shared/models/Conversation.model.js";

// Naam 'moveToHuman' se badal kar 'escalateToHuman' kar diya
export async function escalateToHuman(conversationId) {
  await Conversation.updateOne(
    { _id: conversationId },
    { status: "human" }
  );
}