// The reasoning layer. Calls Claude via the InsForge AI gateway (OpenRouter)
// using the OpenAI SDK with forced tool-calling for structured JSON output.
import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { RunConfig, Params } from './config.js';
import type { Mode, Source, Finding, Analysis, Gap, GapVerdict } from './types.js';

const SearchSpecZ = z.object({
  tool: z.enum(['web', 'tiktok', 'youtube']),
  query: z.string(),
  rationale: z.string().optional(),
  urls: z.array(z.string()).optional(),
});
const SearchesZ = z.object({ searches: z.array(SearchSpecZ) });
const FindingsZ = z.object({
  findings: z.array(z.object({
    title: z.string(), evidence: z.string(), sourceIds: z.array(z.string()),
  })),
});
const AnalysisZ = z.object({
  tone: z.enum(['good', 'mixed']), verdict: z.string(), body: z.string(),
});
const GapZ = z.object({ title: z.string(), why: z.string() });
const VerdictZ = z.object({
  tone: z.enum(['novel', 'addressed', 'mixed']),
  verdict: z.string(), body: z.string(),
  saturation: z.number().min(0).max(1),
  winnability: z.number().min(0).max(1).optional(),
  evidenceRefs: z.array(z.string()).default([]),
});
const PlanZ = z.object({
  name: z.string(), wedge: z.string(),
  facts: z.array(z.string()).default([]),
  winnability: z.number().min(0).max(1).optional(),
});
const ReportZ = z.object({
  summary: z.array(z.string()),
  novel: z.array(z.object({
    title: z.string(), tagline: z.string(), wedge: z.string(),
    facts: z.array(z.string()).default([]), cta: z.string().optional(),
  })),
  addressed: z.array(z.object({ title: z.string() })).default([]),
});

function vocab(mode: Mode) {
  return mode === 'academic'
    ? { sources: 'academic papers and web pages', unit: 'papers', gap: 'open research direction / thesis gap',
        tools: 'web', novelLabel: 'novel thesis direction',
        cta: undefined as string | undefined }
    : { sources: 'social posts (Reddit, X, TikTok, YouTube) and competitor/web pages', unit: 'sources',
        gap: 'unmet need / competitive whitespace', tools: 'tiktok, youtube, web',
        novelLabel: 'agent business to build', cta: 'Implement business plan with agents now →' };
}

const compactSources = (sources: Source[]) =>
  sources.map((s) => ({
    id: s.id, platform: s.platform, author: s.author, title: s.title,
    metrics: s.metrics, excerpt: s.excerpt, url: s.url,
  }));

