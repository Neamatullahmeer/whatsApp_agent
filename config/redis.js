import dotenv from "dotenv";
dotenv.config();

import IORedis from "ioredis";

export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,

  // 🔥 REQUIRED FOR BULLMQ
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});
