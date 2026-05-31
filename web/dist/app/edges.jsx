// edges.jsx — full-screen SVG drawing animated curves between auto-research nodes.

const NODE_HEIGHTS = {
  query: 90, paper: 215, finding: 150, paperBar: 50, label: 22, analysis: 125, gap: 115,
};

function anchor(node, side) {
  const w = (window.NODE_W && window.NODE_W[node.kind]) || 240;
  const h = NODE_HEIGHTS[node.kind] || 80;
  if (side === 'bottom') return { x: node.x + w/2, y: node.y + h };
  if (side === 'top')    return { x: node.x + w/2, y: node.y };
  return { x: node.x + w/2, y: node.y + h/2 };
}

const EDGE_STYLE = {
  flow:    { stroke:'rgba(0,0,0,0.28)',   width: 1,   dash:null,    opacity: 0.85 },
  extract: { stroke:'var(--c-teal-500)',  width: 1.3, dash:'4 5',   opacity: 0.95 },
  gap:     { stroke:'var(--c-teal-700)',  width: 1.3, dash:'2 5',   opacity: 0.85 },
};

const EdgePath = ({ from, to, kind }) => {
  const ref = React.useRef(null);
  const s = EDGE_STYLE[kind] || EDGE_STYLE.flow;
  const A = anchor(from, 'bottom');
  const B = anchor(to, 'top');
  const dy = Math.max(20, B.y - A.y);
  const c1 = { x: A.x, y: A.y + dy*0.45 };
  const c2 = { x: B.x, y: B.y - dy*0.45 };
  const d  = `M ${A.x},${A.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${B.x},${B.y}`;
  const markerEnd = kind === 'extract' ? 'url(#arrow-teal)'
                 : kind === 'gap'     ? 'url(#arrow-deep)'
                                      : 'url(#arrow-grey)';

  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    // For solid flow edges, animate stroke-dashoffset from len to 0 to "draw" them.
    if (!s.dash) {
      const len = el.getTotalLength();
      el.style.transition = 'none';
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      // force layout
      // eslint-disable-next-line no-unused-expressions
      el.getBoundingClientRect();
      el.style.transition = 'stroke-dashoffset 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease';
      el.style.strokeDashoffset = '0';
      el.style.opacity = s.opacity;
    } else {
      // dashed edges: fade in but keep their pattern
      el.style.opacity = 0;
      el.style.transition = 'opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)';
      requestAnimationFrame(() => { el.style.opacity = s.opacity; });
    }
  }, []);

  return (
    <path
      ref={ref}
      d={d}
      stroke={s.stroke}
      strokeWidth={s.width}
      strokeDasharray={s.dash || undefined}
      fill="none"
      opacity={0}
      markerEnd={markerEnd}
    />
  );
};

const EdgeLayer = ({ nodes, edges }) => {
  const idx = React.useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);
  const maxY = nodes.reduce((m, n) => Math.max(m, n.y + (NODE_HEIGHTS[n.kind] || 80)), 200) + 80;

  return (
    <svg
      width="100%" height={maxY}
      style={{ position:'absolute', left:0, top:0, pointerEvents:'none', zIndex:1, overflow:'visible' }}
    >
      <defs>
        <marker id="arrow-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-teal-500)"/>
        </marker>
        <marker id="arrow-grey" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,0,0,0.45)"/>
        </marker>
        <marker id="arrow-deep" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-teal-700)"/>
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = idx[e.from]; const b = idx[e.to];
        if (!a || !b) return null;
        return <EdgePath key={e.from + '→' + e.to + '-' + i} from={a} to={b} kind={e.kind} />;
      })}
    </svg>
  );
};

window.EdgeLayer = EdgeLayer;
window.NODE_HEIGHTS = NODE_HEIGHTS;
