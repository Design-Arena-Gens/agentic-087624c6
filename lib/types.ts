export type TikTokVideo = {
  id: string;
  title: string;
  authorName: string;
  authorUsername: string;
  description: string;
  hashtags: string[];
  publishedAt: string | null;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  videoUrl: string;
  coverUrl?: string;
  durationSeconds?: number;
};

export type DailyJobResult = {
  date: string;
  fetchedCount: number;
  selectedCount: number;
  postedCount: number;
  videos: TikTokVideo[];
  failures: string[];
};

export type HistoryRecord = DailyJobResult & {
  id: string;
  createdAt: string;
};
