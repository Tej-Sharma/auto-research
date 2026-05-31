// timeline.js — converts a scene tree into a sequence of timed canvas events.

const CLUSTER_X = [0, 390, 780];     // 3 cols, 320 wide (with 70 gap)
const SEED_X    = [0, 280, 560, 840]; // 4 papers, 260 wide (20 gap)

const Y = {
  query:        20,
  seed:         150,
  finding:      400,
  ssLabel:      575,
  ssPaper:      [605, 665, 725],
  analysis:     810,
  gap:          960,
  invLabel:     1110,
  invPaper:     [1140, 1200],
  invAnalysis:  1270,
  newGap:       1430,
  inv2Label:    1580,
  inv2Paper:    [1610, 1670],
  finalAnal:    1740,
  bottom:       1880,
};

// Tiny extract phrases for the paper-reader bubble animation, derived from
// the seed paper's excerpt. Each paper renders 3 short phrases.
function bubblesFor(paper) {
  if (paper.bubbles) return paper.bubbles;
  const ex = window.t ? window.t(paper.excerpt) : (typeof paper.excerpt === 'string' ? paper.excerpt : paper.excerpt.en);
  // Pull short, attention-grabbing snippets: numeric facts (e.g. "12.4 pt", "100 FPS"),
  // then fall back to the first few "important" words.
  const numericMatches = ex.match(/[^\s,.;]{0,12}\s?\d+(\.\d+)?\s?(pt|%|FPS|×|x|points|dB|s|ms|fold|K|M|views|likes|followers|comments|replies|days|users)\b[^\s,.;]{0,12}/gi) || [];
  const out = numericMatches.map(s => s.trim()).slice(0, 3);
  if (out.length < 3) {
    // grab notable proper-noun-ish 2-3 word chunks
    const propMatches = ex.match(/\b(?:[A-Z][a-zA-Z0-9-]{2,}(?:\s+[A-Z][a-zA-Z0-9-]+){0,2})\b/g) || [];
    for (const p of propMatches) {
      if (out.length >= 3) break;
      if (p.length > 3 && p.length < 30 && !out.includes(p)) out.push(p);
    }
  }
  if (out.length < 3) {
    // last-resort: words from the title
    const titleWords = (paper.title || '').split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    for (const w of titleWords) if (out.length < 3 && !out.includes(w)) out.push(w);
  }
  return out.slice(0, 3);
}

