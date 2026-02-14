import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/", async (req, res) => {
  // 1. Check Database Status
  // 0: Disconnected, 1: Connected, 2: Connecting, 3: Disconnecting
  const dbState = mongoose.connection.readyState;
  
  const healthData = {
    status: "UP",
    uptime: process.uptime(), // Server kitne seconds se chal raha hai
    timestamp: new Date(),
    services: {
      database: dbState === 1 ? "healthy" : "disconnected",
      server: "healthy"
    }
  };

  // 2. Agar DB connected nahi hai to 503 (Service Unavailable) bhejo
  if (dbState !== 1) {
    healthData.status = "DOWN";
    healthData.services.database = "disconnected";
    return res.status(503).json(healthData);
  }

  // 3. Sab sahi hai to 200 OK
  res.status(200).json(healthData);
});

export default router;