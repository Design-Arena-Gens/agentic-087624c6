import { ApifyClient } from "apify-client";
import { env, hasApifyCredentials } from "./env";
import type { TikTokVideo } from "./types";

type ApifyVideo = {
  id?: string;
  id_str?: string;
  desc?: string;
  title?: string;
  createTime?: number | string;
  author?: {
    nickname?: string;
    uniqueId?: string;
    id?: string;
  };
  stats?: {
    playCount?: number;
    diggCount?: number;
    shareCount?: number;
    commentCount?: number;
  };
  video?: {
    downloadAddr?: string;
    playAddr?: string;
    duration?: number;
    dynamicCover?: string;
    originCover?: string;
    cover?: string;
  };
  covers?: {
    dynamic?: string;
    origin?: string;
    default?: string;
  };
  hashtags?: Array<{ name?: string }>;
  challenges?: Array<{ title?: string }>;
};

const MIN_VIEW_COUNT = 500_000;
const DEFAULT_FETCH_LIMIT = 24;

const apifyClient = (): ApifyClient => {
  if (!hasApifyCredentials) {
    throw new Error(
      "Apify credentials missing. Set APIFY_TOKEN to enable TikTok ingestion."
    );
  }
  return new ApifyClient({
    token: env.APIFY_TOKEN
  });
};

const toTikTokVideo = (item: ApifyVideo): TikTokVideo | null => {
  const id = item.id ?? item.id_str;
  const stats = item.stats ?? {};
  const video = item.video ?? {};

  if (!id || !video.downloadAddr) {
    return null;
  }

  const rawDate = item.createTime;
  const publishedAt =
    typeof rawDate === "number"
      ? new Date(rawDate * 1000).toISOString()
      : typeof rawDate === "string" && rawDate
        ? new Date(rawDate).toISOString()
        : null;

  const hashtagCandidates =
    (item.hashtags ?? [])
      .map((tag) => tag?.name)
      .filter((name): name is string => Boolean(name));
  const challengeTags =
    (item.challenges ?? [])
      .map((challenge) => challenge?.title)
      .filter((title): title is string => Boolean(title));
  const hashtags =
    hashtagCandidates.length > 0 ? hashtagCandidates : challengeTags;

  const cover =
    video.dynamicCover ??
    video.originCover ??
    video.cover ??
    item.covers?.dynamic ??
    item.covers?.origin ??
    item.covers?.default;

  return {
    id,
    title: item.title ?? item.desc ?? "",
    authorName: item.author?.nickname ?? "",
    authorUsername: item.author?.uniqueId ?? item.author?.id ?? "",
    description: item.desc ?? item.title ?? "",
    hashtags,
    publishedAt,
    viewCount: stats.playCount ?? 0,
    likeCount: stats.diggCount,
    commentCount: stats.commentCount,
    shareCount: stats.shareCount,
    videoUrl: video.downloadAddr ?? video.playAddr ?? "",
    coverUrl: cover ?? undefined,
    durationSeconds: video.duration
  };
};

const dedupe = (videos: TikTokVideo[]): TikTokVideo[] => {
  const seen = new Set<string>();
  return videos.filter((video) => {
    if (seen.has(video.id)) {
      return false;
    }
    seen.add(video.id);
    return true;
  });
};

export type FetchVideosOptions = {
  maxResults?: number;
  minViewCount?: number;
  searchTerms?: string[];
};

export const fetchFootballEdits = async (
  options: FetchVideosOptions = {}
): Promise<TikTokVideo[]> => {
  const client = apifyClient();
  const maxResults = options.maxResults ?? DEFAULT_FETCH_LIMIT;
  const minViews = options.minViewCount ?? MIN_VIEW_COUNT;
  const searchTerms = options.searchTerms ?? [
    "football edit",
    "football edits",
    "soccer edit",
    "football highlights",
    "soccer highlights"
  ];

  const run = await client.actor(env.APIFY_TIKTOK_SEARCH_ACTOR).call({
    searchTerms,
    searchType: "general",
    maxItems: Math.max(maxResults * 4, 40),
    language: "en",
    saveInput: false
  });

  if (!run?.defaultDatasetId) {
    return [];
  }

  const { items } = await client
    .dataset<ApifyVideo>(run.defaultDatasetId)
    .listItems({
      limit: Math.max(maxResults * 4, 80)
    });

  const normalized = items
    .map(toTikTokVideo)
    .filter((video): video is TikTokVideo => Boolean(video))
    .filter((video) => video.viewCount >= minViews);

  const sorted = dedupe(
    normalized.sort((a, b) => b.viewCount - a.viewCount)
  ).slice(0, maxResults);

  return sorted;
};