export class LLM {
  private client: OpenAI;
  private model: string;
  constructor(cfg: RunConfig) {
    this.client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: cfg.openrouterKey });
    this.model = cfg.params.model;
  }

  /** Force a tool call returning JSON validated against `schema`; one retry. */
  private async json<T>(schema: z.ZodType<T>, system: string, user: string): Promise<T> {
    const parameters = zodToJsonSchema(schema as any, { target: 'openAi' }) as any;
    const tools = [{ type: 'function' as const, function: { name: 'emit', description: 'Return the result.', parameters } }];
    let lastErr = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: system },
        { role: 'user', content: attempt === 0 ? user : `${user}\n\nYour previous output was invalid: ${lastErr}\nReturn valid JSON matching the schema.` },
      ];
      const resp = await this.client.chat.completions.create({
        model: this.model, messages, tools,
        tool_choice: { type: 'function', function: { name: 'emit' } },
        temperature: 0.4,
      });
      const call = resp.choices[0]?.message?.tool_calls?.[0];
      const raw = call?.function?.arguments ?? resp.choices[0]?.message?.content ?? '';
      try {
        const parsed = schema.parse(JSON.parse(raw));
        return parsed;
      } catch (e: any) {
        lastErr = String(e?.message ?? e).slice(0, 400);
      }
    }
    throw new Error(`LLM JSON validation failed: ${lastErr}`);
  }

  private sys(mode: Mode) {
    const v = vocab(mode);
    return `You are an autonomous research analyst running an iterative investigation in "${mode}" mode. ` +
      `You work with ${v.sources}. A "gap" is an ${v.gap}. Available search tools: ${v.tools}. ` +
      `Be concrete, calibrated, and evidence-driven. Respond ONLY by calling the provided tool with valid JSON.`;
  }

  // 1
  planSearches(mode: Mode, query: string, n: number) {
    return this.json(SearchesZ, this.sys(mode),
      `Question: "${query}"\nPlan exactly ${n} concrete searches to begin investigating it. ` +
      `Spread across the available tools where useful. For web searches you may include specific URLs in "urls" if you know strong sources.`);
  }
  // 2
  extractFindings(mode: Mode, query: string, sources: Source[]) {
    return this.json(FindingsZ, this.sys(mode),
      `Question: "${query}"\nSources (JSON):\n${JSON.stringify(compactSources(sources))}\n\n` +
      `Extract 3-4 distinct findings. Each finding has a sharp title, a one-line evidence excerpt (quote/paraphrase), ` +
      `and "sourceIds" referencing the source ids it is grounded in.`);
  }
  // 3
  planSubSearches(mode: Mode, finding: Finding, n: number) {
    return this.json(SearchesZ, this.sys(mode),
      `Finding: "${finding.title}"\nEvidence: ${finding.evidence}\n\nPlan ${n} searches to validate and deepen this finding.`);
  }
  // 4
  analyzeFinding(mode: Mode, finding: Finding, sources: Source[]) {
    return this.json(AnalysisZ, this.sys(mode),
      `Finding: "${finding.title}"\nNew sources (JSON):\n${JSON.stringify(compactSources(sources))}\n\n` +
      `Synthesize a verdict on the strength of this finding. tone="good" if well-corroborated, "mixed" if partial.`);
  }
  // 5
  detectGap(mode: Mode, finding: Finding, analysis: Analysis) {
    return this.json(GapZ, this.sys(mode),
      `Finding: "${finding.title}"\nAnalysis: ${analysis.verdict} — ${analysis.body}\n\n` +
      `What open problem / unmet need does this expose? Return a crisp gap {title, why}.`);
  }
  // 6
  planGapProbe(mode: Mode, gap: Gap, n: number) {
    return this.json(SearchesZ, this.sys(mode),
      `Gap: "${gap.title}"\nWhy it matters: ${gap.why}\n\n` +
      `Plan ${n} searches specifically to determine whether this gap is ALREADY filled — ` +
      `look for existing products, papers, projects, or competitors that address it. Search for prior art, not more demand.`);
  }
  // 7  — the crux
  judgeGap(mode: Mode, gap: Gap, evidence: Source[]) {
    return this.json(VerdictZ, this.sys(mode),
      `Gap: "${gap.title}"\nWhy: ${gap.why}\nPrior-art evidence (JSON):\n${JSON.stringify(compactSources(evidence))}\n\n` +
      `Decide, calibrated: tone="novel" ONLY if the evidence genuinely shows no one addresses this; ` +
      `"addressed" if a clear existing solution is found; "mixed" if partially covered but a sharper open question remains. ` +
      `saturation: 0 (open) .. 1 (crowded). winnability: 0..1 how buildable/tractable. evidenceRefs: source ids used.`);
  }
  // 8 — only on mixed
  deriveSubGap(mode: Mode, gap: Gap, verdict: GapVerdict) {
    return this.json(GapZ, this.sys(mode),
      `Gap: "${gap.title}"\nIt is partially addressed: ${verdict.body}\n\n` +
      `Identify a sharper, still-open sub-question that remains. Return {title, why}.`);
  }
  // 9a
  draftPlan(mode: Mode, gap: Gap) {
    const v = vocab(mode);
    return this.json(PlanZ, this.sys(mode),
      `Novel ${v.novelLabel}: "${gap.title}"\nWhy open: ${gap.why}\n\n` +
      (mode === 'market'
        ? `Draft a buildable business: name (1-2 words), wedge (one sentence on what it does + pricing), 3-4 punchy facts (TAM, metrics, build stack), winnability 0..1.`
        : `Draft the thesis angle: name (short title), wedge (the concrete contribution), 3-4 facts (why tractable, what to build/measure), winnability 0..1.`));
  }
  // 9b
  async synthesize(mode: Mode, query: string, findings: Finding[], gaps: Gap[]) {
    const v = vocab(mode);
    const novelGaps = gaps.filter((g) => g.status === 'novel');
    const r = await this.json(ReportZ, this.sys(mode),
      `Question: "${query}"\nFindings: ${JSON.stringify(findings.map((f) => f.title))}\n` +
      `Novel gaps + plans: ${JSON.stringify(novelGaps.map((g) => ({ title: g.title, plan: g.plan })))}\n` +
      `Addressed/partial gaps: ${JSON.stringify(gaps.filter((g) => g.status !== 'novel').map((g) => g.title))}\n\n` +
      `Write the final report. summary: 4-5 bullets recapping the investigation. ` +
      `novel: one card per novel ${v.novelLabel} with {title(name), tagline, wedge, facts[]${v.cta ? `, cta:"${v.cta}"` : ''}}. ` +
      `addressed: the already-solved items as {title}.`);
    return r;
  }
}
