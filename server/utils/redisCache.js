import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export const readCache = async (key) => {
  if (!redis) return null;

  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Redis cache read failed:", error.message);
    return null;
  }
};

export const writeCache = async (key, value, ttlSeconds) => {
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("Redis cache write failed:", error.message);
  }
};
