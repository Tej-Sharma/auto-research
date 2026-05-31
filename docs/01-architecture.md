# 01 · Architecture

## Components

```
┌──────────────────────────────────────────────────────────────────────┐
│  web/  (Vite + React, the Constella canvas)                            │
│   • Hero command bar → user types a question, picks a mode/preset      │
│   • Node canvas + animated edges + Open-gaps panel + report overlay    │
│   • @insforge/sdk client:                                              │
│       - INSERT run via edge fn `start-run`                             │
│       - SUBSCRIBE realtime channel `run:{id}`  ──▶ animate canvas      │
│       - SELECT run/findings/gaps/report for the "view later" archive   │
└───────────────┬──────────────────────────────────────────────────────┘
                │ HTTPS (anon key)
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  InsForge  (backend of record + transport + bridge)                    │
│   • Postgres tables (see 03-data-model)                                │
│   • Realtime channels: publishes canvas_events to run:{id}             │
│   • Edge function `start-run`  (holds DAYTONA/APIFY/ANTHROPIC secrets):│
│       1. validate + create research_runs row (status=queued)          │
│       2. create a Daytona sandbox                                      │
│       3. launch orchestrator in the sandbox (async session)           │
│       4. return { runId } immediately                                  │
└───────────────┬──────────────────────────────────────────────────────┘
                │ Daytona SDK (server-side, from the edge fn)
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Daytona sandbox  (runs orchestrator/)                                 │
│   • Long-running iterative loop (minutes), isolated, network-enabled   │
│   • Calls Apify (scrape) + Anthropic (reason)                          │
│   • Writes rows + canvas_events back to InsForge via REST as it goes   │
│   • On finish: writes report, sets run status=done, deletes itself     │
└──────────┬───────────────────────────────────┬───────────────────────┘
           │ Apify REST                          │ Anthropic Messages API
           ▼                                     ▼
   ┌──────────────┐                      ┌──────────────────┐
   │  Apify       │                      │  Anthropic       │
   │  actors      │                      │  claude-opus-4-8 │
   └──────────────┘                      └──────────────────┘
```

## Key decisions

### 1. The orchestrator runs in Daytona, not in the edge function
Edge functions are request-scoped and time-limited. The research loop runs for minutes (many scrapes + LLM calls). So the edge function only *launches* the work: it creates a sandbox and starts the orchestrator as an **async session command** (`runAsync: true`), then returns the `runId`. The sandbox does the long work and reports back to InsForge independently. See `05-daytona.md`.

### 2. The canvas is driven by `canvas_events`, not by polling
The orchestrator emits an ordered stream of `canvas_events` (`node.add`, `edge.add`, `status`, `gap.update`, `reader.*`, `report.ready`) into InsForge. InsForge realtime pushes them to the subscribed web client on channel `run:{id}`. The frontend replays them through the **same timeline/scene machinery** the design already has (`timeline.js`) — except the events are real. This means:
   - Live runs animate as events arrive.
   - Re-opening a finished run **replays** the stored `canvas_events` from `seq=0` (the archive / "view later").

### 3. Secrets never reach the browser
`DAYTONA_API_KEY`, `APIFY_TOKEN`, `ANTHROPIC_API_KEY`, and the InsForge **service** key live only in the edge function env and are injected into the sandbox as env vars at create time. The browser only ever holds the InsForge **anon** key.

### 4. InsForge is the single source of truth
Everything the orchestrator produces is a row. The UI never talks to Apify/Anthropic/Daytona directly. This keeps the client simple, makes runs reproducible/inspectable, and gives us the archive for free.

## Two write paths into InsForge
- **Edge function** (service key): creates the run, launches Daytona.
- **Orchestrator** (service key, from inside the sandbox): all progress writes + `canvas_events`.

Both use the InsForge REST API (PostgREST) + the realtime publish endpoint.

## Request lifecycle (happy path)
1. User clicks **Run** with query `Q`, mode `m`.
2. `web` calls edge fn `start-run({ q, mode })`.
3. Edge fn inserts `research_runs` (status `queued`), creates Daytona sandbox, launches orchestrator with `RUN_ID`, returns `runId`.
4. `web` subscribes to `run:{runId}` and switches the canvas from hero → running.
5. Orchestrator sets status `running`, then streams `canvas_events` as it plans/scrapes/analyzes/iterates.
6. Orchestrator writes the `reports` row, emits `report.ready`, sets status `done`, deletes the sandbox.
7. `web` shows the report overlay. The run is now in the archive and can be replayed any time.

## Failure handling
- Any orchestrator stage wraps in try/catch → writes a `canvas_events` `error` + sets run `status=error` with `error_detail`. The sandbox is always deleted in a `finally`.
- Apify actor failures degrade gracefully (skip that source, note it in the analysis) rather than aborting the run.
- The edge function is idempotent on `runId` so a retried Run doesn't double-launch.
