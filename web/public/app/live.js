// live.js — bridges InsForge canvas_events onto the design's event reducer.
// When the page is opened with ?run=<id> and InsForge config is present, the
// canvas is driven by real orchestrator output instead of the baked scenes.
// Transport: poll canvas_events by seq (simple + robust; realtime is an upgrade).
(function () {
  const cfg = window.AR_CONFIG || {};
  const httpOk = typeof cfg.insforgeUrl === 'string' && cfg.insforgeUrl.startsWith('http');
  const enabled = !!(cfg.runId && httpOk);

  // ---- canvas_event → design op mapping ----------------------------------
  const PLATFORM_TO_SOURCE = { web: 'competitor', tiktok: 'tiktok', youtube: 'youtube', reddit: 'reddit', x: 'x', instagram: 'instagram' };
  const EDGE_KIND = { extract: 'extract', flow: 'flow', spawn: 'gap' };
  const GAP_STATUS = { detected: 'detected', investigating: 'investigating', novel: 'novel', addressed: 'addressed', partial: 'addressed' };

  const venueFromMetrics = (m) => {
    if (!m) return '';
    if (m.views) return `${fmt(m.views)} views`;
    if (m.likes) return `${fmt(m.likes)} likes`;
    if (m.upvotes) return `${fmt(m.upvotes)} upvotes`;
    return '';
  };
  const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : '' + n);

  const seenGaps = new Set();
  let lastPaper = null;

  // Returns an array of design-reducer events for one canvas_event.
  function mapEvent(ev) {
    const p = ev.payload || {};
    switch (ev.type) {
      case 'status':
        return [{ op: 'setStatusText', text: p.text }];
      case 'node.add': {
        const d = p.data || {};
        if (p.kind === 'query')
          return [{ op: 'addNode', node: { id: p.id, kind: 'query', x: p.x, y: p.y, data: { text: d.query } } }];
        if (p.kind === 'source')
          return [{ op: 'addNode', node: { id: p.id, kind: 'paper', x: p.x, y: p.y, data: {
            source: PLATFORM_TO_SOURCE[d.platform] || 'competitor',
            authors: d.author, venue: venueFromMetrics(d.metrics), year: '', title: d.title, excerpt: d.excerpt,
          } } }, p.parentId ? { op: 'addEdge', edge: { from: p.parentId, to: p.id, kind: 'flow' } } : null].filter(Boolean);
        if (p.kind === 'paperBar')
          return [{ op: 'addNode', node: { id: p.id, kind: 'paperBar', x: p.x, y: p.y, data: {
            source: PLATFORM_TO_SOURCE[d.platform], authors: d.author || '', title: d.title,
          } } }];
        if (p.kind === 'finding')
          return [{ op: 'addNode', node: { id: p.id, kind: 'finding', x: p.x, y: p.y, data: { title: d.title, excerpt: d.evidence, from: [] } } }];
        if (p.kind === 'analysis')
          return [{ op: 'addNode', node: { id: p.id, kind: 'analysis', x: p.x, y: p.y, data: { tone: d.tone, verdict: d.verdict, body: d.body } } }];
        return [];
      }
      case 'edge.add':
        return [{ op: 'addEdge', edge: { from: p.from, to: p.to, kind: EDGE_KIND[p.kind] || 'flow' } }];
      case 'gap.update': {
        const status = GAP_STATUS[p.status] || 'detected';
        if (!seenGaps.has(p.id)) {
          seenGaps.add(p.id);
          return [{ op: 'pushGap', gap: { id: p.id, title: p.title, why: p.why, status,
            parentId: p.parentGapId || null, iteration: (p.depth || 0) >= 1 ? 2 : 1 } }];
        }
        return [{ op: 'updateGap', id: p.id, status }];
      }
      case 'reader.open':
        lastPaper = { title: p.source?.title, authors: p.source?.author, venue: '', year: '', bubbles: [] };
        return [{ op: 'reader', open: true, paper: lastPaper, phase: 'reading' }];
      case 'reader.bubble':
        return [{ op: 'reader', open: true, paper: { ...(lastPaper || {}), bubbles: p.bubbles || [] }, phase: 'extracting' }];
      case 'reader.close':
        return [{ op: 'reader', open: false }];
      case 'report.ready':
        return [{ op: '__loadReport' }]; // app fetches + shows
      case 'error':
        return [{ op: 'setStatusText', text: 'Error — ' + (p.message || 'run failed') }];
      default:
        return [];
    }
  }

  // ---- REST helpers ------------------------------------------------------
  function authHeaders() {
    // anon key + (optional) user session token stashed by the app shell
    const token = (window.AR_CONFIG && window.AR_CONFIG.sessionToken) || cfg.anonKey;
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }
  async function rest(path) {
    const res = await fetch(`${cfg.insforgeUrl}/api/database/records/${path}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`InsForge ${path} -> ${res.status}`);
    return res.json();
  }
  async function fetchRun() {
    const rows = await rest(`research_runs?id=eq.${cfg.runId}&limit=1`);
    return rows[0];
  }
  async function fetchReport() {
    const rows = await rest(`reports?run_id=eq.${cfg.runId}&limit=1`);
    return rows[0];
  }

  // ---- live driver: poll canvas_events by seq ----------------------------
  // dispatch(ev) applies one design-reducer op; onReport(report, run) shows it.
  async function start(dispatch, onReport) {
    let lastSeq = 0, done = false;
    async function tick() {
      try {
        const rows = await rest(`canvas_events?run_id=eq.${cfg.runId}&seq=gt.${lastSeq}&order=seq.asc&select=*`);
        for (const row of rows) {
          lastSeq = Math.max(lastSeq, row.seq);
          for (const ev of mapEvent(row)) {
            if (ev.op === '__loadReport') {
              const [report, run] = await Promise.all([fetchReport(), fetchRun()]);
              onReport && onReport(report, run);
              done = true;
            } else {
              dispatch(ev);
            }
          }
        }
        const run = await fetchRun();
        if (run && (run.status === 'done' || run.status === 'error')) done = true;
      } catch (e) {
        console.warn('[AR live]', e.message);
      }
      if (!done) setTimeout(tick, 1200);
    }
    tick();
  }

  window.AR_LIVE = { enabled, runId: cfg.runId, start, fetchRun, fetchReport };
})();
