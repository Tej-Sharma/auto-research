// Apify scraping adapters. Each returns normalized Source[]. Uses the
// run-sync-get-dataset-items endpoint (one call, waits for the dataset).
import type { Source, SearchSpec, Tool } from './types.js';

const ACTORS = {
  tiktok: 'clockworks~tiktok-scraper',
  youtube: 'streamers~youtube-scraper',
  web: 'apify~website-content-crawler',
  serp: 'apify~google-search-scraper',
} as const;

const num = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clip = (s: string, n = 360) => (s.length > n ? s.slice(0, n) + '…' : s);

export class Apify {
  constructor(private token: string) {}

  private async runActor(actor: string, input: object): Promise<any[]> {
    if (!this.token) throw new Error('APIFY_TOKEN not set');
    const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${this.token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Apify ${actor} -> ${res.status}: ${t.slice(0, 300)}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async scrapeTikTok(query: string, n: number): Promise<Source[]> {
    const items = await this.runActor(ACTORS.tiktok, {
      searchQueries: [query], resultsPerPage: n,
      shouldDownloadVideos: false, shouldDownloadCovers: false,
    });
    return items.slice(0, n).map((it: any) => ({
      platform: 'tiktok' as const,
      url: str(it.webVideoUrl || it.videoUrl),
      title: clip(str(it.text || it.desc), 140),
      author: str(it.authorMeta?.name || it.authorMeta?.nickName || it['authorMeta.name']),
      metrics: {
        views: num(it.playCount), likes: num(it.diggCount),
        comments: num(it.commentCount), shares: num(it.shareCount),
      },
      excerpt: clip(str(it.text || it.desc)),
      raw: it,
    }));
  }

  async scrapeYouTube(query: string, n: number): Promise<Source[]> {
    const items = await this.runActor(ACTORS.youtube, {
      searchQueries: [query], maxResults: n, maxResultsShorts: 0, downloadSubtitles: false,
    });
    return items.slice(0, n).map((it: any) => ({
      platform: 'youtube' as const,
      url: str(it.url || it.videoUrl),
      title: clip(str(it.title), 160),
      author: str(it.channelName || it.channelTitle),
      metrics: {
        views: num(it.viewCount), likes: num(it.likes), comments: num(it.commentsCount),
      },
      excerpt: clip(str(it.text || it.description)),
      raw: it,
    }));
  }

  /** Web: crawl explicit URLs, else run a SERP and use organic results as sources. */
  async scrapeWeb(query: string, urls: string[] | undefined, n: number): Promise<Source[]> {
    if (urls && urls.length) {
      const items = await this.runActor(ACTORS.web, {
        startUrls: urls.slice(0, n).map((u) => ({ url: u })),
        crawlerType: 'playwright:adaptive', maxCrawlPages: Math.min(n, 5),
        proxyConfiguration: { useApifyProxy: true },
        removeElementsCssSelector: 'nav, footer, script, style, noscript',
        blockMedia: true,
      });
      return items.slice(0, n).map((it: any) => ({
        platform: 'web' as const,
        url: str(it.url), title: clip(str(it.title || it.metadata?.title), 160),
        author: str(it.metadata?.author || new URL(str(it.url) || 'http://x').hostname),
        metrics: {}, excerpt: clip(str(it.text || it.markdown)), raw: it,
      }));
    }
    // SERP fallback: turn a query into organic results
    const pages = await this.runActor(ACTORS.serp, {
      queries: query, maxPagesPerQuery: 1, resultsPerPage: n,
    });
    const organic = pages.flatMap((p: any) => p.organicResults || []);
    return organic.slice(0, n).map((r: any) => ({
      platform: 'web' as const,
      url: str(r.url), title: clip(str(r.title), 160),
      author: str(r.displayedUrl || (r.url ? new URL(str(r.url)).hostname : '')),
      metrics: {}, excerpt: clip(str(r.description || r.snippet)), raw: r,
    }));
  }

  scrapeOne(spec: SearchSpec, n: number): Promise<Source[]> {
    switch (spec.tool) {
      case 'tiktok': return this.scrapeTikTok(spec.query, n);
      case 'youtube': return this.scrapeYouTube(spec.query, n);
      case 'web': return this.scrapeWeb(spec.query, spec.urls, n);
      default: return Promise.resolve([]);
    }
  }
}
