# Agentic Football TikTok Agent

Daily automation for sourcing viral football edits from TikTok (minimum 500k views) and publishing six handpicked clips to a managed TikTok account.

## Stack

- Next.js 14 App Router (TypeScript)
- Upstash Redis (history + logs)
- Apify TikTok Search actor (discovery pipeline)
- TikTok Content Posting API (video publishing)

## Local Development

```bash
npm install
npm run dev
```

### Required Environment

Create `.env.local` with:

```bash
# Discovery
APIFY_TOKEN=...
APIFY_TIKTOK_SEARCH_ACTOR=apify/tiktok-search-scraper

# Persistence (optional but recommended)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# TikTok publishing (omit to run discovery-only dry runs)
TIKTOK_ACCESS_TOKEN=...
TIKTOK_PUBLISHER_ID=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...

# Protect manual/cron triggers
DAILY_TRIGGER_SECRET=...
```

- Without `TIKTOK_*` credentials the agent still curates clips but skips posting.
- Without Upstash the history renders empty after each deployment.

## Daily Automation

1. Vercel cron (or any scheduler) hits `GET /api/cron/daily?secret=...`.
2. Agent pulls ~30 fresh football edits via Apify.
3. Filters to clips over 500k views, ranks by view count, selects six.
4. Downloads binaries, posts to TikTok, and records telemetry in Redis.

### Manual Trigger

`POST /api/run` (optionally `Authorization: Bearer ${DAILY_TRIGGER_SECRET}`) runs the workflow immediately. The dashboard button in the UI calls this endpoint and refreshes the latest log.

## Production Build

```bash
npm run lint
npm run build
```

## Deployment

Ensure environment variables are set on Vercel. Provision:

- Upstash Redis database
- Apify account with TikTok search actor (configure search terms in actor input if customised)
- TikTok Content Posting app with `content_publish` scope

Cron example (`vercel.json` or dashboard):

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 14 * * *"
    }
  ]
}
```

Include `?secret=...` in the URL if you set `DAILY_TRIGGER_SECRET`.

## UI Overview

- Status of integrations (Apify, TikTok, Redis)
- Trigger button for on-demand runs
- Latest curated batch with direct TikTok links
- Historical run log with failure diagnostics

## Testing Notes

Publishing endpoints are only exercised when valid TikTok credentials are present. In lower environments set `skipPosting` (UI toggles automatically when credentials are missing). The agent still validates ranking logic, filtering (>500k views), and persistence.
