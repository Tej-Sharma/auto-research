// nodes.jsx — every node kind that can appear on the auto-research canvas.

const NODE_W = {
  query: 420,
  paper: 260,
  finding: 320,
  paperBar: 320,
  label: 320,
  analysis: 320,
  gap: 320,
};

// Re-render all nodes whenever the language changes.
function useLang() {
  const [, set] = React.useState(0);
  React.useEffect(() => {
    const h = () => set(x => x + 1);
    window.addEventListener('langchange', h);
    return () => window.removeEventListener('langchange', h);
  }, []);
}

// ------------------- Query node (the typed thesis area) --------------------
const QueryNode = ({ data }) => {
  useLang();
  return (
    <div className="node-pop" style={{
      width: NODE_W.query,
      padding: '16px 22px 18px',
      borderRadius: 22,
      background: '#000',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 16px 44px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,150,160,0.4)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, font:'500 13px Manrope', letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.6, marginBottom:7 }}>
        <Icon name="target" size={16} color="#0096A0" /> {t(window.UI.query)}
      </div>
      <div style={{ font:"500 20px/1.3 'Google Sans Flex','DM Sans',sans-serif", letterSpacing:'-0.01em' }}>
        {t(data.text)}
      </div>
    </div>
  );
};

// ------------------- Seed Paper card -------------------------------------
const PaperCard = ({ data, highlightExcerpt }) => {
  useLang();
  if (data.source) return <SourceCard data={data} highlightExcerpt={highlightExcerpt}/>;
  return (
    <div className="node-pop" style={{
      width: NODE_W.paper,
      background:'#fff',
      border:'2px solid var(--c-surface)',
      borderRadius: 18,
      padding: 16,
      boxShadow: 'var(--sh-card)',
      display:'flex', flexDirection:'column', gap:10,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap:5,
          padding:'5px 10px', borderRadius: 7,
          background:'var(--c-chip)', font:'500 12px var(--font-ui)', letterSpacing:'-0.2px'
        }}>
          <Icon name="paper" size={13} color="var(--c-ink-2)"/> {t(window.UI.paper)}
        </span>
        <span style={{ font:'400 12px var(--font-ui)', color:'rgba(0,0,0,0.5)' }}>{data.venue} · {data.year}</span>
      </div>
      <div style={{ font:"500 16px/1.3 'Google Sans Flex','DM Sans',sans-serif", color:'var(--c-ink-1)' }}>
        {data.title}
      </div>
      <div style={{ font:'400 12px var(--font-ui)', color:'var(--c-ink-2)' }}>{data.authors}</div>
      <div style={{
        font:'400 13px/1.5 var(--font-ui)',
        color:'var(--c-ink-2)',
        background: highlightExcerpt ? 'linear-gradient(180deg, rgba(0,150,160,0.10), rgba(0,150,160,0.04))' : 'rgba(0,0,0,0.025)',
        borderLeft: highlightExcerpt ? '3px solid var(--c-teal-500)' : '3px solid var(--c-divider)',
        padding:'8px 10px',
        borderRadius: 7,
        transition:'background 280ms var(--ease-calm), border-color 280ms var(--ease-calm)',
      }}>
        “{t(data.excerpt)}”
      </div>
    </div>
  );
};

