import { DAILY_VIDEO_TARGET } from "@/lib/agent";
import { hasApifyCredentials, hasRedis, hasTikTokPublisher } from "@/lib/env";
import { getRecentHistory, getLatestHistory } from "@/lib/history";
import type { HistoryRecord } from "@/lib/types";
import { TriggerButton } from "@/components/TriggerButton";

const MIN_VIEW_TARGET = 500_000;

const renderVideoCard = (video: HistoryRecord["videos"][number]) => {
  const coverStyle = video.coverUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0) 55%, rgba(2,6,23,0.85) 100%), url(${video.coverUrl})`
      }
    : {
        background:
          "linear-gradient(135deg, rgba(30,64,175,0.6), rgba(6,182,212,0.5))"
      };

  return (
    <div className="video-card" key={video.id}>
      <div className="video-cover" style={coverStyle} />
      <div className="video-title">{video.title || "Untitled"}</div>
      <div className="video-meta">
        <span>@{video.authorUsername || video.authorName || "unknown"}</span>
        <span>{new Intl.NumberFormat().format(video.viewCount)} views</span>
      </div>
      <div className="muted">
        <span className="pill">{video.durationSeconds ?? "?"}s</span>{" "}
        {video.hashtags.slice(0, 4).map((tag) => (
          <span key={tag} style={{ marginRight: "0.5rem" }}>
            #{tag}
          </span>
        ))}
      </div>
      <a
        className="link"
        href={`https://www.tiktok.com/@${video.authorUsername}/video/${video.id}`}
        target="_blank"
        rel="noreferrer"
      >
        Open on TikTok →
      </a>
    </div>
  );
};

const renderFailures = (failures: string[]) => {
  if (!failures.length) {
    return null;
  }
  return (
    <div className="failures">
      {failures.map((failure) => (
        <div key={failure}>{failure}</div>
      ))}
    </div>
  );
};

const emptyState = (
  <div className="muted">
    No runs captured yet. Trigger the agent to curate today&apos;s batch.
  </div>
);

const EnvironmentChecklist = () => (
  <div className="grid two" style={{ marginTop: "1.5rem" }}>
    <div className="video-card" style={{ gap: "0.5rem" }}>
      <div className="metric-label">Apify TikTok Scraper</div>
      <div
        className="metric-value"
        style={{ fontSize: "1.1rem", color: hasApifyCredentials ? "#34d399" : "#f87171" }}
      >
        {hasApifyCredentials ? "Connected" : "Missing APIFY_TOKEN"}
      </div>
      <div className="muted">
        Required to search TikTok for high-velocity football edits.
      </div>
    </div>
    <div className="video-card" style={{ gap: "0.5rem" }}>
      <div className="metric-label">TikTok Publishing</div>
      <div
        className="metric-value"
        style={{ fontSize: "1.1rem", color: hasTikTokPublisher ? "#34d399" : "#f87171" }}
      >
        {hasTikTokPublisher ? "Ready" : "Waiting for credentials"}
      </div>
      <div className="muted">
        Provide TIKTOK_ACCESS_TOKEN + TIKTOK_PUBLISHER_ID to enable posting.
      </div>
    </div>
    <div className="video-card" style={{ gap: "0.5rem" }}>
      <div className="metric-label">History Storage</div>
      <div
        className="metric-value"
        style={{ fontSize: "1.1rem", color: hasRedis ? "#34d399" : "#fbbf24" }}
      >
        {hasRedis ? "Upstash Redis" : "Ephemeral fallback"}
      </div>
      <div className="muted">
        Configure Redis for persistent logs across deployments.
      </div>
    </div>
  </div>
);

const DailySummaryCard = ({ latest }: { latest: HistoryRecord | null }) => (
  <div className="card">
    <span className="badge">Daily Automation</span>
    <h1 style={{ marginTop: "1.25rem", marginBottom: "1.25rem", fontSize: "2.2rem" }}>
      Viral Football Edit Curator
    </h1>
    <p className="muted" style={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
      The agent scans TikTok for high-performing football edits (&gt;500k views),
      selects {DAILY_VIDEO_TARGET} daily, and pushes them to your official account.
    </p>
    <div className="metrics">
      <div className="metric">
        <div className="metric-label">Min Views</div>
        <div className="metric-value">
          {new Intl.NumberFormat().format(MIN_VIEW_TARGET)}
        </div>
      </div>
      <div className="metric">
        <div className="metric-label">Latest Run</div>
        <div className="metric-value">
          {latest ? latest.date : "—"}
        </div>
      </div>
      <div className="metric">
        <div className="metric-label">Posted</div>
        <div className="metric-value">
          {latest ? `${latest.postedCount}/${DAILY_VIDEO_TARGET}` : "—"}
        </div>
      </div>
    </div>
    <div style={{ marginTop: "2rem" }}>
      <TriggerButton
        canPublish={hasTikTokPublisher}
        minViewCount={MIN_VIEW_TARGET}
      />
    </div>
    <EnvironmentChecklist />
  </div>
);

const LatestSelection = ({ latest }: { latest: HistoryRecord | null }) => (
  <div className="card">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ margin: 0 }}>Latest Selection</h2>
      {latest ? (
        <span className="pill">
          {latest.selectedCount} curated • {latest.postedCount} posted
        </span>
      ) : null}
    </div>
    {!latest ? (
      emptyState
    ) : (
      <>
        <div className="grid two" style={{ marginTop: "1.5rem" }}>
          {latest.videos.map(renderVideoCard)}
        </div>
        {renderFailures(latest.failures)}
      </>
    )}
  </div>
);

const HistorySection = ({ history }: { history: HistoryRecord[] }) => (
  <div className="card">
    <h2 style={{ marginTop: 0 }}>Operational Log</h2>
    {!history.length
      ? emptyState
      : history.map((entry) => (
          <div className="history-item" key={entry.id}>
            <div className="history-title">
              {entry.date} • {entry.postedCount}/{DAILY_VIDEO_TARGET} posted
            </div>
            <div className="muted">
              {new Intl.NumberFormat().format(entry.fetchedCount)} fetched •{" "}
              {entry.selectedCount} selected •{" "}
              {entry.failures.length ? `${entry.failures.length} issue(s)` : "Clean run"}
            </div>
            {entry.failures.length ? renderFailures(entry.failures) : null}
          </div>
        ))}
  </div>
);

const Home = async () => {
  const [latest, history] = await Promise.all([
    getLatestHistory(),
    getRecentHistory(10)
  ]);

  const dedupedHistory = latest
    ? [latest, ...history.filter((item) => item.id !== latest.id)]
    : history;

  return (
    <main className="container">
      <DailySummaryCard latest={latest} />
      <LatestSelection latest={latest} />
      <HistorySection history={dedupedHistory} />
    </main>
  );
};

export default Home;
