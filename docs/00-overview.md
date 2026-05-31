# 00 · Overview

## What we're building

A reimplementation of the Constella **Auto Research** canvas as a *real* tool. In the design prototype the investigation is a choreographed animation over baked scene data (`scenes.js`). Here, the same canvas is driven by a **live agentic research loop** that actually scrapes the web and reasons with an LLM.

The user types a question. The system:

1. **Plans** a set of searches (an LLM turns the question into concrete queries across web / TikTok / YouTube).
2. **Searches / scrapes** the real sources via Apify.
3. **Extracts findings** from what it pulled (LLM).
4. **Analyzes** each finding with parallel sub-searches and synthesizes a verdict (LLM).
5. **Surfaces gaps** — unmet needs / open problems / market whitespace.
6. **Investigates each gap**: runs more searches to ask *"has anyone already done this / does this already exist?"* (LLM judgment on the new evidence).
7. **Iterates**: if a gap is only *partially* addressed, it derives a sharper sub-gap and investigates that too — repeating until each gap is terminal (genuinely **novel** or already **addressed**).
8. **Final analysis**: an LLM writes the report — novel thesis directions (academic) or agent businesses to build with a CTA (market).
9. **Market-gap tracking**: every confirmed gap/opportunity is persisted with a saturation/opportunity score so it can be tracked across runs.

The canvas builds itself out **live** as this happens — query node → seed sources fan out → extract arrows → findings → analyses → gaps pop into the right panel → investigations confirm or spawn sub-gaps → final report slides up.

## Two modes (same engine)

| | **Academic** | **Market** |
|---|---|---|
| Question | "What's the open thesis gap in X?" | "Which AI-agent businesses should we build?" |
| Sources | papers / web | Reddit, X, TikTok, YouTube, competitor sites |
| Unit | "papers read" | "sources read" |
| Gap = | unexplored research direction | unmet need / competitive whitespace |
| Output | novel directions | business ideas + "Implement business plan with agents now →" CTA |

Both are the same loop and data model; only prompts, source tools, and report templating differ. This mirrors the design's `SCENES` (academic topics + a `market` scene with `reportKeys`/`plans`).

## Why these four services

- **InsForge** — agent-native backend: Postgres + auto REST + realtime + auth + edge functions + hosting. It is both our **system of record** (so results persist and can be viewed later) and the **live transport** (realtime channels drive the canvas). The `start-run` edge function is the secure bridge that launches Daytona.
- **Daytona** — secure, elastic sandboxes that boot in <90ms and run our orchestration program in isolation with outbound network. The long iterative loop lives here, not in a request handler, so it can run for minutes and stream progress.
- **Apify** — 34k+ scraping actors. We use three: TikTok, YouTube, and a generic Website Content Crawler. This is how we touch the *real* web.
- **Anthropic** — `claude-opus-4-8` is the reasoning at every node: planning, extraction, analysis, the gap "is this already solved?" judgment, and final synthesis.

## Reading order

`01-architecture` (how the pieces connect) → `02-iteration-algorithm` (the loop — the most important doc) → `03-data-model` (what we store) → `04..07` (each integration) → `08-ui-spec` (the canvas) → `09-market-gap-tracking`.
