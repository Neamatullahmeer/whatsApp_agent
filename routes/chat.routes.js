import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getConversations, getMessages, sendMessage, toggleBotMode } from "../controllers/chat.controller.js";

const router = express.Router();

router.use(protect); // Login zaroori hai

router.get("/conversations", getConversations); // Chat List
router.get("/:phone/messages", getMessages);    // Message History
router.post("/send", sendMessage);              // Send Reply
router.post("/toggle-mode", toggleBotMode);     // Human/Bot Switch

export default router;