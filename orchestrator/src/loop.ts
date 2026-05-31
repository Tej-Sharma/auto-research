// The iterative research loop (see docs/02-iteration-algorithm.md).
import type { RunConfig } from './config.js';
import { pool } from './config.js';
import { Insforge } from './insforge.js';
import { LLM } from './llm.js';
import { Apify } from './apify.js';
import { makeIds, type Ids } from './ids.js';
import { trackMarketGap } from './track.js';
import type { Finding, Gap, Source, SearchSpec, Analysis } from './types.js';

const statusText = (mode: string, phase: string): string => {
  const market = mode === 'market';
  const map: Record<string, string> = {
    search: market ? 'Listening across Reddit · X · TikTok · YouTube · competitor sites…' : 'Searching the literature and the web…',
    extract: market ? 'Pulling out signals…' : 'Extracting findings from sources…',
    subsearch: market ? 'Triangulating signals…' : 'Running parallel sub-searches…',
    synth: market ? 'Identifying unmet needs and competitive whitespace…' : 'Synthesizing the evidence…',
    gaps: market ? 'Surfacing opportunities…' : 'Surfacing open gaps…',
    invest: market ? 'Checking whether anyone already built this…' : 'Investigating whether the gap is already filled…',
    report: market ? 'Drafting the build plans…' : 'Writing the final report…',
  };
  return map[phase] ?? phase;
};

const bubblesFor = (s: Source): string[] => {
  const out: string[] = [];
  for (const [k, v] of Object.entries(s.metrics)) {
    if (v >= 1000) out.push(`${(v / 1000).toFixed(v >= 1e6 ? 1 : 0)}${v >= 1e6 ? 'M' : 'K'} ${k}`);
  }
  s.excerpt.split(/[.,;]/).map((p) => p.trim()).filter((p) => p.length > 6 && p.length < 40)
    .slice(0, 3).forEach((p) => out.push(p));
  return out.slice(0, 4);
};

export class Loop {
  private io: Insforge;
  private llm: LLM;
  private apify: Apify;
  private ids: Ids;
  private stats = { sourcesRead: 0, gapsSurfaced: 0, novelCount: 0, addressedCount: 0 };

  constructor(private cfg: RunConfig) {
    this.io = new Insforge(cfg);
    this.llm = new LLM(cfg);
    this.apify = new Apify(cfg.apifyToken);
    this.ids = makeIds(cfg.runId);
  }

  /** Run specs through Apify, persist searches + sources, emit source nodes. */
  private async scrapeAll(
    specs: SearchSpec[], parentKind: string, parentId: string | null,
    opts: { reader?: boolean; nodeKind?: string; baseX?: number; y?: number } = {},
  ): Promise<Source[]> {
    const { mode } = this.cfg;
    const n = this.cfg.params.sourcesPerSearch;
    const results = await pool(specs.map((spec, si) => async () => {
      const searchId = await this.io.addSearch({
        parent_kind: parentKind, parent_id: parentId, tool: spec.tool,
        query: spec.query, rationale: spec.rationale,
      });
      try {
        const scraped = await this.apify.scrapeOne(spec, n);
        const saved = await this.io.addSources(searchId, scraped);
        await this.io.finishSearch(searchId, 'done');
        // emit source/paperBar nodes
        for (let i = 0; i < saved.length; i++) {
          const s = saved[i];
          await this.io.emit('node.add', {
            kind: opts.nodeKind ?? 'source', id: s.id, parentId,
            x: (opts.baseX ?? 40) + ((si * (n) + i) % 4) * 260,
            y: opts.y ?? 180,
            data: { platform: s.platform, url: s.url, title: s.title, author: s.author, metrics: s.metrics, excerpt: s.excerpt },
          });
          if (parentId) await this.io.emit('edge.add', { from: s.id, to: parentId, kind: 'flow' });
          // paper-reader animation for seed scrapes
          if (opts.reader) {
            await this.io.emit('reader.open', { source: { platform: s.platform, title: s.title, author: s.author } });
            await this.io.emit('reader.bubble', { bubbles: bubblesFor(s) });
            await this.io.emit('reader.close', {});
          }
        }
        return saved;
      } catch (e: any) {
        await this.io.finishSearch(searchId, 'failed');
        await this.io.emit('status', { phase: 'warn', text: `Search failed (${spec.tool}): ${spec.query}` });
        return [] as Source[];
      }
    }), this.cfg.params.concurrency);
    const all = results.flat();
    this.stats.sourcesRead += all.length;
    await this.io.setStats(this.stats);
    return all;
  }

