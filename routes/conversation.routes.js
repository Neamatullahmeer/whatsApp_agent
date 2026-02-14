import express from "express";
import { releaseChat } from "../controllers/release.controller.js";

const router = express.Router();

/**
 * 🤖 Release conversation back to AI
 * POST /conversation/release
 * body: { conversationId }
 */
router.post("/release", releaseChat);

export default router;
