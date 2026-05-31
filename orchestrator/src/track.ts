// Market-gap tracking: persist terminal gaps with a cross-run fingerprint and
// an opportunity score (see docs/09-market-gap-tracking.md).
import { createHash } from 'node:crypto';
import type { Insforge } from './insforge.js';
import type { Gap, GapVerdict, Mode } from './types.js';

const STOP = new Set(['the', 'a', 'an', 'for', 'of', 'and', 'to', 'in', 'on', 'with', 'no', 'is', 'are', 'that', 'this', 'agent', 'product']);

function fingerprint(label: string, title: string): string {
  const words = `${label} ${title}`.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w)).sort();
  return createHash('sha1').update(words.join(' ')).digest('hex').slice(0, 16);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export async function trackMarketGap(
  insforge: Insforge, userId: string, mode: Mode, gap: Gap, verdict: GapVerdict,
) {
  const label = (gap.plan as any)?.name || gap.title;
  const saturation = verdict.saturation ?? gap.saturation ?? 0.5;
  const winnability = verdict.winnability ?? (gap.plan as any)?.winnability ?? 0.5;
  const opportunity = clamp01(winnability * (1 - saturation));
  await insforge.addMarketGap({
    gap_id: gap.id, run_id: insforge.runId, user_id: userId,
    label, fingerprint: fingerprint(label, gap.title),
    status: gap.status, saturation_score: saturation,
    opportunity_score: opportunity, evidence_refs: verdict.evidenceRefs ?? [],
    mode,
  });
}
