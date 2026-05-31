// app.jsx — orchestrates the auto-research canvas.

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "speed": 1,
  "autoScroll": true,
  "topic": "market",
  "language": "en"
}/*EDITMODE-END*/;

// LiveReport — renders the final report row produced by the orchestrator
// (InsForge `reports`). Mirrors the design's report overlay, but data-driven
// from real output: summary bullets, novel cards (with the market CTA), and
// already-addressed items.
const LiveReport = ({ data, gaps, onClose }) => {
  const report = (data && data.report) || {};
  const run = (data && data.run) || {};
  const stats = report.stats || {};
  const summary = report.summary || [];
  const novel = report.novel || [];
  const addressed = report.addressed || [];
  const isMarket = run.mode === 'market';
  return (
    <div className="report-overlay">
      <div className="report-card">
        <div className="report-head">
          <div>
            <div style={{ font:'500 13px Manrope', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--c-teal-700)' }}>Auto-Research · final report</div>
            <h2 style={{ font:'600 28px/1.2 Manrope', margin:'8px 0 0', letterSpacing:'-0.01em' }}>{run.query || ''}</h2>
          </div>
          <div className="report-stats">
            <div><div className="rs-n">{stats.sourcesRead ?? 0}</div><div className="rs-l">{isMarket ? 'sources read' : 'papers read'}</div></div>
            <div><div className="rs-n">{stats.gapsSurfaced ?? gaps.length}</div><div className="rs-l">{isMarket ? 'opportunities' : 'gaps surfaced'}</div></div>
            <div><div className="rs-n rs-accent">{stats.novelCount ?? novel.length}</div><div className="rs-l">{isMarket ? 'agent businesses' : 'novel directions'}</div></div>
          </div>
        </div>

        {summary.length > 0 && (
          <div className="report-section">
            <div className="report-section-title">What we did</div>
            <ol className="report-list">{summary.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
        )}

        <div className="report-section">
          <div className="report-section-title">{isMarket ? 'Agent businesses to build now' : 'Novel directions worth a thesis'}</div>
          <div className="report-novel-list">
            {novel.map((n, i) => (
              <div key={i} className="report-biz-card">
                <div className="report-biz-head">
                  <span className="report-biz-num">{isMarket ? 'Idea' : 'Direction'} {String(i+1).padStart(2,'0')}</span>
                  <span className="report-biz-name">{n.title}</span>
                  <span className="report-biz-flag"><Icon name="sparkle" size={11} color="var(--c-teal-700)"/> Novel</span>
                </div>
                {n.tagline && <div className="report-biz-tagline">{n.tagline}</div>}
                {n.wedge && <div className="report-biz-wedge">{n.wedge}</div>}
                {n.facts && n.facts.length > 0 && (
                  <div className="report-biz-facts">{n.facts.map((f, idx) => <span key={idx} className="report-biz-fact">{f}</span>)}</div>
                )}
                {n.cta && (
                  <button className="report-biz-cta" type="button">
                    <Icon name="sparkle" size={14} color="#fff"/><span>{n.cta}</span><span className="report-biz-cta-arrow">→</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {addressed.length > 0 && (
          <div className="report-section">
            <div className="report-section-title">{isMarket ? 'Already covered by an existing product' : 'Already addressed'}</div>
            <ul className="report-addressed">
              {addressed.map((a, i) => (
                <li key={i}><Icon name="check" size={14} color="var(--c-ink-2)" /><span>{a.title || a}</span></li>
              ))}
            </ul>
          </div>
        )}

        <div className="report-foot">
          <button className="btn-ghost" onClick={onClose}>
            <Icon name="refresh" size={16} color="var(--c-ink-2)" /><span style={{ marginLeft: 8 }}>Close</span>
          </button>
          <button className="btn-pill-dark"><Icon name="sparkle" size={16} color="#fff" />Open canvas</button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [tweaks, setTweak] = useTweaks(DEFAULT_TWEAKS);
  const [phase, setPhase] = React.useState('idle'); // idle | running | done
  const [nodes, setNodes] = React.useState([]);
  const [edges, setEdges] = React.useState([]);
  const [gaps, setGaps] = React.useState([]);
  const [statusKey, setStatusKey] = React.useState(null);
  const [highlightExcerpt, setHighlightExcerpt] = React.useState({});
  const [reportOpen, setReportOpen] = React.useState(false);
  const [activeNav, setActiveNav] = React.useState('home');
  const [elapsedMs, setElapsedMs] = React.useState(null);
  const [reader, setReader] = React.useState({ open: false, paper: null, phase: null });
  const [liveStatus, setLiveStatus] = React.useState(null);   // freeform status text (live mode)
  const [liveReport, setLiveReport] = React.useState(null);   // { report, run } from InsForge
  const [, forceLang] = React.useState(0);
  const live = (typeof window !== 'undefined' && window.AR_LIVE && window.AR_LIVE.enabled) ? window.AR_LIVE : null;

  const scrollRef = React.useRef(null);
  const fitRef = React.useRef(null);
  const timersRef = React.useRef([]);
  const startedAtRef = React.useRef(0);
  const elapsedTickRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  // Sync i18n with tweak; re-render the chrome on lang change.
  React.useEffect(() => {
    window.lang.set(tweaks.language);
  }, [tweaks.language]);
  React.useEffect(() => {
    const h = () => forceLang(x => x + 1);
    window.addEventListener('langchange', h);
    return () => window.removeEventListener('langchange', h);
  }, []);

  // Fit-to-width: scale canvas-fit down so the 1100px design fits.
  React.useEffect(() => {
    const compute = () => {
      const el = scrollRef.current; if (!el) return;
      const avail = el.clientWidth;
      const s = Math.min(1, Math.max(0.32, (avail - 8) / 1100));
      setScale(s);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const scene = React.useMemo(() => window.SCENES[tweaks.topic] || window.SCENES.gsplat, [tweaks.topic]);

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    if (elapsedTickRef.current) { clearInterval(elapsedTickRef.current); elapsedTickRef.current = null; }
  };

  const reset = () => {
    clearTimers();
    setNodes([]); setEdges([]); setGaps([]); setStatusKey(null);
    setHighlightExcerpt({}); setReportOpen(false);
    setReader({ open:false, paper:null, phase:null });
    setElapsedMs(null);
    setPhase('idle');
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const ensureVisible = (newY) => {
    if (!tweaks.autoScroll) return;
    const el = scrollRef.current; if (!el) return;
    const target = Math.max(0, newY * scale - el.clientHeight * 0.55);
    if (target > el.scrollTop + 12) {
      el.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  const runEvent = (ev) => {
    switch (ev.op) {
      case 'setStatus':
        setStatusKey(ev.key);
        break;
      case 'setStatusText':
        setLiveStatus(ev.text);
        break;
      case 'addNode':
        setNodes(ns => [...ns, ev.node]);
        ensureVisible(ev.node.y + 200);
        break;
      case 'addEdge':
        setEdges(es => [...es, ev.edge]);
        break;
      case 'highlightExcerpt':
        setHighlightExcerpt(h => ({ ...h, [ev.paperId]: true }));
        break;
      case 'pushGap':
        setGaps(gs => [...gs, ev.gap]);
        break;
      case 'updateGap':
        setGaps(gs => gs.map(g => g.id === ev.id ? { ...g, status: ev.status, linkAnalysisId: ev.linkAnalysisId || g.linkAnalysisId } : g));
        break;
      case 'reader':
        setReader({ open: ev.open !== false, paper: ev.paper || null, phase: ev.phase || null });
        break;
      case 'showReport':
        setStatusKey('statusDone');
        setReportOpen(true);
        setPhase('done');
        if (elapsedTickRef.current) { clearInterval(elapsedTickRef.current); elapsedTickRef.current = null; }
        break;
      default:
        console.warn('unknown op', ev.op);
    }
  };

  const run = () => {
    reset();
    setPhase('running');
    setStatusKey('statusBoot');
    startedAtRef.current = performance.now();
    elapsedTickRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 80);

    const tl = window.buildTimeline(scene);
    const speed = Math.max(0.25, Math.min(4, tweaks.speed || 1));
    tl.forEach(ev => {
      const id = setTimeout(() => runEvent(ev), ev.at / speed);
      timersRef.current.push(id);
    });
  };

  React.useEffect(() => () => clearTimers(), []);

  // Live mode: when opened with ?run=<id>, drive the canvas from InsForge
  // canvas_events instead of the baked timeline.
  const liveStartedRef = React.useRef(false);
  React.useEffect(() => {
    if (!live || liveStartedRef.current) return;
    liveStartedRef.current = true;
    setPhase('running');
    setStatusKey('statusBoot');
    startedAtRef.current = performance.now();
    elapsedTickRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 80);
    live.start(runEvent, (report, run) => {
      setLiveReport({ report, run });
      setStatusKey('statusDone');
      setPhase('done');
      if (elapsedTickRef.current) { clearInterval(elapsedTickRef.current); elapsedTickRef.current = null; }
    });
  }, []);

  const renderNode = (n) => {
    switch (n.kind) {
      case 'query':    return <QueryNode data={n.data} />;
      case 'paper':    return <PaperCard data={n.data} highlightExcerpt={!!highlightExcerpt[n.id]} />;
      case 'paperBar': return <PaperBar data={n.data} />;
      case 'finding':  return <FindingCard data={n.data} />;
      case 'label':    return <InlineLabel data={n.data} />;
      case 'analysis': return <AnalysisNode data={n.data} />;
      case 'gap':      return <GapNode data={n.data} />;
      default: return null;
    }
  };

  const running = phase === 'running';
  const idle = phase === 'idle' && !live;
  const status = liveStatus || (statusKey ? t(window.UI[statusKey]) : null);

  const paperCount = React.useMemo(() => {
    const cs = scene.findings;
    const seed = scene.seeds.length;
    let sub = 0; let inv = 0;
    cs.forEach(f => {
      sub += f.subSearch.papers.filter(p => p.authors !== '—').length;
      const ip = f.subSearch.gap.investigation.papers;
      inv += ip.filter(p => p.authors !== '—').length;
      const ng = f.subSearch.gap.investigation.newGap;
      if (ng) inv += ng.investigation.papers.filter(p => p.authors !== '—').length;
    });
    return seed + sub + inv;
  }, [scene]);

  const topics = window.SCENE_ORDER.map(id => ({ id, label: window.SCENES[id].label }));

  return (
    <div className="app-root">
      <div className="canvas-scroll" ref={scrollRef} style={{ '--canvas-scale': scale }}>
        <div style={{ height: 1880 * scale + 100, position: 'relative' }}>
          <div className="canvas-fit" ref={fitRef}>
            <div className="canvas-inner">
              <EdgeLayer nodes={nodes} edges={edges} />
              {nodes.map(n => (
                <div key={n.id} style={{ position:'absolute', left:n.x, top:n.y, zIndex:2 }}>
                  {renderNode(n)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Sidebar active={activeNav} onNavigate={setActiveNav} />
      <TitlePill status={status} running={running} />
      <CreditsChip count={9255} />
      <StellaPill isActive={running} label={running ? 'Stella · working' : 'Stella Ai'} />

      <GapsPanel gaps={gaps} running={running} />

      {idle && (
        <CommandBar
          value={scene.query}
          onSubmit={run}
          topics={topics}
          currentTopicId={tweaks.topic}
          onPickTopic={(id) => setTweak('topic', id)}
        />
      )}

      {!idle && (
        <StatusStrip status={status} running={running} elapsedMs={elapsedMs} />
      )}

      <PaperReader open={reader.open} paper={reader.paper} phase={reader.phase} />

      <Report
        open={reportOpen}
        scene={scene}
        gaps={gaps}
        paperCount={paperCount}
        onReset={() => { setReportOpen(false); reset(); }}
      />

      {liveReport && (
        <LiveReport data={liveReport} gaps={gaps} onClose={() => setLiveReport(null)} />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Research">
          <TweakSelect
            label="Topic"
            value={tweaks.topic}
            onChange={v => { setTweak('topic', v); if (!idle) reset(); }}
            options={window.SCENE_ORDER.map(id => ({
              value: id,
              label: t(window.SCENES[id].label),
            }))}
          />
          <TweakRadio
            label="Language"
            value={tweaks.language}
            onChange={v => setTweak('language', v)}
            options={[{value:'en', label:'EN'},{value:'ja', label:'日本語'}]}
          />
        </TweakSection>
        <TweakSection label="Playback">
          <TweakRadio
            label="Speed"
            value={String(tweaks.speed)}
            onChange={v => setTweak('speed', parseFloat(v))}
            options={[{value:'0.5', label:'0.5×'},{value:'1', label:'1×'},{value:'2', label:'2×'}]}
          />
          <TweakToggle
            label="Auto-scroll"
            value={tweaks.autoScroll}
            onChange={v => setTweak('autoScroll', v)}
          />
        </TweakSection>
        <TweakSection label="Run">
          <TweakButton onClick={run}
            label={running ? 'Running...' : (phase === 'done' ? 'Run again' : 'Run research')} />
          <TweakButton onClick={reset} label="Reset" secondary />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

window.App = App;
