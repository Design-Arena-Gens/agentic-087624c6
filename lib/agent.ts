import { format } from "date-fns";
import { fetchFootballEdits } from "./tiktok-fetch";
import { postVideoToTikTok } from "./tiktok-post";
import { hasTikTokPublisher } from "./env";
import { saveDailyResult } from "./history";
import type { DailyJobResult, TikTokVideo } from "./types";

export const DAILY_VIDEO_TARGET = 6;

export type RunAgentOptions = {
  minViewCount?: number;
  maxCandidates?: number;
  skipPosting?: boolean;
};

export const runDailyAgent = async (
  options: RunAgentOptions = {}
): Promise<DailyJobResult> => {
  const minViewCount = options.minViewCount ?? 500_000;
  const maxCandidates = options.maxCandidates ?? 32;
  const skipPosting = options.skipPosting ?? false;

  const date = format(new Date(), "yyyy-MM-dd");
  const failures: string[] = [];

  const candidates = await fetchFootballEdits({
    maxResults: maxCandidates,
    minViewCount
  });

  const selected = candidates.slice(0, DAILY_VIDEO_TARGET);
  const postedVideos: TikTokVideo[] = [];

  if (!skipPosting) {
    if (!hasTikTokPublisher) {
      failures.push(
        "TikTok credentials missing. Skipped publishing, but selection completed."
      );
    } else {
      for (const video of selected) {
        try {
          await postVideoToTikTok(video);
          postedVideos.push(video);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : JSON.stringify(error);
          failures.push(`Failed to publish ${video.id}: ${message}`);
        }
      }
    }
  }

  const result: DailyJobResult = {
    date,
    fetchedCount: candidates.length,
    selectedCount: selected.length,
    postedCount: postedVideos.length,
    videos: selected,
    failures
  };

  await saveDailyResult(result);
  return result;
};
