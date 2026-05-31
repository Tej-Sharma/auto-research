# Auto Research — Build Plan

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Phase 0 — Docs & scaffold
- [x] Fetch + read the Constella design bundle (HTML/CSS/JSX/chats/screenshots)
- [x] Research Daytona, Apify, InsForge
- [x] Write `docs/00–09` (overview, architecture, iteration algo, data model, integrations, UI spec, market-gap tracking)
- [x] `tasks/todo.md`, `tasks/lessons.md`, `.env.example`
- [~] Copy design reference into repo; scaffold `web/`, `orchestrator/`, `insforge/`

## Phase 1 — InsForge backend
- [ ] `npx @insforge/cli login` + `link --project-id 53f5746b…` (installs skills)
- [ ] Write `insforge/migrations/0001_init.sql` (tables from `docs/03`)
- [ ] Apply migration; verify with `npx @insforge/cli metadata`
- [ ] Configure realtime on `canvas_events` / channel `run:{id}`
- [ ] Set edge-function secrets (DAYTONA/APIFY/ANTHROPIC/INSFORGE_SERVICE_KEY)
- [x] RLS: users read only their own runs + children (in 0001 migration)
- [x] Implement edge function `start-run` (insforge/functions/start-run) — deploy pending Daytona key
- [x] Store secrets INSFORGE_SERVICE_KEY / OPENROUTER_API_KEY / LLM_MODEL (APIFY/DAYTONA pending)

## Phase 2 — Orchestrator (the loop)  ✅ built + LLM verified
- [x] `orchestrator/` TS project (esbuild bundle target, typechecks clean)
- [x] `insforge.ts` — REST writes + canvas_events emit (realtime via DB trigger)
- [x] `apify.ts` — scrapeWeb / scrapeTikTok / scrapeYouTube + scrapeOne
- [x] `llm.ts` — the 9 calls w/ zod schemas via InsForge AI gateway — **verified live**
- [x] `loop.ts` — seed → findings → analysis → gap → investigate → recurse → report (docs/02)
- [x] `track.ts` — trackMarketGap (docs/09)
- [x] `run.ts` entry — read env, run loop, terminal status, error path
- [ ] Full local run against InsForge (BLOCKED: needs APIFY_TOKEN for scraping)

## Phase 3 — Daytona
- [x] start-run creates sandbox, injects env, clones+builds+runs orchestrator (async session)
- [ ] Pre-bundle `run.js` (esbuild) for fast cold start; or snapshot with deps (optimization)
- [ ] Verify a run executes fully inside a sandbox and self-deletes (BLOCKED: needs DAYTONA_API_KEY)

## Phase 4 — Web UI  ✅ design implemented + verified in browser
- [x] Vite scaffold (`web/`), serves the Constella design verbatim (React UMD + Babel)
- [x] All components present (design reused 1:1): IconRail, chrome, CommandHero, Canvas, nodes, Edges, GapsPanel, Report, PaperReader, TweaksPanel
- [x] **Demo mode verified end-to-end in browser**: idle hero → query node → seed cards w/ brand logos → findings/analyses/gaps → final report w/ business-idea CTAs
- [x] Live mode: `live.js` maps InsForge canvas_events → design reducer; `LiveReport` overlay; auto-starts on `?run=<id>`
- [x] Env injection (`VITE_INSFORGE_URL`/`ANON_KEY`); builds clean
- [ ] Auth (InsForge session) so live mode passes a user token to read RLS rows
- [ ] Switch live transport from polling → InsForge realtime websocket (upgrade)
- [ ] `/tracked` market-gap dashboard (docs/09)

## Phase 5 — Wire + verify (end-to-end)
- [ ] Run button → start-run → Daytona → Apify/Anthropic → InsForge → realtime → canvas
- [ ] Verify live animation matches the design; report renders; data persists
- [ ] Reopen a finished run → replays correctly
- [ ] Market-gap tracking populates across two runs
- [ ] Error paths: actor failure, LLM retry, sandbox cleanup on crash

## Review
- (fill in after implementation: what shipped, what's stubbed, follow-ups)
