import { Router } from "express";
import {
  onboardBusiness,
  getMyBusiness,
  updateBusinessStatus
} from "../controllers/business.controller.js";

import { attachBusinessPhone } from "../middlewares/businessContext.middleware.js";

const router = Router();

// 🔑 YAHI LINE SABSE IMPORTANT HAI
router.use(attachBusinessPhone);

router.post("/onboard", onboardBusiness);
router.get("/me", getMyBusiness);
router.patch("/status", updateBusinessStatus);

export default router;
