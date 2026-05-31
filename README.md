# Auto Research

An agentic research canvas. You type a question; it **plans searches → scrapes the real web (TikTok / YouTube / web pages) → analyzes with an LLM → surfaces gaps → investigates whether each gap is already filled → derives sharper sub-gaps → iterates** until the gaps converge, then writes a final report. The whole investigation builds itself out live on a node canvas, with an **Open gaps** panel on the right and **market-gap tracking** that persists opportunities across runs.

Two modes:
- **Academic** — find the thesis-shaped gap in a research area (papers, findings, novel directions).
- **Market** — find the agent businesses to build (social signals, unmet needs, competitive whitespace, business-plan CTAs).

It is a real reimplementation of the Constella *Auto Research* design (see `docs/08-ui-spec.md`), driven by live data instead of baked scenes.

## The stack — what runs where

| Layer | Tech | Responsibility |
|------|------|----------------|
| **UI** | Vite + React (`web/`) | The Constella canvas. Reads runs from InsForge, subscribes to **realtime** to animate the canvas live, kicks runs off via an edge function. |
| **Data + bridge** | **InsForge** | Postgres (runs, searches, sources, findings, gaps, market_gaps, canvas_events, reports), realtime channels, auth, hosting, and the `start-run` edge function that holds secrets and launches Daytona. |
| **Orchestration** | **Daytona** (`orchestrator/`) | The iterative research loop runs *inside a Daytona sandbox*. It calls Apify + Anthropic and writes progress to InsForge as it goes. |
| **Scraping** | **Apify** | `clockworks/tiktok-scraper`, `streamers/youtube-scraper`, `apify/website-content-crawler`. |
| **Reasoning** | **Anthropic** | `claude-opus-4-8` for every planning/extraction/analysis/judgment/synthesis step. |

## Data flow (one run)

```
 web (Run) ──▶ InsForge edge fn: start-run ──▶ Daytona: create sandbox + launch orchestrator
                     │                                        │
                     │                                        ▼
                     │                     ┌──── iterate ────────────────────┐
                     │                     │ LLM plan searches               │
                     │                     │ Apify scrape (tiktok/yt/web)    │
                     │                     │ LLM extract findings            │
                     │                     │ LLM analyze + detect gaps       │
                     │                     │ LLM judge gap: novel? addressed?│
                     │                     │   partial → derive sub-gap ↺    │
                     │                     │ LLM final report                │
                     │                     └─────────────┬───────────────────┘
                     ▼                                   ▼
        InsForge tables  ◀──── writes rows + canvas_events ────  orchestrator
                     │
                     ▼  realtime channel  run:{id}
        web canvas animates nodes/edges/gaps live  ──▶  results persist for later viewing
```

## Repository layout

```
auto-research/
├── README.md                 ← you are here
├── docs/                     ← the full plan + spec (read 00 → 09 in order)
│   ├── 00-overview.md
│   ├── 01-architecture.md
│   ├── 02-iteration-algorithm.md   ← the heart: the iterate-like-this loop
│   ├── 03-data-model.md            ← InsForge tables
│   ├── 04-insforge.md
│   ├── 05-daytona.md
│   ├── 06-apify.md
│   ├── 07-anthropic-llm.md
│   ├── 08-ui-spec.md               ← the Constella canvas spec
│   └── 09-market-gap-tracking.md
├── tasks/
│   ├── todo.md               ← checkable build plan
│   └── lessons.md
├── web/                      ← frontend (Vite + React)
├── orchestrator/             ← Daytona orchestration program
├── insforge/                 ← schema migrations + edge functions
└── .env.example
```

## Quickstart (build order)

1. Read `docs/00-overview.md` → `docs/02-iteration-algorithm.md`.
2. InsForge: `npx @insforge/cli login` / `link` → apply `insforge/` schema → deploy `start-run`.
3. `web/`: scaffold + port the canvas; point it at the InsForge project.
4. `orchestrator/`: implement the loop; test locally, then run it in Daytona.
5. Wire realtime end-to-end and verify a real run (`tasks/todo.md`).

Secrets live in `.env` (never commit). See `.env.example`.
# auto-research
