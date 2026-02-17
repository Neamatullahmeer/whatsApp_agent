import express from "express";
import { 
  createCampaign, 
  getAllCampaigns, 
  launchCampaign, 
  deleteCampaign,
  toggleSequenceStatus 
} from "../controllers/campaign.controller.js";

// 👇 FIX: Yahan 'protect' ki jagah 'requireAuth' import karein (jo aapke paas hai)
import { protect } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

// 1. Create New Campaign (Draft)
router.post("/", protect, createCampaign);

// 2. Get All Campaigns (List)
router.get("/", protect, getAllCampaigns);

// 3. Launch Manual Blast
router.post("/:campaignId/launch", protect, launchCampaign);

// 4. Toggle Auto-Sequence
router.patch("/:campaignId/status", protect, toggleSequenceStatus);

// 5. Delete Campaign
router.delete("/:campaignId", protect, deleteCampaign);

export default router;