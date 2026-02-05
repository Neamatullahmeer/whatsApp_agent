import { redisConnection } from "../config/redis.js";

export async function isDuplicateMessage(messageId) {
  const key = `wa:msg:${messageId}`;

  const exists = await redisConnection.get(key);
  if (exists) return true;

  // Mark as processed (TTL 24 hours)
  await redisConnection.set(key, "1", "EX", 24 * 60 * 60);
  return false;
}
