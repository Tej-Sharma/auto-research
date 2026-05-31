# 02 · The Iteration Algorithm (the heart)

This is the loop the user described:

> user enters a query → it generates searches → finds info → uses LLM analysis → finds more queries and searches (LLM analysis again on whether the gaps are filled or others have done them) → and then does it again → and iterates like this.

It maps 1:1 onto the design's data model (`seeds → findings → subSearch → analysis → gap → investigation → newGap → report`). Every step (a) writes rows to InsForge and (b) emits a `canvas_event` so the UI animates it.

## Glossary
- **Search spec** — `{ tool: 'web'|'tiktok'|'youtube', query, rationale }`. Produced by the LLM, executed by Apify.
- **Source** — one scraped item (page / video / post) with `{ url, title, author, metrics, excerpt }`.
- **Finding** — a claim the sources support: `{ title, evidence, sourceIds }`.
- **Analysis** — verdict on a finding/gap: `{ tone: 'good'|'mixed'|'novel'|'addressed', verdict, body }`.
- **Gap** — an open problem / unmet need: `{ title, why, status, depth, saturation }`.
- **Terminal gap** — a gap judged **novel** (nobody addresses it → opportunity) or **addressed** (already solved → drop).

## Tunables (`run.params`)
```
maxRounds       = 2     // outer re-investigation rounds
maxGapDepth     = 2     // sub-gap recursion depth
seedSearches    = 4     // searches in the seed round
subSearches     = 3     // searches per finding
gapSearches     = 2     // searches per gap investigation
sourcesPerSearch= 8     // Apify items kept per search
model           = 'claude-opus-4-8'
budgetUsd       = 2.00  // soft cap; stop planning new work past it
```

## Pseudocode

