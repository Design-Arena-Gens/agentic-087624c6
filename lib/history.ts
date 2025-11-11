import { redis, redisKey } from "./redis";
import type { DailyJobResult, HistoryRecord } from "./types";

const HISTORY_KEY = redisKey("history");

export const saveDailyResult = async (
  result: DailyJobResult
): Promise<HistoryRecord | null> => {
  const client = redis();
  const now = new Date();
  const payload: HistoryRecord = {
    ...result,
    id: `${result.date}-${now.getTime()}`,
    createdAt: now.toISOString()
  };

  if (!client) {
    return payload;
  }

  await client.multi()
    .lpush(HISTORY_KEY, JSON.stringify(payload))
    .ltrim(HISTORY_KEY, 0, 29)
    .set(redisKey("history", "latest"), JSON.stringify(payload))
    .exec();

  return payload;
};

export const getRecentHistory = async (
  limit = 14
): Promise<HistoryRecord[]> => {
  const client = redis();
  if (!client) {
    return [];
  }
  const items = await client.lrange(HISTORY_KEY, 0, limit - 1);
  return items
    .map((raw) => {
      try {
        return JSON.parse(raw) as HistoryRecord;
      } catch (error) {
        return null;
      }
    })
    .filter((entry): entry is HistoryRecord => Boolean(entry));
};

export const getLatestHistory = async (): Promise<HistoryRecord | null> => {
  const client = redis();
  if (!client) {
    return null;
  }
  const latest = await client.get<string>(redisKey("history", "latest"));
  if (!latest) {
    return null;
  }
  try {
    return JSON.parse(latest) as HistoryRecord;
  } catch (error) {
    return null;
  }
};
