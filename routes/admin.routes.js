import express from "express";
import { assignChat } from "../controllers/adminAssignment.controller.js";
// 👇 Ye line add karo (path check karlena agar alag folder me ho)
import { requireAuth } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

/**
 * 🔐 Admin assigns conversation to agent
 * POST /admin/assign
 * body: { conversationId, agentId }
 */
// 👇 'assignChat' se pehle 'requireAuth' jod do
router.post("/assign", requireAuth, assignChat);

export default router;
