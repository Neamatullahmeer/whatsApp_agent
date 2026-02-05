import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },

    from: {
      type: String, // user | agent | human
      required: true
    },

    text: String,

    messageId: String, // WhatsApp msg.id (dedup)

    meta: Object
  },
  { timestamps: true }
);

export const Message = mongoose.model(
  "Message",
  messageSchema
);
