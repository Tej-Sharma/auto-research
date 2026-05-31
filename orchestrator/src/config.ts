// Env + tunables. Tunables come from research_runs.params (JSON) with defaults.
import type { Mode } from './types.js';

function reqEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export interface Params {
  maxRounds: number;
  maxGapDepth: number;
  seedSearches: number;
  subSearches: number;
  gapSearches: number;
  sourcesPerSearch: number;
  concurrency: number;
  model: string;
  budgetUsd: number;
}

export const DEFAULT_PARAMS: Params = {
  maxRounds: 1,
  maxGapDepth: 2,
  seedSearches: 4,
  subSearches: 3,
  gapSearches: 2,
  sourcesPerSearch: 8,
  concurrency: 4,
  model: process.env.LLM_MODEL || 'anthropic/claude-sonnet-4.5',
  budgetUsd: 2.0,
};

export interface RunConfig {
  runId: string;
  query: string;
  mode: Mode;
  params: Params;
  insforgeUrl: string;
  insforgeKey: string;
  openrouterKey: string;
  apifyToken: string;
}

export function loadConfig(): RunConfig {
  const paramOverrides = JSON.parse(process.env.PARAMS || '{}');
  return {
    runId: reqEnv('RUN_ID'),
    query: reqEnv('QUERY'),
    mode: (process.env.MODE as Mode) || 'market',
    params: { ...DEFAULT_PARAMS, ...paramOverrides },
    insforgeUrl: reqEnv('INSFORGE_URL').replace(/\/$/, ''),
    insforgeKey: reqEnv('INSFORGE_SERVICE_KEY'),
    openrouterKey: reqEnv('OPENROUTER_API_KEY'),
    apifyToken: process.env.APIFY_TOKEN || '',
  };
}

/** Run a list of async thunks with a concurrency cap. */
export async function pool<T>(items: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out: T[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await items[idx]();
    }
  });
  await Promise.all(workers);
  return out;
}
