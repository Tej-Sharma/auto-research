# 04 · InsForge

InsForge is our backend of record + realtime transport + secure bridge to Daytona. It's an agent-native, open-source backend: Postgres (auto PostgREST + pgvector + migrations), Auth, Storage, Realtime, Edge Functions, Hosting, and a Model Gateway.

- Docs: https://docs.insforge.dev
- Project id: `53f5746b-2434-4f35-8ea5-74022c4749ec`

## Setup (one time)
```bash
npx @insforge/cli login --user-api-key uak_********           # auth the CLI
npx @insforge/cli link --project-id 53f5746b-2434-4f35-8ea5-74022c4749ec
# linking installs the InsForge agent skills into the project for Claude Code
```
After linking, prefer the InsForge **skills/CLI** for backend work. Useful CLI:
```bash
npx @insforge/cli metadata                 # see tables, buckets, fns, channels, models
npx @insforge/cli docs db typescript       # SDK docs for DB
npx @insforge/cli docs storage rest-api    # REST docs
# (use `npx @insforge/cli docs` to list available doc topics)
```

> When in doubt about exact command/SDK signatures, consult the installed InsForge skill and `npx @insforge/cli docs …` rather than guessing — versions move.

## Database
- Apply schema from `insforge/migrations/0001_init.sql` (tables in `03-data-model.md`). Use the CLI/skill's migration path (or run SQL via the dashboard) — follow what the skill prescribes for migrations + RLS.
- Tables become REST endpoints automatically (PostgREST). The web client uses the SDK.

## JS/TS SDK (frontend `web/`)
```ts
import { createClient } from '@insforge/sdk'
export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,   // project API base
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
})

// read a run's archive
const { data: events } = await insforge
  .from('canvas_events').select('*').eq('run_id', runId).order('seq')

// kick off a run (edge function)
const { data } = await insforge.functions.invoke('start-run', { body: { query, mode } })

// live canvas
const channel = insforge.realtime.channel(`run:${runId}`)
channel.on('insert', (row) => applyCanvasEvent(row)).subscribe()
```
(Exact SDK names per `npx @insforge/cli docs db typescript`; adapt if they differ.)

## Realtime
The orchestrator publishes each `canvas_events` insert to channel `run:{run_id}`. The frontend subscribes for live playback and also bulk-selects history for replay. If InsForge realtime is table-change based, subscribe to inserts on `canvas_events` filtered by `run_id`; if it's channel-publish based, the orchestrator publishes explicitly. Either works — see the realtime doc topic.

## Edge function: `start-run`
Lives in `insforge/functions/start-run/`. Holds the secrets and bridges to Daytona.
```ts
// pseudocode — Deno-style edge function
export default async function (req) {
  const { query, mode = 'market', params } = await req.json()
  const userId = await authUser(req)                       // from InsForge auth

  const run = await db.insert('research_runs', {
    user_id: userId, query, mode,
    status: 'queued', params: withDefaults(params),
  })

  // create the Daytona sandbox + launch the orchestrator (see 05-daytona.md)
  const sandboxId = await launchDaytonaOrchestrator({
    runId: run.id, query, mode, params: run.params,
    env: {                                                 // secrets injected into sandbox
      INSFORGE_URL, INSFORGE_SERVICE_KEY,
      APIFY_TOKEN, ANTHROPIC_API_KEY,
    },
  })

  await db.update('research_runs', run.id, { sandbox_id: sandboxId })
  return Response.json({ runId: run.id })
}
```
Edge-function secrets are set via the CLI/dashboard (`DAYTONA_API_KEY`, `APIFY_TOKEN`, `ANTHROPIC_API_KEY`, `INSFORGE_SERVICE_KEY`). They are **never** exposed to the browser.

## Auth
Email/password + OAuth via InsForge auth. `research_runs.user_id` scopes the archive per user. Add RLS so a user only reads their own runs (and the `canvas_events`/children join through `run_id`).

## Hosting
`web/` can be deployed via InsForge Deployments, or run locally against the project during development.

## Keys
- **anon key** → browser (`VITE_INSFORGE_ANON_KEY`). Read own data, invoke `start-run`.
- **service key** → edge function + orchestrator only. Full write access.
