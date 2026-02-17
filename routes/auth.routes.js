import express from "express";
import { login, signup, registerOwner } from "../controllers/auth.controller.js"; // 👈 'registerOwner' import karein

const router = express.Router();

// 👇 Ye Naya Route Add Karein (Business Owner Signup ke liye)
router.post("/register-owner", registerOwner);

// Existing routes
router.post("/login", login);
router.post("/signup", signup); // Ye Staff ke liye hai

export default router;