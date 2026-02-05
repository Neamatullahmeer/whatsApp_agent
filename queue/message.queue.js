import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const messageQueue = new Queue("message-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,                 // retry allowed
    backoff: {
      type: "exponential",
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});