  async run() {
    const { mode, query, params } = this.cfg;
    const run = await this.io.run();
    const userId = run?.user_id;
    await this.io.setStatus('running');

    // ── 0. SEED ──────────────────────────────────────────────
    await this.io.emit('node.add', { kind: 'query', id: `${this.cfg.runId}:q`, x: 400, y: 20, data: { query } });
    await this.io.emit('status', { phase: 'search', text: statusText(mode, 'search') });
    const seedSpecs = await this.llm.planSearches(mode, query, params.seedSearches);
    const seeds = await this.scrapeAll(seedSpecs.searches, 'seed', `${this.cfg.runId}:q`, { reader: true, nodeKind: 'source', y: 180 });

    // ── 1. FINDINGS → ANALYSIS → GAP ─────────────────────────
    await this.io.emit('status', { phase: 'extract', text: statusText(mode, 'extract') });
    const extracted = await this.llm.extractFindings(mode, query, seeds);
    const findings: Finding[] = extracted.findings.map((f) => ({ ...f, id: this.ids.finding() }));
    for (let i = 0; i < findings.length; i++) {
      const f = findings[i];
      await this.io.addFinding(f);
      await this.io.emit('node.add', { kind: 'finding', id: f.id, x: 60 + i * 340, y: 420, data: { title: f.title, evidence: f.evidence } });
      for (const sid of f.sourceIds) await this.io.emit('edge.add', { from: sid, to: f.id, kind: 'extract' });
    }

    const gaps: Gap[] = [];
    await pool(findings.map((f, i) => async () => {
      await this.io.emit('status', { phase: 'subsearch', text: statusText(mode, 'subsearch') });
      const specs = await this.llm.planSubSearches(mode, f, params.subSearches);
      const sub = await this.scrapeAll(specs.searches, 'finding', f.id, { nodeKind: 'paperBar', baseX: 60 + i * 340, y: 560 });

      await this.io.emit('status', { phase: 'synth', text: statusText(mode, 'synth') });
      const a = await this.llm.analyzeFinding(mode, f, sub);
      const analysis: Analysis = { ...a, id: this.ids.analysis() };
      await this.io.addAnalysis(analysis, 'finding', f.id);
      await this.io.emit('node.add', { kind: 'analysis', id: analysis.id, parentId: f.id, x: 60 + i * 340, y: 720, data: analysis });
      await this.io.emit('edge.add', { from: f.id, to: analysis.id, kind: 'flow' });

      const g = await this.llm.detectGap(mode, f, analysis);
      const gap: Gap = { ...g, id: this.ids.gap(), findingId: f.id, status: 'detected', depth: 0 };
      await this.io.addGap(gap);
      await this.io.emit('gap.update', gap);
      gaps.push(gap);
    }), this.cfg.params.concurrency);
    this.stats.gapsSurfaced = gaps.length;
    await this.io.setStats(this.stats);

    // ── 2. GAP INVESTIGATION (iterate-like-this) ─────────────
    const queue = [...gaps];
    while (queue.length) {
      const gap = queue.shift()!;
      gap.status = 'investigating';
      await this.io.updateGap(gap.id, { status: 'investigating' });
      await this.io.emit('gap.update', gap);
      await this.io.emit('status', { phase: 'invest', text: statusText(mode, 'invest') });

      const specs = await this.llm.planGapProbe(mode, gap, params.gapSearches);
      const evidence = await this.scrapeAll(specs.searches, 'gap', gap.id, { nodeKind: 'paperBar', y: 880 });
      const verdict = await this.llm.judgeGap(mode, gap, evidence);
      const analysis: Analysis = { id: this.ids.analysis(), tone: verdict.tone, verdict: verdict.verdict, body: verdict.body };
      await this.io.addAnalysis(analysis, 'gap', gap.id);
      await this.io.emit('node.add', { kind: 'analysis', id: analysis.id, parentId: gap.id, y: 1000, data: analysis });
      gap.saturation = verdict.saturation;

      if (verdict.tone === 'novel') {
        gap.status = 'novel';
        const plan = await this.llm.draftPlan(mode, gap);
        gap.plan = { ...plan, winnability: verdict.winnability ?? plan.winnability };
        await this.io.updateGap(gap.id, { status: 'novel', saturation: gap.saturation, plan: gap.plan });
        await this.io.emit('gap.update', gap);
        this.stats.novelCount++;
        if (userId) await trackMarketGap(this.io, userId, mode, gap, verdict);
      } else if (verdict.tone === 'addressed') {
        gap.status = 'addressed';
        await this.io.updateGap(gap.id, { status: 'addressed', saturation: gap.saturation });
        await this.io.emit('gap.update', gap);
        this.stats.addressedCount++;
        if (userId) await trackMarketGap(this.io, userId, mode, gap, verdict);
      } else {
        // mixed → partial → derive a sharper sub-gap and recurse
        gap.status = 'partial';
        await this.io.updateGap(gap.id, { status: 'partial', saturation: gap.saturation });
        await this.io.emit('gap.update', gap);
        if (gap.depth < params.maxGapDepth) {
          const sub = await this.llm.deriveSubGap(mode, gap, verdict);
          const subGap: Gap = { ...sub, id: this.ids.subGap(gap.id), parentGapId: gap.id, findingId: gap.findingId, status: 'detected', depth: gap.depth + 1 };
          await this.io.addGap(subGap);
          await this.io.emit('gap.update', subGap);
          await this.io.emit('edge.add', { from: gap.id, to: subGap.id, kind: 'spawn' });
          this.stats.gapsSurfaced++;
          queue.push(subGap);
        } else {
          // depth cap → treat remaining open question as novel
          gap.status = 'novel';
          const plan = await this.llm.draftPlan(mode, gap);
          gap.plan = plan;
          await this.io.updateGap(gap.id, { status: 'novel', plan });
          await this.io.emit('gap.update', gap);
          this.stats.novelCount++;
          if (userId) await trackMarketGap(this.io, userId, mode, gap, verdict);
        }
      }
      await this.io.setStats(this.stats);
    }

    // ── 3. FINAL ANALYSIS ────────────────────────────────────
    await this.io.emit('status', { phase: 'report', text: statusText(mode, 'report') });
    const report = await this.llm.synthesize(mode, query, findings, gaps);
    await this.io.addReport({
      summary: report.summary, novel: report.novel,
      addressed: report.addressed ?? [], stats: this.stats,
    });
    await this.io.emit('report.ready', { runId: this.cfg.runId });
    await this.io.setStatus('done', { stats: this.stats });
  }
}
