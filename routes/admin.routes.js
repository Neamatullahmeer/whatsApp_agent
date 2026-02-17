import express from "express";
import { protect, superAdminOnly } from "../middlewares/auth.middleware.js"; // 👈 superAdminOnly import kiya

// Controllers
import { assignChat } from "../controllers/adminAssignment.controller.js"; // Existing
import { getAdminDashboard, toggleBusinessStatus } from "../controllers/admin.controller.js"; // 👈 New Super Admin Controller

const router = express.Router();

/* =========================================================================
   🏢 BUSINESS ADMIN ROUTES (For Business Owners)
   ========================================================================= */

/**
 * 🔐 Assign conversation to agent
 * POST /api/admin/assign
 * Body: { conversationId, agentId }
 * Access: Business Owner / Admin
 */
router.post("/assign", protect, assignChat);

/* =========================================================================
   🦸‍♂️ SUPER ADMIN ROUTES (SaaS Founder Only - GOD MODE)
   ========================================================================= */

/**
 * 📊 Get Global Dashboard Stats (All Businesses)
 * GET /api/admin/dashboard
 * Access: Super Admin Only
 */
router.get("/dashboard", protect, superAdminOnly, getAdminDashboard);

/**
 * 🚫 Block or Activate a Business
 * PUT /api/admin/business/:id/status
 * Body: { status: 'active' | 'suspended' }
 * Access: Super Admin Only
 */
router.put("/business/:id/status", protect, superAdminOnly, toggleBusinessStatus);

export default router;