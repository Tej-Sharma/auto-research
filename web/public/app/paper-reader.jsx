// paper-reader.jsx — bottom-left mini-paper that scrolls through text and
// emits "extract" bubbles. The agent advances paper-to-paper.
//
// Controlled via app state {open, paper, phase}. The component owns its
// internal scrolling + bubble animation.

const PaperReader = ({ open, paper, phase }) => {
  // phase: 'reading' | 'extracting' | 'switching' | null
  const scrollRef = React.useRef(null);
  const [bubbles, setBubbles] = React.useState([]); // {id, text, age}
  const [scrollPct, setScrollPct] = React.useState(0);

  // Reset scroll & bubbles when paper changes
  React.useEffect(() => {
    setBubbles([]);
    setScrollPct(0);
  }, [paper?.id]);

  // Auto-scroll the page content while reading
  React.useEffect(() => {
    if (!open || !paper || phase !== 'reading') return;
    let raf, start;
    const step = (ts) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / 2200);
      setScrollPct(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [open, paper?.id, phase]);

  // Emit bubbles during 'extracting'
  React.useEffect(() => {
    if (!open || phase !== 'extracting' || !paper) return;
    const phrases = paper.bubbles || ['contrastive ↑12pt', 'augmentations matter', 'transfer 24 tasks'];
    let i = 0;
    const id = setInterval(() => {
      if (i >= phrases.length) { clearInterval(id); return; }
      const phrase = phrases[i++];
      const bid = Math.random().toString(36).slice(2);
      setBubbles(bs => [...bs, { id: bid, text: phrase, age: 0 }]);
      // GC after animation finishes
      setTimeout(() => setBubbles(bs => bs.filter(b => b.id !== bid)), 2400);
    }, 380);
    return () => clearInterval(id);
  }, [open, paper?.id, phase]);

  if (!open) return null;

  return (
    <div className={`pr-wrap pr-${phase || 'idle'}`}>
      <div className="pr-label">
        <span className="pr-dot" />
        <span>
          {phase === 'extracting' ? t(window.UI.statusExtract) :
           phase === 'switching'  ? t({ en: 'Next paper...', ja: '次の論文へ...' }) :
                                    t({ en: 'Reading paper', ja: '論文を読解中' })}
        </span>
      </div>

      <div className="pr-paper">
        {/* paper header */}
        <div className="pr-paper-head">
          <div className="pr-paper-tag">
            <Icon name="paper" size={12} color="var(--c-ink-2)" /> {t(window.UI.paper)}
          </div>
          <div className="pr-paper-meta">{paper ? `${paper.venue} · ${paper.year}` : ''}</div>
        </div>
        <div className="pr-paper-title">{paper ? paper.title : '—'}</div>
        <div className="pr-paper-authors">{paper ? paper.authors : ''}</div>

        {/* scrolling fake body */}
        <div className="pr-paper-body">
          <div className="pr-paper-body-inner" ref={scrollRef}
               style={{ transform: `translateY(${-(scrollPct * 60)}%)` }}>
            {(paper?.bodyLines || DEFAULT_LINES).map((line, i) => (
              <div key={i} className="pr-line" style={{ width: line.w || '92%' }}/>
            ))}
          </div>
          {/* highlight band */}
          <div className="pr-highlight"/>
          {/* fades */}
          <div className="pr-fade pr-fade-top"/>
          <div className="pr-fade pr-fade-bot"/>
        </div>

        {/* bubbles erupt from highlight band */}
        <div className="pr-bubbles">
          {bubbles.map(b => (
            <div key={b.id} className="pr-bubble">
              <Icon name="sparkle" size={10} color="var(--c-teal-500)"/>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DEFAULT_LINES = Array.from({ length: 30 }, (_, i) => ({
  w: 60 + ((i * 37) % 38) + '%',
}));

window.PaperReader = PaperReader;
