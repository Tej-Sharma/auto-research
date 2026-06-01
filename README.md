# Auto Research

You type a question and Auto Research investigates it for you, live on a canvas. An LLM plans searches, **Apify** scrapes the real web (TikTok / YouTube / web pages), the LLM extracts findings, surfaces **gaps** (open problems / unmet needs), then probes each gap to decide whether someone already solved it — if a gap is only *partially* solved it derives a sharper sub-gap and **iterates** until the gaps converge, then writes a final report. The whole investigation animates itself out node-by-node, with an **Open gaps** panel on the right and cross-run **market-gap tracking**. It runs on four pieces: **web/** (the canvas, a Vite app), **InsForge** (database + realtime + the `start-run` edge function), **Daytona** (a sandbox that runs the orchestration loop), and **Apify + an LLM** (scraping + reasoning). Two modes: *academic* (find the thesis gap) and *market* (find the agent business to build).

> Want to just see it? Jump to **Step 6** — the UI runs in demo mode with no setup.

## Step 1 — Prerequisites

- **Node.js 18+** and npm
- Accounts/keys: **InsForge** (provided), **Apify** token, **Daytona** API key
- The LLM runs through InsForge's built-in AI gateway, so no separate Anthropic key is needed

## Step 2 — Clone & install

```bash
git clone https://github.com/Tej-Sharma/auto-research.git
cd auto-research
(cd web && npm install)
(cd orchestrator && npm install)
```

## Step 3 — Connect InsForge

Log in and link the backend project. Linking also installs the InsForge agent skills and writes `.insforge/project.json` (git-ignored).

```bash
npx @insforge/cli login --user-api-key <YOUR_INSFORGE_USER_API_KEY>
npx @insforge/cli link --project-id 53f5746b-2434-4f35-8ea5-74022c4749ec
npx @insforge/cli ai setup        # writes OPENROUTER_API_KEY to .env.local (the LLM gateway)
```

## Step 4 — Create the database schema

Applies the tables, row-level security, and the realtime channel (already defined in `migrations/`).

```bash
npx @insforge/cli db migrations up --all
npx @insforge/cli metadata        # verify: 9 tables, no errors
```

## Step 5 — Add the secrets

These are injected into the Daytona sandbox by the `start-run` edge function. `INSFORGE_SERVICE_KEY`, `OPENROUTER_API_KEY`, and `LLM_MODEL` are already set during Steps 3; add the two scraping/orchestration keys:

```bash
npx @insforge/cli secrets add APIFY_TOKEN     <YOUR_APIFY_TOKEN>
npx @insforge/cli secrets add DAYTONA_API_KEY <YOUR_DAYTONA_API_KEY>
npx @insforge/cli secrets list                # confirm they're stored
```

## Step 6 — Run the web app (demo mode)

No backend needed — the canvas animates from built-in sample data.

```bash
cd web
npm run dev          # http://localhost:5273
```

Open it, pick a topic, hit **Run**, and watch the canvas build out into the final report.

## Step 7 — Point the web app at your InsForge project (for live runs)

Create `web/.env.local` so the UI can read real runs:

```bash
# web/.env.local
VITE_INSFORGE_URL=https://<your-app>.insforge.app      # oss_host from .insforge/project.json
VITE_INSFORGE_ANON_KEY=<your-anon-key>                 # npx @insforge/cli secrets get ANON_KEY
```

## Step 8 — Deploy the orchestrator path

Deploy the edge function that creates a run and launches the Daytona sandbox:

```bash
npx @insforge/cli functions deploy start-run --file insforge/functions/start-run/index.ts
```

## Step 9 — Run a real research

From the UI (or by invoking `start-run`) start a run; you get back a `runId`. Open the canvas in **live mode** to watch the real orchestration animate:

```
http://localhost:5273/?run=<runId>
```

The orchestrator (in the Daytona sandbox) scrapes via Apify, reasons via the LLM, writes every step to InsForge, and the canvas replays it through the same animation. Results persist — reopen `?run=<runId>` any time.

> Tip: develop the loop faster by running it locally first — copy `orchestrator/.env.example` to `orchestrator/.env`, fill it in, and `cd orchestrator && npm run dev`.

## Project structure

```
auto-research/
├── docs/            full plan + spec (read 00 → 09 in order)
├── web/             the Constella canvas (Vite) + InsForge live bridge
├── orchestrator/    the iterative research loop (runs in Daytona)
├── insforge/        edge function: start-run
├── migrations/      InsForge schema (tables, RLS, realtime)
└── tasks/           todo.md (build status) + lessons.md
```

## Learn more

- **How the loop works:** `docs/02-iteration-algorithm.md`
- **Architecture:** `docs/01-architecture.md`
- **Each integration:** `docs/04-insforge.md`, `05-daytona.md`, `06-apify.md`, `07-anthropic-llm.md`
- **The canvas:** `docs/08-ui-spec.md`
- **Build status / what's left:** `tasks/todo.md`
