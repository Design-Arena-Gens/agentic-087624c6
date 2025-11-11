import { z } from "zod";

const envSchema = z.object({
  APIFY_TOKEN: z.string().min(1).optional(),
  APIFY_TIKTOK_SEARCH_ACTOR: z
    .string()
    .min(1)
    .default("apify/tiktok-search-scraper"),
  UPSTASH_REDIS_REST_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  TIKTOK_ACCESS_TOKEN: z.string().min(1).optional(),
  TIKTOK_CLIENT_KEY: z.string().min(1).optional(),
  TIKTOK_CLIENT_SECRET: z.string().min(1).optional(),
  TIKTOK_PUBLISHER_ID: z.string().min(1).optional(),
  DAILY_TRIGGER_SECRET: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default(process.env.NODE_ENV ?? "development")
});

const parsed = envSchema.safeParse({
  APIFY_TOKEN: process.env.APIFY_TOKEN,
  APIFY_TIKTOK_SEARCH_ACTOR: process.env.APIFY_TIKTOK_SEARCH_ACTOR,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  TIKTOK_ACCESS_TOKEN: process.env.TIKTOK_ACCESS_TOKEN,
  TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
  TIKTOK_PUBLISHER_ID: process.env.TIKTOK_PUBLISHER_ID,
  DAILY_TRIGGER_SECRET: process.env.DAILY_TRIGGER_SECRET,
  NODE_ENV: process.env.NODE_ENV
});

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  );
  throw new Error("Environment validation failed");
}

export const env = parsed.data;

export const hasApifyCredentials = Boolean(env.APIFY_TOKEN);
export const hasRedis = Boolean(
  env.UPSTASH_REDIS_REST_TOKEN && env.UPSTASH_REDIS_REST_URL
);
export const hasTikTokPublisher = Boolean(
  env.TIKTOK_ACCESS_TOKEN && env.TIKTOK_PUBLISHER_ID
);

export type Env = typeof env;
