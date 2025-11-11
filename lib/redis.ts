import { Redis } from "@upstash/redis";
import { env, hasRedis } from "./env";

let client: Redis | null = null;

export const redis = (): Redis | null => {
  if (!hasRedis) {
    return null;
  }
  if (!client) {
    client = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!
    });
  }
  return client;
};

export const redisKey = (...parts: string[]): string =>
  ["agentic", "tiktok", ...parts].join(":");
