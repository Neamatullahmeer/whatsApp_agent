import express from "express";
import { getConversationAudit } from "../controllers/audit.controller.js";
// 👇 'auth' ki jagah 'requireAuth' import karo
// Note: File ka naam check karlena (authMiddleware.js vs auth.middleware.js)
import { requireAuth } from "../middlewares/auth.middleware.js"; 
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/conversation/:conversationId",
  requireAuth, // 👈 Yahan bhi 'requireAuth' use karo
  allowRoles("admin", "owner"), // ✅ Ye ek function call hai, ye sahi hai
  getConversationAudit
);

export default router;
