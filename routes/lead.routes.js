import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getLeads, createLead, updateLead, deleteLead } from "../controllers/lead.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getLeads);          // Fetch All
router.post("/", createLead);       // Add New
router.put("/:id", updateLead);     // Edit (Update)
router.delete("/:id", deleteLead);  // Delete

export default router;