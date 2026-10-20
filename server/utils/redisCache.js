import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export const readCache = async (key) => {
  if (!redis) return { status: "disabled", value: null };

  try {
    const value = await redis.get(key);
    return { status: value === null ? "miss" : "hit", value };
  } catch (error) {
    console.error("Redis cache read failed:", error.message);
    return { status: "error", value: null };
  }
};

export const writeCache = async (key, value, ttlSeconds) => {
  if (!redis) return "disabled";

  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return "ok";
  } catch (error) {
    console.error("Redis cache write failed:", error.message);
    return "error";
  }
};