function buildTimeline(scene) {
  const E = [];
  const push = (at, op, payload = {}) => E.push({ at, op, ...payload });
  let t = 200;

  // Per-scene status + unit key overrides — lets the market scene swap
  // "Searching arXiv..." for "Searching Reddit · X · TikTok..." and
  // "papers" for "sources" without forking the timeline.
  const sk = (key) => (scene.statusKeys && scene.statusKeys[key]) || key;
  const uk = (key) => (scene.unitKeys && scene.unitKeys[key]) || key;

  push(t, 'setStatus', { key: sk('statusBoot') });
  t += 200;
  push(t, 'addNode', { node: { id: 'q', kind: 'query', x: 340, y: Y.query, data: { text: scene.query } } });
  t += 500;

  push(t, 'setStatus', { key: sk('statusSearch') });
  t += 350;

  // Seed papers fan out — paper-reader also opens and scrolls through each
  push(t, 'reader', { open: true, phase: 'reading' });
  scene.seeds.forEach((p, i) => {
    push(t, 'addNode', { node: { id: p.id, kind: 'paper', x: SEED_X[i], y: Y.seed, data: p } });
    push(t + 40, 'addEdge', { edge: { from: 'q', to: p.id, kind: 'flow' } });
    // walk the reader to this paper, read, extract, then move on
    push(t + 60, 'reader', { open: true, paper: { ...p, bubbles: bubblesFor(p) }, phase: 'reading' });
    push(t + 1100, 'reader', { open: true, paper: { ...p, bubbles: bubblesFor(p) }, phase: 'extracting' });
    push(t + 2200, 'reader', { open: true, paper: { ...p, bubbles: bubblesFor(p) }, phase: 'switching' });
    t += 2500;
  });
  push(t, 'reader', { open: false });
  t += 250;

  push(t, 'setStatus', { key: sk('statusExtract') });
  t += 350;

  // Findings appear with extract arrows
  scene.findings.forEach((f, idx) => {
    const cx = CLUSTER_X[idx];
    push(t + idx * 220, 'addNode', { node: { id: f.id, kind: 'finding', x: cx, y: Y.finding, data: f } });
    push(t + idx * 220 + 40, 'highlightExcerpt', { paperId: f.sourcePaper });
    f.from.forEach(srcId => {
      push(t + idx * 220 + 80, 'addEdge', { edge: { from: srcId, to: f.id, kind: 'extract' } });
    });
  });
  t += 220 * scene.findings.length + 350;

  push(t, 'setStatus', { key: sk('statusSubsearch') });
  t += 350;

  // Sub-searches (parallel per finding)
  scene.findings.forEach((f, idx) => {
    const cx = CLUSTER_X[idx];
    const stagger = idx * 100;
    push(t + stagger, 'addNode', {
      node: { id: f.id + '_lbl', kind: 'label', x: cx, y: Y.ssLabel,
              data: { textKey: 'searching', count: f.subSearch.papers.length, unitKey: uk('papersCount') } }
    });
    f.subSearch.papers.forEach((p, i) => {
      push(t + stagger + 250 + i * 250, 'addNode', {
        node: { id: p.id, kind: 'paperBar', x: cx, y: Y.ssPaper[i], data: p }
      });
      push(t + stagger + 250 + i * 250 + 30, 'addEdge', { edge: { from: f.id, to: p.id, kind: 'flow' } });
    });
  });
  t += 1400;

  // Analysis nodes
  push(t, 'setStatus', { key: sk('statusSynth') });
  t += 350;
  scene.findings.forEach((f, idx) => {
    const cx = CLUSTER_X[idx];
    const ta = t + idx * 160;
    push(ta, 'addNode', { node: { id: f.subSearch.analysis.id, kind: 'analysis', x: cx, y: Y.analysis, data: f.subSearch.analysis } });
    f.subSearch.papers.forEach(p => push(ta + 60, 'addEdge', { edge: { from: p.id, to: f.subSearch.analysis.id, kind: 'flow' } }));
  });
  t += 700;

  // Gap nodes + push to right panel
  push(t, 'setStatus', { key: sk('statusGaps') });
  t += 350;
  scene.findings.forEach((f, idx) => {
    const cx = CLUSTER_X[idx];
    const g = f.subSearch.gap;
    const tg = t + idx * 200;
    push(tg, 'addNode', { node: { id: g.id, kind: 'gap', x: cx, y: Y.gap, data: g } });
    push(tg + 30, 'addEdge', { edge: { from: f.subSearch.analysis.id, to: g.id, kind: 'gap' } });
    push(tg + 100, 'pushGap', { gap: { id: g.id, title: g.title, why: g.why, status: 'detected', clusterIdx: idx } });
  });
  t += 1000;

  // Investigation per gap
  push(t, 'setStatus', { key: sk('statusInvest') });
  t += 350;
  scene.findings.forEach((f, idx) => {
    const cx = CLUSTER_X[idx];
    const g = f.subSearch.gap;
    const inv = g.investigation;
    const ti = t + idx * 250;

    push(ti, 'updateGap', { id: g.id, status: 'investigating' });
    push(ti + 50, 'addNode', { node: { id: g.id + '_lbl', kind: 'label', x: cx, y: Y.invLabel,
        data: { textKey: 'investigating', count: inv.papers.length, unitKey: uk('queriesCount') } } });

    inv.papers.forEach((p, i) => {
      push(ti + 280 + i * 220, 'addNode', { node: { id: p.id, kind: 'paperBar', x: cx, y: Y.invPaper[i], data: p } });
      push(ti + 280 + i * 220 + 30, 'addEdge', { edge: { from: g.id, to: p.id, kind: 'flow' } });
    });

    const taOff = 280 + inv.papers.length * 220 + 200;
    push(ti + taOff, 'addNode', { node: { id: inv.analysis.id, kind: 'analysis', x: cx, y: Y.invAnalysis, data: inv.analysis } });
    inv.papers.forEach(p => push(ti + taOff + 60, 'addEdge', { edge: { from: p.id, to: inv.analysis.id, kind: 'flow' } }));

    if (inv.newGap) {
      const ng = inv.newGap;
      const tng = ti + taOff + 700;
      push(tng, 'updateGap', { id: g.id, status: 'addressed', linkAnalysisId: inv.analysis.id });
      push(tng + 50, 'addNode', { node: { id: ng.id, kind: 'gap', x: cx, y: Y.newGap, data: ng } });
      push(tng + 80, 'addEdge', { edge: { from: inv.analysis.id, to: ng.id, kind: 'gap' } });
      push(tng + 150, 'pushGap', { gap: { id: ng.id, title: ng.title, status: 'detected', clusterIdx: idx, parentId: g.id, iteration: 2 } });

      const ti2 = tng + 700;
      push(ti2, 'updateGap', { id: ng.id, status: 'investigating' });
      push(ti2 + 50, 'addNode', { node: { id: ng.id + '_lbl', kind: 'label', x: cx, y: Y.inv2Label,
          data: { textKey: 'investigating', count: ng.investigation.papers.length, unitKey: uk('queriesCount') } } });

      ng.investigation.papers.forEach((p, i) => {
        push(ti2 + 280 + i * 220, 'addNode', { node: { id: p.id, kind: 'paperBar', x: cx, y: Y.inv2Paper[i], data: p } });
        push(ti2 + 280 + i * 220 + 30, 'addEdge', { edge: { from: ng.id, to: p.id, kind: 'flow' } });
      });

      const ta2Off = 280 + ng.investigation.papers.length * 220 + 200;
      push(ti2 + ta2Off, 'addNode', { node: { id: ng.investigation.analysis.id, kind: 'analysis', x: cx, y: Y.finalAnal, data: ng.investigation.analysis } });
      ng.investigation.papers.forEach(p => push(ti2 + ta2Off + 60, 'addEdge', { edge: { from: p.id, to: ng.investigation.analysis.id, kind: 'flow' } }));

      const tone = ng.investigation.analysis.tone;
      push(ti2 + ta2Off + 600, 'updateGap', { id: ng.id, status: tone === 'novel' ? 'novel' : 'addressed', linkAnalysisId: ng.investigation.analysis.id });
    } else {
      const tone = inv.analysis.tone;
      push(ti + taOff + 600, 'updateGap', { id: g.id, status: tone === 'novel' ? 'novel' : 'addressed', linkAnalysisId: inv.analysis.id });
    }
  });

  t += 5500;
  push(t, 'setStatus', { key: sk('statusDone') });
  t += 600;
  push(t, 'showReport');

  return E.sort((a, b) => a.at - b.at);
}

window.buildTimeline = buildTimeline;
window.LAYOUT = { CLUSTER_X, SEED_X, Y };
