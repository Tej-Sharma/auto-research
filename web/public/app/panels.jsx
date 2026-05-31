// panels.jsx — chrome (sidebar, top bar, Stella) + gaps panel + final report.

function useLangPanels() {
  const [, set] = React.useState(0);
  React.useEffect(() => {
    const h = () => set(x => x + 1);
    window.addEventListener('langchange', h);
    return () => window.removeEventListener('langchange', h);
  }, []);
}

// ---- Sidebar (left floating glass column) ----
const Sidebar = ({ active = 'home', onNavigate = () => {} }) => {
  const items = [
    { id: 'home', title:'Home View', icon:'home' },
    { id: 'library', title:'Library', icon:'library' },
    { id: 'connections', title:'Connections', icon:'connections' },
    { id: 'calendar', title:'Calendar', icon:'calendar' },
  ];
  return (
    <div className="chrome chrome-tl">
      <div className="glass" style={{ display:'flex', flexDirection:'column', gap:10, padding:12, borderRadius:36, alignItems:'center' }}>
        {items.map(it => (
          <button key={it.id} title={it.title}
            className={`btn-icon ${active===it.id?'active':''}`}
            onClick={() => onNavigate(it.id)}>
            <Icon name={it.icon} size={24} />
          </button>
        ))}
        <div style={{ width:28, height:1, background:'rgba(0,0,0,0.08)', margin:'4px 0' }}/>
        <button title="Settings" className="btn-icon" onClick={() => onNavigate('settings')}>
          <Icon name="settings" size={24} />
        </button>
      </div>
    </div>
  );
};

// ---- Title pill (top center) ----
const TitlePill = ({ status, running }) => {
  useLangPanels();
  return (
    <div className="chrome chrome-tc">
      <div className="glass" style={{
        display:'flex', alignItems:'center', gap:18,
        padding:'12px 24px', borderRadius:36, minWidth: 460,
      }}>
        <span className={`status-dot ${running?'running':''}`}/>
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ font:'500 19px Manrope', color:'var(--c-ink-1)' }}>{t(window.UI.appTitle)}</span>
          <span style={{ font:'400 14px var(--font-ui)', color:'var(--c-ink-2)', letterSpacing:'-0.1px' }}>{status || t(window.UI.appReady)}</span>
        </div>
      </div>
    </div>
  );
};

// ---- Credits chip (top right) ----
const CreditsChip = ({ count = 9255 }) => (
  <div className="chrome chrome-tr">
    <div className="glass" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:999 }}>
      <Icon name="sparkle" size={18} color="#0096A0" />
      <span style={{ font:'500 18px Manrope', fontVariantNumeric:'tabular-nums' }}>{count.toLocaleString()}</span>
    </div>
  </div>
);

// ---- Stella pill (bottom right, pulses while running) ----
const StellaPill = ({ isActive, label }) => (
  <div className="chrome chrome-br">
    <div style={{
      display:'flex', alignItems:'center', gap:14,
      padding:8, paddingLeft:22,
      background:'#fff',
      border:'1px solid var(--c-divider)',
      borderRadius:999, boxShadow:'0 6px 18px rgba(0,0,0,0.08)',
    }}>
      <span style={{ font:'500 18px Manrope' }}>{label || 'Stella Ai'}</span>
      <div className={isActive?'ai-pulse':''} style={{
        width:48, height:48, borderRadius:999,
        background:'radial-gradient(circle at 35% 30%, #9DECE6 0%, #0096A0 55%, #00464A 100%)',
        boxShadow:'inset 0 0 8px rgba(255,255,255,0.35)',
        position:'relative',
      }}>
        <div style={{ position:'absolute', inset:7, borderRadius:999,
          background:'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.55), transparent 60%)' }}/>
      </div>
    </div>
  </div>
);

