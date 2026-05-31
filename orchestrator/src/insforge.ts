// InsForge REST client (server-side, admin key). Handles all writes + the
// canvas_events stream that drives the live/replay canvas.
import type { RunConfig } from './config.js';
import type { Source, Finding, Analysis, Gap, Report } from './types.js';

export class Insforge {
  private base: string;
  private key: string;
  readonly runId: string;
  private seq = 0;

  constructor(cfg: RunConfig) {
    this.base = `${cfg.insforgeUrl}/api/database/records`;
    this.key = cfg.insforgeKey;
    this.runId = cfg.runId;
  }

  private async req(method: string, path: string, body?: unknown, returnRep = true): Promise<any> {
    const res = await fetch(`${this.base}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        ...(returnRep ? { Prefer: 'return=representation' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`InsForge ${method} ${path} -> ${res.status}: ${text}`);
    }
    return res.status === 204 ? [] : res.json();
  }

  insert<T = any>(table: string, rows: object[]): Promise<T[]> {
    return this.req('POST', table, rows);
  }
  update<T = any>(table: string, filter: string, patch: object): Promise<T[]> {
    return this.req('PATCH', `${table}?${filter}`, patch);
  }
  async select<T = any>(table: string, qs: string): Promise<T[]> {
    return this.req('GET', `${table}?${qs}`, undefined, false);
  }

  // ───────── run lifecycle ─────────
  setStatus(status: string, extra: object = {}) {
    return this.update('research_runs', `id=eq.${this.runId}`, { status, ...extra });
  }
  setStats(stats: object) {
    return this.update('research_runs', `id=eq.${this.runId}`, { stats });
  }

  // ───────── canvas events (live + replay) ─────────
  async emit(type: string, payload: object) {
    this.seq += 1;
    await this.insert('canvas_events', [
      { run_id: this.runId, seq: this.seq, type, payload },
    ]);
  }

  // ───────── domain writes ─────────
  async addSearch(s: {
    parent_kind: string; parent_id?: string | null; tool: string;
    query: string; rationale?: string;
  }): Promise<string> {
    const [row] = await this.insert('searches', [
      { run_id: this.runId, status: 'running', ...s },
    ]);
    return row.id;
  }
  finishSearch(id: string, status: 'done' | 'failed', apifyRunId?: string) {
    return this.update('searches', `id=eq.${id}`, { status, apify_run_id: apifyRunId ?? null });
  }

  /** Persist sources, returns them with assigned ids. */
  async addSources(searchId: string, sources: Source[]): Promise<Source[]> {
    if (!sources.length) return [];
    const rows = sources.map((s) => ({
      run_id: this.runId, search_id: searchId, platform: s.platform,
      url: s.url, title: s.title, author: s.author,
      metrics: s.metrics, excerpt: s.excerpt, raw: s.raw ?? null,
    }));
    const saved = await this.insert('sources', rows);
    return saved.map((r: any, i: number) => ({ ...sources[i], id: r.id }));
  }

  addFinding(f: Finding) {
    return this.insert('findings', [{
      id: f.id, run_id: this.runId, title: f.title,
      evidence: f.evidence, source_ids: f.sourceIds,
    }]);
  }
  addAnalysis(a: Analysis, targetKind: 'finding' | 'gap', targetId: string) {
    return this.insert('analyses', [{
      id: a.id, run_id: this.runId, target_kind: targetKind, target_id: targetId,
      tone: a.tone, verdict: a.verdict, body: a.body,
    }]);
  }
  addGap(g: Gap) {
    return this.insert('gaps', [{
      id: g.id, run_id: this.runId, parent_gap_id: g.parentGapId ?? null,
      finding_id: g.findingId ?? null, title: g.title, why: g.why,
      status: g.status, depth: g.depth, saturation: g.saturation ?? null,
      plan: g.plan ?? null,
    }]);
  }
  updateGap(id: string, patch: object) {
    return this.update('gaps', `id=eq.${id}`, patch);
  }
  addReport(r: Report) {
    return this.insert('reports', [{
      run_id: this.runId, summary: r.summary, novel: r.novel,
      addressed: r.addressed, stats: r.stats,
    }]);
  }
  addMarketGap(row: object) {
    return this.insert('market_gaps', [row]);
  }
  marketGapByFingerprint(userId: string, fingerprint: string) {
    return this.select('market_gaps',
      `user_id=eq.${userId}&fingerprint=eq.${fingerprint}&order=tracked_at.desc&limit=1`);
  }
  /** read the run row (for user_id, etc.) */
  async run(): Promise<any> {
    const [row] = await this.select('research_runs', `id=eq.${this.runId}&limit=1`);
    return row;
  }
}
