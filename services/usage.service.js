import { redisConnection } from "../config/redis.js";

export async function incrementUsage(key, ttlSeconds) {
  const count = await redisConnection.incr(key);
  if (count === 1) {
    await redisConnection.expire(key, ttlSeconds);
  }
  return count;
}
