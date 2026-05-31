# Lessons

Patterns learned while building Auto Research. Append after any correction.

## Design handoff
- The Constella design bundle came from claude.ai/design as a **gzipped tar** behind the `api.anthropic.com/v1/design` URL — WebFetch sees binary; `gunzip | tar x` to read it. README says: read the chat transcripts first (intent lives there), read `Auto Research.html` fully, follow imports, recreate pixel-perfect in whatever tech fits (don't copy prototype structure).
- The prototype is choreographed over baked `scenes.js`; our job is to drive the same canvas from **live data**. Keep component names 1:1 with the design so the chats stay a useful reference.
- `colors_and_type.css` + `app.css` are the pixel source of truth — copy them in rather than re-deriving tokens.

## Architecture
- Orchestration must NOT run in the InsForge edge function (request-scoped/time-limited). Edge fn only *launches* a Daytona sandbox via an **async session command** (`runAsync: true`) and returns `{ runId }`.
- The canvas is driven by an ordered `canvas_events` stream (live via realtime, replay via `ORDER BY seq`). Persist outputs, never re-run LLM calls on replay → finished runs look identical when reopened.
- Secrets only in edge fn + sandbox env; browser holds the InsForge anon key only.

## Service notes
- Daytona TS SDK package is `@daytonaio/sdk`; `new Daytona({apiKey})`, `daytona.create({envVars,...})`, `sandbox.process.{executeCommand,createSession,executeSessionCommand({runAsync}),getSessionCommandLogs}`, `sandbox.delete()`. Sandboxes have outbound internet.
- Apify: one-shot `POST /v2/acts/{owner}~{actor}/run-sync-get-dataset-items?token=…` returns dataset items directly; async = `/runs` then poll `/actor-runs/{id}` then `/datasets/{dsId}/items`. Actors: `clockworks~tiktok-scraper`, `streamers~youtube-scraper`, `apify~website-content-crawler`.
- InsForge: Postgres + auto PostgREST + realtime + auth + edge functions + hosting. CLI installs agent skills on `link`; use `npx @insforge/cli docs <feature> <lang>` for exact SDK signatures instead of guessing.

## Verified (this build)
- InsForge linked project `test` → API base `https://xtv932cy.us-east.insforge.app`. CLI `db migrations new/up`, migrations dir is repo-root `migrations/`. Schema (9 tables + RLS + realtime `run:%` + canvas_events publish trigger) applied live.
- DB REST: `{base}/api/database/records/{table}` — POST array body + `Prefer: return=representation`; PATCH `?id=eq.{id}`; GET PostgREST filters. Auth `Bearer {admin api_key}` (server-side; bypasses RLS).
- LLM = InsForge **AI gateway (OpenRouter)** via the `openai` SDK: `baseURL https://openrouter.ai/api/v1`, `OPENROUTER_API_KEY` (from `npx @insforge/cli ai setup` → `.env.local`). Model slugs `provider/model`; gateway exposes `anthropic/claude-sonnet-4.5` … `anthropic/claude-opus-4.8`. Forced structured output via a single forced `tools`/`tool_choice` function + zod validation + 1 retry — **verified working**.
- `.env*.local`, `.insforge`, `.claude` are git-ignored by InsForge's link step.

## Gotchas (add as encountered)
- zod `.default([])` makes the inferred field non-optional at the call site but TS still widens to `| undefined` across the generic `json<T>()` boundary — keep such fields optional in the hand-written `types.ts` and coalesce (`?? []`).
