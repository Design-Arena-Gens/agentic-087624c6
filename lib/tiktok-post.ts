import axios from "axios";
import { env, hasTikTokPublisher } from "./env";
import type { TikTokVideo } from "./types";

const TIKTOK_UPLOAD_ENDPOINT =
  "https://open.tiktokapis.com/v2/post/upload/";
const TIKTOK_PUBLISH_ENDPOINT =
  "https://open.tiktokapis.com/v2/post/publish/";

const ensureTikTokCredentials = () => {
  if (!hasTikTokPublisher) {
    throw new Error(
      "TikTok publishing credentials missing. Set TIKTOK_ACCESS_TOKEN and TIKTOK_PUBLISHER_ID."
    );
  }
};

const buildCaption = (video: TikTokVideo): string => {
  const base = video.title || video.description || "Football edit";
  const hashTags = new Set<string>();
  video.hashtags.forEach((tag) => {
    const normalized = tag?.replace(/[^a-z0-9]/gi, "") ?? "";
    if (normalized) {
      hashTags.add(`#${normalized}`.toLowerCase());
    }
  });
  hashTags.add("#football");
  hashTags.add("#footballhighlights");
  hashTags.add("#footballtiktok");
  const caption = `${base}\n\n${[...hashTags].join(" ")}`.trim();
  return caption.slice(0, 2200);
};

const downloadVideo = async (url: string): Promise<ArrayBuffer> => {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer"
  });
  return response.data;
};

const uploadVideo = async (
  video: TikTokVideo
): Promise<{ uploadId: string }> => {
  ensureTikTokCredentials();
  const binary = await downloadVideo(video.videoUrl);
  const fileName = `${video.id}.mp4`;
  const blob = new Blob([binary], { type: "video/mp4" });

  const form = new FormData();
  form.append("video", blob, fileName);

  const response = await fetch(TIKTOK_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TIKTOK_ACCESS_TOKEN}`
    },
    body: form
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `TikTok upload failed: ${response.status} ${response.statusText} - ${message}`
    );
  }

  const payload = (await response.json()) as {
    data?: { upload_id?: string };
  };
  const uploadId = payload?.data?.upload_id;

  if (!uploadId) {
    throw new Error("TikTok upload did not return upload_id");
  }

  return { uploadId };
};

const publishVideo = async (
  video: TikTokVideo,
  uploadId: string
): Promise<void> => {
  ensureTikTokCredentials();

  const body = {
    post_info: {
      description: buildCaption(video),
      privacy_level: "PUBLIC"
    },
    upload_id: uploadId,
    media_type: "VIDEO",
    publisher_id: env.TIKTOK_PUBLISHER_ID
  };

  const response = await fetch(TIKTOK_PUBLISH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TIKTOK_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `TikTok publish failed: ${response.status} ${response.statusText} - ${message}`
    );
  }
};

export const postVideoToTikTok = async (
  video: TikTokVideo
): Promise<void> => {
  const { uploadId } = await uploadVideo(video);
  await publishVideo(video, uploadId);
};
