// Entry point. Runs inside a Daytona sandbox (or locally for dev).
// Reads run context + secrets from env, runs the loop, records terminal status.
import { readFileSync } from 'node:fs';
import { loadConfig } from './config.js';
import { Insforge } from './insforge.js';
import { Loop } from './loop.js';

// Minimal .env loader for local dev (no dependency). In the sandbox, env is
// injected by the edge function, so the file simply won't exist.
function loadDotEnv(path: string) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no env file — fine in the sandbox */ }
}

async function main() {
  loadDotEnv(new URL('../.env', import.meta.url).pathname);
  const cfg = loadConfig();
  console.log(`[run] ${cfg.runId} mode=${cfg.mode} model=${cfg.params.model}`);
  const io = new Insforge(cfg);
  try {
    await new Loop(cfg).run();
    console.log('[run] done');
  } catch (e: any) {
    const detail = String(e?.stack || e?.message || e).slice(0, 2000);
    console.error('[run] error', detail);
    try {
      await io.emit('error', { message: String(e?.message || e) });
      await io.setStatus('error', { error_detail: detail });
    } catch { /* best effort */ }
    process.exitCode = 1;
  }
}

main();
