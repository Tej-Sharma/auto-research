# 09 · Market-Gap Tracking

Beyond a single run's report, we persist every confirmed gap/opportunity into `market_gaps` so the same gap can be **tracked across runs and over time** — its saturation trend, whether it's been built since, and how it ranks against other opportunities. This is the "gap in market tracking" the user asked for.

## What gets tracked
At the end of each gap investigation (`judgeGap`), call `trackMarketGap(gap, verdict)` for any gap that reaches a terminal state (`novel` / `addressed` / capped-`partial`). It writes a `market_gaps` row:

| field | source |
|------|--------|
| `label` | canonical short name (from `gap.plan.name` for market, else gap title) |
| `fingerprint` | normalized key for cross-run dedupe (see below) |
| `status` | the verdict tone |
| `saturation_score` | `verdict.saturation` (0 open → 1 crowded) |
| `opportunity_score` | computed (below) |
| `evidence_refs` | the source ids/urls the verdict used |
| `mode`, `run_id`, `gap_id`, `tracked_at` | context |

## Fingerprint (cross-run identity)
So "AR collections agent for trades" surfaced in two different runs maps to the same tracked gap:
```
fingerprint = sha1(lowercase(strip_stopwords(label + ' ' + key_nouns(title))))
```
On insert, if a row with the same `fingerprint` exists, append to its history rather than creating a duplicate (keep both rows but link by `fingerprint`; the dashboard groups by it). This yields a **timeline per opportunity**: detected → still-open → (later run) now-addressed.

## Opportunity score
A single rank for "how good is this to build right now":
```
opportunity = clamp01( demand * winnability * (1 - saturation_score) )
```
- `demand` — from signal strength: normalized engagement of the backing sources (views/likes/upvotes) + how many independent sources corroborate it.
- `winnability` — LLM estimate in `judgeGap`/`draftPlan` (is it buildable with current tools, is pricing/GTM clear): 0–1.
- `saturation_score` — from `judgeGap`.
`novel` gaps score highest; `addressed` gaps score ~0 but are still tracked (they tell you what *not* to build, and feed the saturation trend).

## Surfacing it
1. **In the report** — novel cards already show fact pills + the "Implement business plan with agents now →" CTA. Add a small saturation/opportunity badge.
2. **Across runs (new view)** — a lightweight "Tracked Gaps" page reading `market_gaps` grouped by `fingerprint`, sorted by latest `opportunity_score`, showing:
   - opportunity name + mode,
   - current status + sparkline of `saturation_score` over `tracked_at`,
   - links back to each run where it appeared,
   - "build now" CTA → seeds a new run pre-filled with the gap as the query (closing the loop).
3. **Re-investigation** — when a tracked gap is re-run later, the new verdict updates the trend; an opportunity that flips `novel → addressed` signals the window closed.

## Why this matters
The single run answers "what's open *today*". The tracker answers "what's *still* open, getting more or less crowded, and best to act on" — turning one-shot research into a watchlist. It reuses the exact same `judgeGap` saturation signal, so it's nearly free to maintain.

## Implementation note
`trackMarketGap` lives in `orchestrator/track.ts` and is a thin upsert into `market_gaps` via InsForge REST. The cross-run dashboard is a small read-only React route in `web/` (`/tracked`) using the InsForge SDK; no extra backend.