// ---- Command bar — hero state with topic chips ----
const CommandBar = ({ value, onSubmit, topics, currentTopicId, onPickTopic }) => {
  useLangPanels();
  return (
    <div className="cmd-hero">
      <div className="cmd-hero-card">
        <div className="cmd-hero-label">
          <Icon name="sparkle" size={18} color="var(--c-teal-500)" />
          <span style={{ font:'500 13px Manrope', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--c-teal-700)' }}>{t(window.UI.research)}</span>
        </div>
        <h1 className="cmd-hero-title">{t(window.UI.heroTitle)}</h1>
        <p className="cmd-hero-sub">{t(window.UI.heroSub)}</p>
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }}>
          <div className="cmd-input-row">
            <Icon name="search" size={20} color="var(--c-ink-icon)" />
            <textarea
              value={t(value)}
              readOnly
              rows={2}
              placeholder={t(window.UI.placeholder)}
              onFocus={e => e.target.select()}
            />
            <button type="submit" className="cmd-go">
              <span>{t(window.UI.run)}</span>
              <span className="kbd">↵</span>
            </button>
          </div>
        </form>
        <div className="cmd-presets">
          <span className="cmd-presets-label">{t(window.UI.tryLabel)}</span>
          {topics.map(tp => (
            <button key={tp.id}
                    className={`cmd-preset ${tp.id===currentTopicId?'cmd-preset-active':''}`}
                    onClick={() => onPickTopic(tp.id)}>{t(tp.label)}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- Status strip ----
const StatusStrip = ({ status, running, elapsedMs }) => {
  useLangPanels();
  return (
    <div className="status-strip">
      <span className={`status-dot ${running?'running':''}`} style={{ width:10, height:10 }}/>
      <span style={{ font:"500 15px 'Google Sans Flex','DM Sans',sans-serif", color:'var(--c-ink-1)' }}>{status || t(window.UI.idle)}</span>
      {elapsedMs != null && (
        <span style={{ font:'400 13px var(--font-ui)', color:'var(--c-ink-2)', marginLeft:'auto', fontVariantNumeric:'tabular-nums' }}>
          {(elapsedMs/1000).toFixed(1)}{t(window.UI.elapsed)}
        </span>
      )}
    </div>
  );
};

// ---- Right-side Gaps Panel ------
const GAP_STATUS_META = {
  detected:      { key:'gapDetected',  fg:'var(--c-ink-2)',     bg:'var(--c-chip)' },
  investigating: { key:'gapInvest',    fg:'var(--c-yellow-fg)', bg:'var(--c-yellow-bg)' },
  addressed:     { key:'gapAddressed', fg:'var(--c-ink-2)',     bg:'var(--c-chip)' },
  novel:         { key:'gapNovel',     fg:'#fff',               bg:'#000' },
};

const GapItem = ({ gap, index }) => {
  useLangPanels();
  const m = GAP_STATUS_META[gap.status] || GAP_STATUS_META.detected;
  return (
    <div className={`gap-item gap-${gap.status}`}>
      <div className="gap-item-head">
        <span className="gap-index">G{String(index+1).padStart(2,'0')}{gap.iteration===2 ? <small>·²</small> : null}</span>
        <span className="gap-pill" style={{ background:m.bg, color:m.fg }}>
          {gap.status === 'investigating' && <span className="mini-spin"/>}
          {gap.status === 'novel' && <Icon name="sparkle" size={14} color="#fff"/>}
          {gap.status === 'addressed' && <Icon name="check" size={14} color="var(--c-ink-2)"/>}
          {t(window.UI[m.key])}
        </span>
      </div>
      <div className="gap-title">{t(gap.title)}</div>
      {gap.parentId && (
        <div className="gap-spawn"><Icon name="arrowRight" size={14} color="var(--c-ink-3)"/> {t(window.UI.spawnedFrom)} G{gap.parentId}</div>
      )}
    </div>
  );
};

const GapsPanel = ({ gaps, running }) => {
  useLangPanels();
  const novelCount = gaps.filter(g => g.status === 'novel').length;
  return (
    <div className="gaps-panel">
      <div className="gaps-panel-head">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="target" size={22} color="var(--c-teal-500)" />
          <span style={{ font:'500 20px Manrope' }}>{t(window.UI.openGaps)}</span>
          {running && <span className="mini-spin"/>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="counter">{gaps.length}</span>
          {novelCount > 0 && (
            <span className="counter" style={{ background:'#000', color:'#fff' }}>{novelCount} {t(window.UI.novelTag)}</span>
          )}
        </div>
      </div>
      <div className="gaps-panel-body">
        {gaps.length === 0 && (
          <div className="gaps-empty">
            <Icon name="search" size={28} color="var(--c-ink-3)" />
            <div style={{ font:'500 17px var(--font-ui)', color:'var(--c-ink-2)' }}>{t(window.UI.noGapsYet)}</div>
            <div style={{ font:'400 14px/1.55 var(--font-ui)', color:'var(--c-ink-3)', maxWidth: 320, textAlign:'center' }}>
              {t(window.UI.noGapsCopy)}
            </div>
          </div>
        )}
        {gaps.map((g, i) => <GapItem key={g.id} gap={g} index={i} />)}
      </div>
    </div>
  );
};

// ---- Final report (slides up at the end) ----
const Report = ({ open, scene, gaps, paperCount, onReset }) => {
  useLangPanels();
  if (!open) return null;
  const novel = gaps.filter(g => g.status === 'novel');
  const addressed = gaps.filter(g => g.status === 'addressed');
  const subSearchCount = scene.findings.reduce((s,f)=>s+f.subSearch.papers.length,0);
  const callOrText = (v, ...args) => (typeof v === 'function' ? v(...args) : v);
  // Per-scene UI key overrides — market scene swaps "papers read" → "sources read",
  // "Novel directions" → "Wedge opportunities", and replaces the bullet copy.
  const rk = (key) => (scene.reportKeys && scene.reportKeys[key]) || key;
  const u = (key) => window.UI[rk(key)] || window.UI[key];
  const reportLine = (key, ...args) => {
    const v = u(key); if (!v) return '';
    const lang = window.lang.get();
    const slot = v[lang] || v.en;
    return callOrText(slot, ...args);
  };

  return (
    <div className="report-overlay">
      <div className="report-card">
        <div className="report-head">
          <div>
            <div style={{ font:'500 13px Manrope', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--c-teal-700)' }}>{t(window.UI.reportTitle)}</div>
            <h2 style={{ font:"600 28px/1.2 Manrope", margin:'8px 0 0', letterSpacing:'-0.01em' }}>{t(scene.query)}</h2>
          </div>
          <div className="report-stats">
            <div><div className="rs-n">{paperCount}</div><div className="rs-l">{t(u('papersRead'))}</div></div>
            <div><div className="rs-n">{gaps.length}</div><div className="rs-l">{t(u('gapsSurfaced'))}</div></div>
            <div><div className="rs-n rs-accent">{novel.length}</div><div className="rs-l">{t(u('novelDirections'))}</div></div>
          </div>
        </div>

        <div className="report-section">
          <div className="report-section-title">{t(window.UI.whatWeDid)}</div>
          <ol className="report-list">
            <li>{reportLine('reportL1', paperCount)}</li>
            <li>{reportLine('reportL2', scene.findings.length)}</li>
            <li>{reportLine('reportL3', subSearchCount)}</li>
            <li>{reportLine('reportL4')}</li>
            <li>{reportLine('reportL5')}</li>
          </ol>
        </div>

        <div className="report-section">
          <div className="report-section-title">{t(u('novelHead'))}</div>
          <div className="report-novel-list">
            {novel.map((g, i) => {
              const plan = scene.plans && scene.plans[g.id];
              const ctaKey = scene.reportKeys && scene.reportKeys.novelCtaLabel;
              // Business-idea variant: name + tagline + wedge + facts + CTA.
              if (plan) {
                return (
                  <div key={g.id} className="report-biz-card">
                    <div className="report-biz-head">
                      <span className="report-biz-num">Idea {String(i+1).padStart(2,'0')}</span>
                      <span className="report-biz-name">{t(plan.name)}</span>
                      <span className="report-biz-flag">
                        <Icon name="sparkle" size={11} color="var(--c-teal-700)"/> {t(window.UI.gapNovel)}
                      </span>
                    </div>
                    <div className="report-biz-tagline">{t(g.title)}</div>
                    {plan.wedge && (
                      <div className="report-biz-wedge">{t(plan.wedge)}</div>
                    )}
                    {plan.facts && plan.facts.length > 0 && (
                      <div className="report-biz-facts">
                        {plan.facts.map((f, idx) => (
                          <span key={idx} className="report-biz-fact">{t(f)}</span>
                        ))}
                      </div>
                    )}
                    {g.iteration === 2 && (
                      <div style={{ font:'400 13px var(--font-ui)', color:'var(--c-ink-3)' }}>
                        {t(window.UI.sharperGap)}
                      </div>
                    )}
                    {ctaKey && (
                      <button className="report-biz-cta" type="button">
                        <Icon name="sparkle" size={14} color="#fff"/>
                        <span>{t(window.UI[ctaKey])}</span>
                        <span className="report-biz-cta-arrow">→</span>
                      </button>
                    )}
                  </div>
                );
              }
              // Fallback (academic scenes)
              return (
                <div key={g.id} className="report-novel-card">
                  <div className="report-novel-num">{String(i+1).padStart(2,'0')}</div>
                  <div>
                    <div style={{ font:"500 17px/1.35 'Google Sans Flex','DM Sans',sans-serif" }}>{t(g.title)}</div>
                    {g.iteration === 2 && (
                      <div style={{ font:'400 13px var(--font-ui)', color:'var(--c-ink-2)', marginTop:5 }}>
                        {t(window.UI.sharperGap)}
                      </div>
                    )}
                  </div>
                  <span className="report-novel-badge">
                    <Icon name="sparkle" size={13} color="#fff" /> {t(window.UI.gapNovel)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {addressed.length > 0 && (
          <div className="report-section">
            <div className="report-section-title">{t(u('alreadyHead'))}</div>
            <ul className="report-addressed">
              {addressed.map(g => (
                <li key={g.id}>
                  <Icon name="check" size={14} color="var(--c-ink-2)" />
                  <span>{t(g.title)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="report-foot">
          <button className="btn-ghost" onClick={onReset}>
            <Icon name="refresh" size={16} color="var(--c-ink-2)" />
            <span style={{ marginLeft: 8 }}>{t(window.UI.runAgain)}</span>
          </button>
          <button className="btn-pill-dark">
            <Icon name="sparkle" size={16} color="#fff" />
            {t(window.UI.openCanvas)}
          </button>
        </div>
      </div>
    </div>
  );
};

window.Sidebar = Sidebar;
window.TitlePill = TitlePill;
window.CreditsChip = CreditsChip;
window.StellaPill = StellaPill;
window.CommandBar = CommandBar;
window.StatusStrip = StatusStrip;
window.GapsPanel = GapsPanel;
window.Report = Report;
