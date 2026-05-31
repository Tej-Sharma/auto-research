# 05 · Daytona (orchestration runtime)

Daytona is secure, elastic infrastructure for running code in isolated **sandboxes** that boot in <90ms, have a dedicated kernel/filesystem/network, and outbound internet. Our iterative research loop runs **inside** a sandbox so it can run for minutes and stream progress without tying up a request.

- Docs: https://www.daytona.io/docs/en/
- SDK: `@daytonaio/sdk` (TypeScript). Python SDK is `daytona`.
- Auth: `DAYTONA_API_KEY` (from the Daytona dashboard), or pass `{ apiKey }`.

## SDK essentials
```ts
import { Daytona } from '@daytonaio/sdk'

const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY })

// create an isolated sandbox with our env injected
const sandbox = await daytona.create({
  language: 'typescript',
  envVars: {
    RUN_ID: runId, QUERY: query, MODE: mode, PARAMS: JSON.stringify(params),
    INSFORGE_URL, INSFORGE_SERVICE_KEY, APIFY_TOKEN, ANTHROPIC_API_KEY,
  },
  autoStopInterval: 15,   // minutes idle before auto-stop (safety net)
  ephemeral: true,        // auto-delete when stopped
})

// run a quick command
const r = await sandbox.process.executeCommand('node --version')
console.log(r.result)

// long-running / background work uses a SESSION
await sandbox.process.createSession('orchestrate')
const { cmdId } = await sandbox.process.executeSessionCommand('orchestrate', {
  command: 'node /workspace/orchestrator/run.js',
  runAsync: true,                       // <-- don't block the edge function
})
// stream logs (optional, for debugging)
await sandbox.process.getSessionCommandLogs('orchestrate', cmdId,
  (out) => console.log(out), (err) => console.error(err))

await sandbox.delete()                  // cleanup (orchestrator also self-deletes)
```

## How we launch the orchestrator (`launchDaytonaOrchestrator`)
Called from the `start-run` edge function:
1. `daytona.create({ envVars })` — inject `RUN_ID`, the user query/mode/params, and the secrets.
2. Get the orchestrator code into the sandbox. Two options:
   - **A. Bundle + upload** (preferred for prod): we build `orchestrator/` into a single `run.js` (esbuild) and `sandbox.fs.uploadFile(bundle, '/workspace/run.js')`, then `node /workspace/run.js`.
   - **B. Clone**: `sandbox.process.executeCommand('git clone <repo> && cd orchestrator && npm i')` then run. Simpler but slower and needs repo access.
3. Start it as an **async session command** (`runAsync: true`) so the edge function returns immediately with `{ runId }`.
4. Return `sandbox.id` so the run row can store it.

The sandbox then runs autonomously: it talks to Apify + Anthropic, writes rows + `canvas_events` to InsForge via REST, and on completion sets the run `status=done` and calls a self-delete (or relies on `autoStopInterval` + `ephemeral`).

## Why a session + runAsync (not codeRun)
`codeRun`/`executeCommand` block until the process exits — too long for an edge function. A session with `runAsync: true` returns a `cmdId` immediately; the work continues in the sandbox. We don't need to stream its logs for the product (progress flows through InsForge), but we can for debugging.

## Pre-installing deps
To avoid `npm i` on every run, build a custom snapshot/image once:
```ts
import { Image } from '@daytonaio/sdk'
const image = Image.debianSlim().runCommands('npm i -g esbuild')  // + bake node deps
```
Or upload a pre-bundled `run.js` (no install needed). Prefer the pre-bundle: fastest cold start.

## Resource + safety
- `create({ cpu: 1, memory: 2, disk: 4 })` is plenty for IO-bound orchestration.
- `autoStopInterval` + `ephemeral` guarantee no orphaned sandboxes even if the orchestrator crashes.
- The orchestrator wraps everything in try/finally and always attempts `status=done|error` before exit.

## Network
Sandboxes have outbound internet, so Apify/Anthropic/InsForge REST all work from inside. No inbound port is needed (everything is push-to-InsForge).

## Local dev shortcut
During development the orchestrator can run **locally** (`node orchestrator/run.js` with `.env`) against the real InsForge project — identical behavior, no sandbox. Flip to Daytona once the loop is solid. This keeps the inner-loop fast.
