import { redisConnection } from "../config/redis.js";

/**
 * Generic Redis rate limiter
 */
export async function isAllowed(key, limit, windowSec) {
  const current = await redisConnection.incr(key);

  if (current === 1) {
    await redisConnection.expire(key, windowSec);
  }

  return current <= limit;
}
