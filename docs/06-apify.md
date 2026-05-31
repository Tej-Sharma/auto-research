# 06 · Apify (scraping)

Apify hosts 34k+ scraping "actors". We call three via the REST API from inside the Daytona sandbox. Auth is an API token (`APIFY_TOKEN`) from Apify Console → Integrations.

- Store: https://apify.com/store
- API: https://docs.apify.com/api/v2

## The one endpoint we use
Run an actor and get its dataset items in a single synchronous call (waits up to ~300s):
```
POST https://api.apify.com/v2/acts/{actorId}/run-sync-get-dataset-items?token={APIFY_TOKEN}
Content-Type: application/json
<actor input JSON>           ->   200 OK, body = [ {item}, {item}, ... ]
```
`actorId` uses the `~` form: `clockworks~tiktok-scraper`. (Authorization header `Bearer {token}` also works instead of the query param.)

For long scrapes, prefer async + poll:
```
POST /v2/acts/{actorId}/runs?token=…           -> { data: { id, defaultDatasetId } }
GET  /v2/actor-runs/{runId}?token=…            -> poll until status SUCCEEDED
GET  /v2/datasets/{defaultDatasetId}/items?token=…  -> [ items ]
```
We store `apify_run_id` on the `searches` row either way.

## The three actors

### 1. Web pages → `apify/website-content-crawler`  (actorId `apify~website-content-crawler`)
Crawls pages and returns clean Markdown/text — built for LLM/RAG. Use for academic mode and competitor/web signals.
```json
{
  "startUrls": [{ "url": "https://example.com/article" }],
  "crawlerType": "playwright:adaptive",
  "maxCrawlPages": 5,
  "proxyConfiguration": { "useApifyProxy": true },
  "removeElementsCssSelector": "nav, footer, script, style",
  "blockMedia": true
}
```
Output items: `{ url, title, text/markdown, metadata }` → map to `sources` (platform `web`).

> To get *which URLs* to crawl from a keyword, either (a) feed the LLM-planned URLs directly, or (b) use a SERP actor (e.g. `apify/google-search-scraper`) first to turn a query into result URLs, then crawl them. The search planner can emit URLs directly when it knows good sources; otherwise add a SERP step.

### 2. TikTok → `clockworks/tiktok-scraper`  (actorId `clockworks~tiktok-scraper`)
Profiles, hashtags, search terms, videos. Use for market signals.
```json
{
  "searchQueries": ["ai office manager for trades"],
  "resultsPerPage": 8,
  "shouldDownloadVideos": false,
  "shouldDownloadCovers": false
}
```
Output items include `text` (caption), `playCount`, `diggCount` (likes), `commentCount`, `shareCount`, `authorMeta.name`, `webVideoUrl` → map to `sources` (platform `tiktok`, metrics from counts, excerpt = caption).

### 3. YouTube → `streamers/youtube-scraper`  (actorId `streamers~youtube-scraper`)
Search results, channels, videos — alternative YouTube API. Use for market + academic talks.
```json
{
  "searchQueries": ["agent business ideas 2026"],
  "maxResults": 8,
  "maxResultsShorts": 0,
  "downloadSubtitles": true
}
```
Output items include `title`, `text`/`description`, `viewCount`, `likes`, `commentsCount`, `channelName`, `url`, optionally `subtitles` → map to `sources` (platform `youtube`).

## Adapter contract (`orchestrator/apify.ts`)
One function per tool, all returning the normalized `Source[]`:
```ts
type Source = {
  platform: 'web'|'tiktok'|'youtube'|'reddit'|'x',
  url: string, title: string, author: string,
  metrics: Record<string, number>, excerpt: string, raw: unknown,
}
scrapeWeb(urls|query, n): Promise<Source[]>
scrapeTikTok(query, n): Promise<Source[]>
scrapeYouTube(query, n): Promise<Source[]>
```
`scrapeAll(specs)` dispatches each `SearchSpec.tool` to the right adapter, concurrently, with a concurrency cap and per-search try/catch (a failed actor → empty list + a `failed` searches row, never aborts the run).

## Cost / limits
- Each actor run costs compute units; keep `maxResults`/`maxCrawlPages` small (≈8 and ≈5). The `budgetUsd` tunable gates how many searches we plan.
- Global API limit is generous (250k req/min); the bottleneck is actor runtime, hence async+poll for big jobs.
- Cache by `(tool, query)` within a run to avoid duplicate scrapes.
