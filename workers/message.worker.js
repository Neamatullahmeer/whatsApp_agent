import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { handleIncomingMessage } from "./message/handler.js";

console.log("👷 Worker booting. PID:", process.pid);

// 🔒 HARD SAFETY: module-scope guard (NOT global)
let workerStarted = false;
if (workerStarted) {
  console.warn("⚠️ Worker already started, exiting");
  process.exit(0);
}
workerStarted = true;

new Worker(
  "message-queue",
  async job => {
    console.log("👷 Worker got job:", job.data);
    await handleIncomingMessage(job.data);
  },
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 30000
  }
);

/*

// workers/message.worker.js - UPDATED
import dotenv from "dotenv";
dotenv.config();

// ✅ PEHLE mongoose import karo
import mongoose from "mongoose";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { handleIncomingMessage } from "./message/handler.js";

console.log("👷 Worker booting. PID:", process.pid);

// ✅ DATABASE CONNECT KARNE KA FUNCTION
async function connectDB() {
  try {
    // Check karo agar already connected hai
    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB already connected");
      return;
    }
    
    console.log("🔄 Connecting to MongoDB from worker...");
    
    // Connection options - timeout kam karo
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,  // 5 second
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2
    });
    
    console.log("✅ MongoDB connected in worker");
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("⚠️ Worker will continue but database queries will fail");
    // Exit mat karo, bas warning de do
  }
}

// ✅ MAIN FUNCTION JO WORKER START KAREGA
async function startWorker() {
  // Pehle database connect karo
  await connectDB();
  
  // Phir worker create karo
  const worker = new Worker(
    "message-queue",
    async (job) => {
      console.log(`[${job.id}] 👷 Processing job:`, job.data);
      
      try {
        // Database connected hai ya nahi check karo
        if (mongoose.connection.readyState !== 1) {
          console.log(`[${job.id}] ⚠️ MongoDB not connected, trying to reconnect...`);
          await connectDB();
        }
        
        // Job process karo
        const result = await handleIncomingMessage(job.data);
        console.log(`[${job.id}] ✅ Job completed successfully`);
        return result;
        
      } catch (error) {
        console.error(`[${job.id}] ❌ Job failed:`, error.message);
        
        // Agar MongoDB error hai toh retry mat karo
        if (error.message.includes('Mongo') || 
            error.message.includes('timeout') ||
            error.message.includes('buffering')) {
          console.log(`[${job.id}] ⚠️ Database error, returning error without retry`);
          return { 
            status: 'failed', 
            reason: 'database_error',
            message: error.message 
          };
        }
        
        // Normal error hai toh retry ke liye throw karo
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1,
      lockDuration: 30000,
      attempts: 1, // ✅ TEMPORARY: Retry band karo jab tak fix nahi hota
    }
  );

  // Event listeners
  worker.on("completed", (job) => {
    console.log(`[${job.id}] 🎉 Job completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[${job.id}] 🔴 Job failed after ${job.attemptsMade} attempts:`, err.message);
  });

  console.log("👷 Worker started with MongoDB support");
}

// ✅ START THE WORKER
startWorker().catch(console.error); */