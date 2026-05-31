// app.jsx — orchestrates the auto-research canvas.

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "speed": 1,
  "autoScroll": true,
  "topic": "market",
  "language": "en"
}/*EDITMODE-END*/;

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
  const [, forceLang] = React.useState(0);

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
  const idle = phase === 'idle';
  const status = statusKey ? t(window.UI[statusKey]) : null;

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
