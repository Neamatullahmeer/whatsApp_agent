import express from "express";
import { subscribePro } from "../controllers/billing.controller.js";

const router = express.Router();

router.post("/subscribe", subscribePro);

export default router;
