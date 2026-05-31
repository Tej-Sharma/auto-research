# 07 · LLM reasoning (via InsForge AI gateway)

> **Implementation choice (locked in):** the LLM runs through the **InsForge AI gateway (OpenRouter)**, not a direct Anthropic key. We use the `openai` SDK pointed at OpenRouter with Claude model slugs (`anthropic/claude-sonnet-4.5` default; `anthropic/claude-opus-4.8` available). The gateway key comes from `npx @insforge/cli ai setup` (`OPENROUTER_API_KEY`). The nine calls below and their schemas are implemented in `orchestrator/src/llm.ts` and **verified working** against the live gateway. The Anthropic-SDK snippet below is kept only as a reference for the equivalent direct path.

Every reasoning node is a forced structured-output call. We force a single `tools`/`tool_choice` function whose parameters are the JSON Schema (derived from a zod schema), parse `tool_calls[0].function.arguments`, validate with zod, and retry once on mismatch.

```ts
import OpenAI from 'openai'
const client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY })
// reference-only direct path: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

## Shared preamble (cached)
A system block describing: the role ("autonomous research analyst"), the mode (academic vs market) with its vocabulary (papers↔sources, thesis gap↔market whitespace), and "respond ONLY via the provided tool". Mark it `cache_control: { type: 'ephemeral' }`.

## The nine calls (each returns a tool input matching a JSON schema)

### 1. `planSearches({ query, mode, n }) → SearchSpec[]`
"Turn this question into `n` concrete searches across the available tools." Output:
```json
{ "searches": [ { "tool": "tiktok", "query": "...", "rationale": "..." } ] }
```
Academic tools: `web`. Market tools: `tiktok`, `youtube`, `web` (reddit/x via web/SERP). The LLM picks tools per query.

### 2. `extractFindings({ query, mode, sources }) → Finding[]`
Given the scraped sources (title+excerpt+metrics), extract 3–4 findings, each citing `sourceIds`. Output `{ findings: [{ title, evidence, sourceIds }] }`.

### 3. `planSubSearches({ finding, mode, n }) → SearchSpec[]`
"To validate/deepen this finding, what should we search next?" Same shape as #1.

### 4. `analyzeFinding({ finding, sources, mode }) → Analysis`
Synthesize the sub-search sources into a verdict. Output `{ tone: 'good'|'mixed', verdict, body }` (a confirmation/strength assessment).

### 5. `detectGap({ finding, analysis, mode }) → Gap`
"What open problem / unmet need does this expose?" Output `{ title, why }`.

### 6. `planGapProbe({ gap, mode, n }) → SearchSpec[]`  ← the "has anyone done this?" searches
Explicitly prompt for prior-art / existing-product / existing-paper queries: *"search to determine whether this gap is already filled by an existing product, paper, or project."* Same shape as #1.

### 7. `judgeGap({ gap, evidence, mode }) → Verdict`   ← the crux
Given fresh prior-art evidence, decide. Output:
```json
{ "tone": "novel" | "addressed" | "mixed",
  "verdict": "Greenfield" | "Already solved by X" | "Partial coverage",
  "body": "...",
  "saturation": 0.0,            // 0=open, 1=crowded
  "evidenceRefs": ["src_id"] }
```
Instruction emphasizes calibration: only `novel` if evidence genuinely shows no one addresses it; `addressed` if a clear existing solution is found; otherwise `mixed`.

### 8. `deriveSubGap({ gap, verdict, mode }) → Gap`   ← only on `mixed`
"Given that the gap is partially addressed, what sharper, still-open sub-question remains?" Output `{ title, why }`. This is what makes it iterate.

### 9. `draftPlan({ gap, mode }) → Plan`  +  `synthesize({ query, mode, findings, gaps }) → Report`
- `draftPlan` (novel gaps): market → `{ name, wedge, facts[] }` (the business-plan card payload, mirrors `scenes.js` `plans`); academic → `{ angle, why_tractable }`.
- `synthesize`: the final report — `{ summary[], novel[], addressed[], stats }`, mode-templated (papers read / novel directions ↔ sources read / agent businesses + CTA label "Implement business plan with agents now →").

## Schema enforcement & retries
Each call forces `tool_choice: { type: 'tool', name: '...' }`. Validate the returned JSON against a zod schema; on mismatch, retry once with the validation error appended. This is the same "structured output" guarantee the Workflow harness uses.

## Cost control
- Cache the system preamble across all calls in a run.
- Keep source payloads to title+excerpt+metrics (not raw HTML) when feeding the LLM.
- `budgetUsd` in `run.params` gates planning: before planning new searches/sub-gaps, check accumulated token cost; stop expanding when exceeded (treat remaining gaps as terminal).
- Model: default `claude-opus-4-8`; allow `claude-sonnet-4-6` override for cheaper/faster runs via `params.model`.

## Determinism for replay
LLM calls aren't deterministic, but we don't re-run them on replay — the *outputs* are persisted as rows + `canvas_events`. Replay reads stored data, so a finished run always looks identical when reopened.
