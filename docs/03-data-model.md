# 03 · Data Model (InsForge / Postgres)

All tables live in the InsForge project Postgres. Auto-generated PostgREST endpoints + realtime back the UI. JSONB is used for flexible payloads (metrics, raw scrape, report). Ids are text and human-meaningful where it helps replay (`run:{runId}:f1`).

> Apply via `insforge/migrations/0001_init.sql` (see `04-insforge.md`). Table/column names follow InsForge conventions; adjust to whatever the `insforge` skill recommends for RLS/auth columns.

## `research_runs`
The top-level run.
| col | type | notes |
|-----|------|-------|
| `id` | uuid pk | run id |
| `user_id` | uuid | owner (InsForge auth) |
| `query` | text | the user's question |
| `mode` | text | `academic` \| `market` |
| `status` | text | `queued`→`running`→`done`/`error` |
| `params` | jsonb | tunables (see 02) |
| `stats` | jsonb | `{sourcesRead, gapsSurfaced, novelCount, addressedCount, costUsd}` |
| `error_detail` | text | null unless `status=error` |
| `sandbox_id` | text | Daytona sandbox id (for cleanup/debug) |
| `created_at` / `updated_at` | timestamptz | |

## `searches`
One planned + executed search.
| col | type | notes |
|-----|------|-------|
| `id` | uuid pk | |
| `run_id` | uuid fk | |
| `parent_kind` | text | `seed` \| `finding` \| `gap` |
| `parent_id` | text | finding/gap node id (null for seed) |
| `tool` | text | `web` \| `tiktok` \| `youtube` |
| `query` | text | the actual search string |
| `rationale` | text | why the LLM chose it |
| `status` | text | `pending`→`running`→`done`/`failed` |
| `apify_run_id` | text | Apify run id |
| `created_at` | timestamptz | |

## `sources`
A scraped item.
| col | type | notes |
|-----|------|-------|
| `id` | uuid pk | |
| `run_id` | uuid fk | |
| `search_id` | uuid fk | |
| `platform` | text | `web`/`tiktok`/`youtube`/`reddit`/`x` (platform of the item) |
| `url` | text | |
| `title` | text | |
| `author` | text | handle / authors |
| `metrics` | jsonb | `{views, likes, comments, followers, upvotes}` |
| `excerpt` | text | the quoted snippet shown on the card |
| `raw` | jsonb | full Apify item (for "view later") |
| `created_at` | timestamptz | |

## `findings`
| col | type | notes |
|-----|------|-------|
| `id` | text pk | `run:{id}:f1` |
| `run_id` | uuid fk | |
| `title` | text | |
| `evidence` | text | excerpt the finding hangs on |
| `source_ids` | jsonb | array of `sources.id` it was extracted from |
| `created_at` | timestamptz | |

## `analyses`
Verdict attached to a finding or gap.
| col | type | notes |
|-----|------|-------|
| `id` | text pk | `run:{id}:a1` / `:ia2` |
| `run_id` | uuid fk | |
| `target_kind` | text | `finding` \| `gap` |
| `target_id` | text | |
| `tone` | text | `good`\|`mixed`\|`novel`\|`addressed` |
| `verdict` | text | short label ("Greenfield", "Partial coverage") |
| `body` | text | the paragraph |
| `created_at` | timestamptz | |

## `gaps`
The open-gaps panel + the recursion.
| col | type | notes |
|-----|------|-------|
| `id` | text pk | `run:{id}:g1` / `:g3b` |
| `run_id` | uuid fk | |
| `parent_gap_id` | text | null for top-level; set for derived sub-gaps |
| `finding_id` | text | finding it came from |
| `title` | text | |
| `why` | text | why it's open |
| `status` | text | `detected`→`investigating`→`novel`/`addressed`/`partial` |
| `depth` | int | recursion depth (0 = top level) |
| `saturation` | numeric | 0–1, how covered the space already is |
| `plan` | jsonb | business plan / thesis angle (novel gaps only) |
| `created_at` / `updated_at` | timestamptz | |

## `market_gaps`  ← gap-in-market tracking
Persisted opportunities, tracked across runs (see `09-market-gap-tracking.md`).
| col | type | notes |
|-----|------|-------|
| `id` | uuid pk | |
| `gap_id` | text fk | source gap |
| `run_id` | uuid fk | |
| `label` | text | canonical opportunity name |
| `fingerprint` | text | normalized key for dedupe across runs |
| `status` | text | `novel`/`addressed`/`partial` at time of record |
| `saturation_score` | numeric | 0–1 (higher = more crowded) |
| `opportunity_score` | numeric | 0–1 (demand × winnability ÷ saturation) |
| `evidence_refs` | jsonb | source ids / urls backing the judgment |
| `mode` | text | |
| `tracked_at` | timestamptz | |

## `reports`
| col | type | notes |
|-----|------|-------|
| `id` | uuid pk | |
| `run_id` | uuid fk unique | |
| `summary` | jsonb | bullet list (mode-templated) |
| `novel` | jsonb | array of opportunity/thesis cards (+plan + CTA) |
| `addressed` | jsonb | array of already-solved items |
| `stats` | jsonb | mirror of run.stats for the header |
| `created_at` | timestamptz | |

## `canvas_events`  ← drives the live + replayable canvas
| col | type | notes |
|-----|------|-------|
| `id` | bigint pk | |
| `run_id` | uuid fk | |
| `seq` | int | monotonic per run, replay order |
| `type` | text | `node.add`\|`edge.add`\|`status`\|`gap.update`\|`reader.open`\|`reader.bubble`\|`reader.close`\|`report.ready`\|`error` |
| `payload` | jsonb | event-specific (node coords, gap row, status text, bubble strings) |
| `created_at` | timestamptz | |

Realtime: orchestrator publishes each insert to channel `run:{run_id}`. Frontend subscribes; on (re)open it also `SELECT … ORDER BY seq` to replay history, then live-tails.

## Relationships
```
research_runs 1─┬─* searches ─* sources
                ├─* findings ─* analyses
                ├─* gaps (self-ref via parent_gap_id) ─* analyses
                ├─* market_gaps
                ├─1 reports
                └─* canvas_events
```
