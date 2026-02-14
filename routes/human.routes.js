import express from "express";
import { humanSendMessage } from "../controllers/humanReply.controller.js";

const router = express.Router();

/**
 * 👤 Human agent reply
 * POST /human/send
 * body: { conversationId, to, text }
 */
router.post("/send", humanSendMessage);

export default router;
