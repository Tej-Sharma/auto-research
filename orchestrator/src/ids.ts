// Deterministic node ids so writes are idempotent and replay is stable.

export function makeIds(runId: string) {
  const counters: Record<string, number> = {};
  const next = (p: string) => {
    counters[p] = (counters[p] ?? 0) + 1;
    return `${runId}:${p}${counters[p]}`;
  };
  return {
    finding: () => next('f'),
    analysis: () => next('a'),
    gap: () => next('g'),
    // sub-gap id derived from its parent (g1 -> g1b, g1c ...)
    subGap: (parentId: string) => {
      const base = parentId.split(':').pop()!;
      counters[`sub:${base}`] = (counters[`sub:${base}`] ?? 0) + 1;
      const suffix = String.fromCharCode('a'.charCodeAt(0) + counters[`sub:${base}`]); // b, c, ...
      return `${runId}:${base}${suffix}`;
    },
  };
}
export type Ids = ReturnType<typeof makeIds>;