// ------------------- Source card (market-research seed) -----------------
const SourceCard = ({ data, highlightExcerpt }) => {
  useLang();
  const meta = window.SOURCE_META[data.source] || window.SOURCE_META.competitor;
  return (
    <div className="node-pop" style={{
      width: NODE_W.paper,
      background:'#fff',
      border:'2px solid var(--c-surface)',
      borderRadius: 18,
      padding: 14,
      boxShadow: 'var(--sh-card)',
      display:'flex', flexDirection:'column', gap:10,
    }}>
      {/* header: brand tile + handle + venue */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{
          width:32, height:32, borderRadius:8,
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, overflow:'hidden',
          background: meta.bg,
          boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.12)',
        }}>
          <SourceLogo source={data.source} size={32} flat/>
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            font:"500 13px 'Google Sans Flex','DM Sans',sans-serif",
            color:'var(--c-ink-1)',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>{data.authors}</div>
          <div style={{
            font:'400 11px var(--font-ui)', color:'var(--c-ink-3)',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>{meta.name} · {data.venue}</div>
        </div>
      </div>
      {/* post title — quoted because these are real-world utterances */}
      <div style={{
        font:"500 14px/1.4 'Google Sans Flex','DM Sans',sans-serif",
        color:'var(--c-ink-1)',
      }}>
        “{data.title}”
      </div>
      {/* excerpt — same highlight system as PaperCard */}
      <div style={{
        font:'400 12px/1.5 var(--font-ui)',
        color:'var(--c-ink-2)',
        background: highlightExcerpt ? 'linear-gradient(180deg, rgba(0,150,160,0.10), rgba(0,150,160,0.04))' : 'rgba(0,0,0,0.025)',
        borderLeft: highlightExcerpt ? '3px solid var(--c-teal-500)' : '3px solid var(--c-divider)',
        padding:'8px 10px',
        borderRadius: 7,
        transition:'background 280ms var(--ease-calm), border-color 280ms var(--ease-calm)',
      }}>
        {t(data.excerpt)}
      </div>
    </div>
  );
};

// ------------------- Compact paper bar (sub-search result) ----------------
const PaperBar = ({ data }) => {
  useLang();
  const missing = data.authors === '—';
  const meta = !missing && data.source && window.SOURCE_META[data.source];
  return (
    <div className="node-pop" style={{
      width: NODE_W.paperBar,
      height: 50,
      background: missing ? 'rgba(0,0,0,0.025)' : '#fff',
      border: missing ? '1px dashed var(--c-divider-soft)' : '1px solid var(--c-divider)',
      borderRadius: 10,
      padding:'0 12px',
      display:'flex', alignItems:'center', gap:10,
      boxShadow: missing ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: 7,
        background: meta ? meta.bg : (missing ? 'rgba(0,0,0,0.05)' : 'var(--c-chip)'),
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        flexShrink:0,
        overflow:'hidden',
        boxShadow: meta ? 'inset 0 0 0 1px rgba(255,255,255,0.12)' : 'none',
      }}>
        {meta
          ? <SourceLogo source={data.source} size={26} flat/>
          : <Icon name={missing?'search':'paper'} size={14} color={missing?'var(--c-ink-3)':'var(--c-ink-2)'} />
        }
      </span>
      <span style={{
        flex:1, minWidth:0,
        font:"500 13px 'Google Sans Flex','DM Sans',sans-serif",
        color: missing ? 'var(--c-ink-3)' : 'var(--c-ink-1)',
        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        fontStyle: missing ? 'italic' : 'normal',
      }}>{t(data.title)}</span>
      <span style={{ font:'400 11px var(--font-ui)', color:'var(--c-ink-3)', whiteSpace:'nowrap' }}>{data.authors}</span>
    </div>
  );
};

// ------------------- Finding card (extracted insight) --------------------
const FindingCard = ({ data }) => {
  useLang();
  return (
    <div className="node-pop" style={{
      width: NODE_W.finding,
      background: '#fff',
      border:'1px solid var(--c-teal-500)',
      borderRadius: 18,
      padding: 16,
      boxShadow: '0 12px 28px rgba(0,150,160,0.10), inset 0 0 0 4px rgba(0,150,160,0.05)',
      display:'flex', flexDirection:'column', gap:10,
    }}>
      <div style={{
        display:'inline-flex', alignItems:'center', gap:7, alignSelf:'flex-start',
        padding:'5px 12px', borderRadius:999,
        background:'var(--c-teal-500)', color:'#fff',
        font:'500 12px Manrope', letterSpacing:'0.08em', textTransform:'uppercase',
      }}>
        <Icon name="sparkle" size={14} color="#fff" /> {t(window.UI.finding)}
      </div>
      <div style={{ font:"500 16px/1.35 'Google Sans Flex','DM Sans',sans-serif", color:'var(--c-ink-1)' }}>
        {t(data.title)}
      </div>
      <div style={{
        font:'400 12px/1.5 var(--font-ui)', color:'var(--c-ink-2)',
        borderTop:'1px dashed rgba(0,150,160,0.25)', paddingTop:8,
        fontStyle:'italic',
      }}>
        {t(window.UI.extractedFrom)} “…{t(data.excerpt)}…”
      </div>
    </div>
  );
};

// ------------------- Inline label (status line in canvas) ----------------
const InlineLabel = ({ data }) => {
  useLang();
  // data is either { text: ... } or { textKey, count, unitKey }
  let text;
  if (data.textKey) {
    text = `${t(window.UI[data.textKey])} · ${data.count} ${t(window.UI[data.unitKey])}`;
  } else {
    text = t(data.text);
  }
  return (
    <div className="node-fade" style={{
      width: NODE_W.label,
      display:'flex', alignItems:'center', gap:8,
      font:'500 13px var(--font-ui)', color:'var(--c-ink-2)',
      letterSpacing:'-0.2px',
    }}>
      <span className="ai-dot" style={{
        width: 8, height: 8, borderRadius: 999,
        background:'var(--c-teal-500)',
        boxShadow:'0 0 0 5px rgba(0,150,160,0.15)',
      }} />
      {text}
    </div>
  );
};

// ------------------- Analysis node ---------------------------------------
const ToneStyles = {
  good:  { bg:'#FFFFFF', edge:'var(--c-mint-fg)',   chipBg:'var(--c-mint-bg)',   chipFg:'var(--c-mint-fg)' },
  mixed: { bg:'#FFFFFF', edge:'var(--c-yellow-fg)', chipBg:'var(--c-yellow-bg)', chipFg:'var(--c-yellow-fg)' },
  novel: { bg:'#FFFFFF', edge:'var(--c-teal-500)',  chipBg:'#000',               chipFg:'#fff' },
};
const AnalysisNode = ({ data }) => {
  useLang();
  const tone = ToneStyles[data.tone] || ToneStyles.good;
  return (
    <div className="node-pop" style={{
      width: NODE_W.analysis,
      background: tone.bg,
      border:'1px solid var(--c-divider)',
      borderLeft:`4px solid ${tone.edge}`,
      borderRadius: 14,
      padding: 14,
      boxShadow: 'var(--sh-card)',
      display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:7,
          font:'500 12px Manrope', letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--c-ink-2)' }}>
          <Icon name="flask" size={14} color="var(--c-ink-2)" /> {t(window.UI.analysis)}
        </div>
        <span style={{
          padding:'4px 10px', borderRadius:999,
          background: tone.chipBg, color: tone.chipFg,
          font:'500 12px Manrope', letterSpacing:'-0.1px', whiteSpace:'nowrap',
        }}>{t(data.verdict)}</span>
      </div>
      <div style={{ font:"400 14px/1.5 'Google Sans Flex','DM Sans',sans-serif", color:'var(--c-ink-1)' }}>
        {t(data.body)}
      </div>
    </div>
  );
};

// ------------------- Gap node --------------------------------------------
const GapNode = ({ data }) => {
  useLang();
  return (
    <div className="node-pop" style={{
      width: NODE_W.gap,
      background:'#FAFAFA',
      border:'1px dashed var(--c-teal-700)',
      borderRadius: 18,
      padding: 14,
      boxShadow:'0 0 0 4px rgba(0,150,160,0.06)',
      display:'flex', flexDirection:'column', gap:8,
      position:'relative',
    }}>
      <div style={{
        position:'absolute', top:-11, left:14,
        padding:'4px 12px', borderRadius:999,
        background:'#000', color:'#fff',
        font:'500 11px Manrope', letterSpacing:'0.1em', textTransform:'uppercase',
      }}>{t(window.UI.gap)}</div>
      <div style={{ font:"500 16px/1.35 'Google Sans Flex','DM Sans',sans-serif", marginTop:8 }}>
        {t(data.title)}
      </div>
      {data.why && (
        <div style={{ font:'400 12px/1.5 var(--font-ui)', color:'var(--c-ink-2)' }}>{t(data.why)}</div>
      )}
    </div>
  );
};

window.QueryNode = QueryNode;
window.PaperCard = PaperCard;
window.SourceCard = SourceCard;
window.PaperBar = PaperBar;
window.FindingCard = FindingCard;
window.InlineLabel = InlineLabel;
window.AnalysisNode = AnalysisNode;
window.GapNode = GapNode;
window.NODE_W = NODE_W;