```ts
async function runResearch(runId, query, mode, params) {
  setStatus(runId, 'running')
  emit('status', { phase: 'search', text: t('statusSearch', mode) })

  // ── 0. SEED ROUND ───────────────────────────────────────────────
  const seedSpecs = await llm.planSearches({ query, mode, n: params.seedSearches })
  emit('node.add', queryNode(query))
  const seeds = await scrapeAll(seedSpecs, params)        // Apify
  for (const s of seeds) emit('node.add', sourceNode(s))  // fan-out under query

  emit('status', { phase: 'extract', text: t('statusExtract', mode) })
  const findings = await llm.extractFindings({ query, mode, sources: seeds })
  for (const f of findings) {
    emit('node.add', findingNode(f))
    emit('edge.add', extractEdge(f.sourceIds, f.id))      // dashed teal arrows
  }

  // ── 1. PER-FINDING ANALYSIS + GAP DETECTION ─────────────────────
  const gaps = []
  for (const f of findings) {
    emit('status', { phase: 'subsearch', text: t('statusSubsearch', mode) })
    const specs   = await llm.planSubSearches({ finding: f, mode, n: params.subSearches })
    const subSrc  = await scrapeAll(specs, params)
    for (const s of subSrc) emit('node.add', paperBar(s, f.id))

    emit('status', { phase: 'synth', text: t('statusSynth', mode) })
    const analysis = await llm.analyzeFinding({ finding: f, sources: subSrc, mode })
    emit('node.add', analysisNode(analysis, f.id))

    const gap = await llm.detectGap({ finding: f, analysis, mode })
    gap.depth = 0; gap.status = 'detected'
    persistGap(gap); gaps.push(gap)
    emit('gap.update', gap)            // pops into the right "Open gaps" panel
  }

  // ── 2. GAP INVESTIGATION (the iterate-like-this part) ───────────
  const queue = [...gaps]
  while (queue.length) {
    const gap = queue.shift()
    setGapStatus(gap, 'investigating')               // dashed yellow in panel
    emit('gap.update', gap)
    emit('status', { phase: 'invest', text: t('statusInvest', mode) })

    // search the world for whether this gap is ALREADY filled / done by others
    const specs    = await llm.planGapProbe({ gap, mode, n: params.gapSearches })
    const evidence = await scrapeAll(specs, params)   // Apify
    for (const s of evidence) emit('node.add', paperBar(s, gap.id))

    // LLM analysis AGAIN: is the gap novel, addressed, or partial?
    const verdict = await llm.judgeGap({ gap, evidence, mode })
    emit('node.add', analysisNode(verdict, gap.id))

    if (verdict.tone === 'novel') {
      setGapStatus(gap, 'novel')                      // teal-glow: opportunity
      gap.plan = await llm.draftPlan({ gap, mode })   // business plan / thesis angle
      trackMarketGap(gap, verdict)                    // saturation/opportunity score
    } else if (verdict.tone === 'addressed') {
      setGapStatus(gap, 'addressed')                  // greyed: someone did it
      trackMarketGap(gap, verdict)
    } else { // 'mixed' → partially addressed → derive a sharper sub-gap and recurse
      setGapStatus(gap, 'partial')
      if (gap.depth < params.maxGapDepth && underBudget(params)) {
        const subGap = await llm.deriveSubGap({ gap, verdict, mode })
        subGap.depth = gap.depth + 1; subGap.parentGapId = gap.id
        subGap.status = 'detected'
        persistGap(subGap); emit('gap.update', subGap)
        emit('edge.add', spawnEdge(gap.id, subGap.id)) // "spawned a sharper gap"
        queue.push(subGap)                             // ← iterate again
      } else {
        setGapStatus(gap, 'novel')                     // depth/budget cap → treat as open
        trackMarketGap(gap, verdict)
      }
    }
    emit('gap.update', gap)
  }

  // ── 3. OPTIONAL EXTRA OUTER ROUNDS ──────────────────────────────
  // After a full pass, ask the LLM "what did we miss?" and, if it proposes a
  // genuinely new angle and we're under budget/maxRounds, fold new findings in
  // and re-run steps 1–2 for them. (completeness-critic pattern)

  // ── 4. FINAL ANALYSIS ───────────────────────────────────────────
  emit('status', { phase: 'report', text: t('statusReport', mode) })
  const report = await llm.synthesize({ query, mode, findings, gaps })
  persistReport(runId, report)
  emit('report.ready', { runId })
  setStatus(runId, 'done')
}
```

## The gap judgment (step 2) — the crux

`llm.judgeGap` is the "has anyone already done this?" call. The evidence is fresh scrapes specifically searching for prior art / existing products / existing papers. The LLM returns exactly one of:

| tone | meaning | UI | next |
|------|---------|----|------|
| `novel` | no source addresses it | teal-glow card, **opportunity** | draft plan, track |
| `addressed` | a source clearly already does it | greyed card | track as saturated, drop |
| `mixed` | partially covered, but a sharper open question remains | yellow dashed | **derive sub-gap → recurse** |

The recursion + queue is exactly the design's `gap → investigation → newGap → investigation → analysis(novel)` chain. Convergence is guaranteed by `maxGapDepth` and the budget cap.

## Parallelism
- `scrapeAll` runs the search specs concurrently (Apify runs are independent).
- Per-finding analysis (step 1) can be fanned out concurrently across findings.
- Gap investigations (step 2) are processed from a queue; independent gaps can run concurrently, but sub-gaps are enqueued as discovered (so it stays a controlled fan-out, not unbounded).
- Concurrency cap keeps us under Apify/Anthropic rate limits and the budget.

## Where each LLM call is specified
Prompt contracts + JSON schemas for `planSearches`, `extractFindings`, `analyzeFinding`, `detectGap`, `planGapProbe`, `judgeGap`, `deriveSubGap`, `draftPlan`, `synthesize` are in `07-anthropic-llm.md`.

## Idempotency / resume
Every node has a deterministic id (`run:{runId}:f1`, `:g3b`, …). Writes are upserts keyed on id, and `canvas_events.seq` is a monotonic counter per run, so a re-launched orchestrator can resume without duplicating canvas nodes.
