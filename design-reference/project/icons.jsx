// icons.jsx — minimal SVG icon set lifted from the Constella design system.
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.25 }) => {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    home:  <svg {...c} strokeWidth={1.5}><path d="M12 5.5 L13.7 10 L18.5 12 L13.7 14 L12 18.5 L10.3 14 L5.5 12 L10.3 10 Z" fill={color} stroke="none"/><path d="M19.2 6.8a8 8 0 1 0 1.4 8.8"/></svg>,
    library: <svg {...c}><path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
    connections: <svg {...c}><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><line x1="7.7" y1="7.7" x2="10.3" y2="16.3"/><line x1="16.3" y1="7.7" x2="13.7" y2="16.3"/><line x1="8" y1="6" x2="16" y2="6"/></svg>,
    calendar: <svg {...c}><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>,
    settings: <svg {...c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    search: <svg {...c}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
    sparkle: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2 L13.6 9.4 L21 11 L13.6 12.6 L12 20 L10.4 12.6 L3 11 L10.4 9.4 Z"/></svg>,
    plus: <svg {...c}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    paper: <svg {...c}><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><polyline points="14 3 14 8 19 8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>,
    enter: <svg {...c}><polyline points="9 6 15 12 9 18"/></svg>,
    check: <svg {...c}><polyline points="4 12 10 18 20 6"/></svg>,
    flask: <svg {...c}><path d="M9 3h6"/><path d="M10 3v6.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/></svg>,
    arrowRight: <svg {...c}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>,
    fit: <svg {...c}><polyline points="3 9 3 3 9 3"/><polyline points="21 9 21 3 15 3"/><polyline points="3 15 3 21 9 21"/><polyline points="21 15 21 21 15 21"/></svg>,
    trash: <svg {...c}><path d="M3 4.5h18M5 4.5l.7 14a2 2 0 0 0 2 1.9h8.6a2 2 0 0 0 2-1.9L19 4.5"/><path d="M9 4.5V3.2a1.7 1.7 0 0 1 1.7-1.7h2.6A1.7 1.7 0 0 1 15 3.2v1.3"/></svg>,
    target: <svg {...c}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/></svg>,
    play: <svg {...c}><polygon points="6 4 20 12 6 20 6 4" fill={color} stroke="none"/></svg>,
    refresh: <svg {...c}><polyline points="21 4 21 10 15 10"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L21 10"/><polyline points="3 20 3 14 9 14"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L3 14"/></svg>,
  };
  return map[name] || null;
};

window.Icon = Icon;

// --- Source platform brand marks (used by market-research seeds) -----------
const SOURCE_META = {
  reddit:     { name:'Reddit',     bg:'#FF4500' },
  x:          { name:'X',           bg:'#000000' },
  tiktok:     { name:'TikTok',      bg:'#000000' },
  instagram:  { name:'Instagram',   bg:'linear-gradient(135deg,#f58529 0%,#dd2a7b 50%,#8134af 80%,#515bd4 100%)' },
  youtube:    { name:'YouTube',     bg:'#FF0033' },
  competitor: { name:'Competitor',  bg:'#1A1A1A' },
};

// Tile renders a logo glyph against the brand color. Pass `flat` to draw the
// glyph only (no tile) — used for chips that already have their own bg.
const SourceLogo = ({ source, size = 16, flat = false }) => {
  const s = size;
  const tileR = Math.max(3, Math.round(s * 0.22));
  const Tile = flat ? React.Fragment : (props) => (
    <rect width="24" height="24" rx={Math.round(24 * 0.22)} {...props}/>
  );

  switch (source) {
    case 'reddit':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          {!flat && <rect width="24" height="24" rx={Math.round(24 * 0.22)} fill="#FF4500"/>}
          {/* snoo-ish head */}
          <circle cx="12" cy="13.5" r="6" fill="#fff"/>
          <circle cx="9.6" cy="13" r="1" fill="#FF4500"/>
          <circle cx="14.4" cy="13" r="1" fill="#FF4500"/>
          <path d="M9.4 15.4c.8.8 1.7 1.2 2.6 1.2s1.8-.4 2.6-1.2" stroke="#FF4500" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
          <circle cx="18" cy="8.4" r="1.4" fill="#fff"/>
          <line x1="12" y1="7.4" x2="16.8" y2="8.4" stroke="#fff" strokeWidth="0.9" strokeLinecap="round"/>
          {/* antennae dot on top of head */}
          <circle cx="12" cy="7.4" r="1" fill="#fff"/>
        </svg>
      );
    case 'x':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          {!flat && <rect width="24" height="24" rx={Math.round(24 * 0.22)} fill="#000"/>}
          <path d="M6.5 6 L13 12.4 L18 18 M17.5 6 L11 12 L6 18" stroke="#fff" strokeWidth="1.9" strokeLinecap="round"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          {!flat && <rect width="24" height="24" rx={Math.round(24 * 0.22)} fill="#000"/>}
          {/* cyan offset */}
          <path d="M13.2 6.4 v8.0 a2.4 2.4 0 1 1 -2.4 -2.4 M13.2 6.4 c0 1.6 1.3 2.9 2.9 2.9"
                stroke="#25F4EE" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"
                transform="translate(-0.9,0.6)"/>
          {/* magenta offset */}
          <path d="M13.2 6.4 v8.0 a2.4 2.4 0 1 1 -2.4 -2.4 M13.2 6.4 c0 1.6 1.3 2.9 2.9 2.9"
                stroke="#FE2C55" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"
                transform="translate(0.9,-0.6)"/>
          {/* white center */}
          <path d="M13.2 6.4 v8.0 a2.4 2.4 0 1 1 -2.4 -2.4 M13.2 6.4 c0 1.6 1.3 2.9 2.9 2.9"
                stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'instagram': {
      const gid = 'ig-g-' + source;
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#f9ce34"/>
              <stop offset="35%" stopColor="#ee2a7b"/>
              <stop offset="70%" stopColor="#8134af"/>
              <stop offset="100%" stopColor="#515bd4"/>
            </linearGradient>
          </defs>
          {!flat && <rect width="24" height="24" rx={Math.round(24 * 0.22)} fill={`url(#${gid})`}/>}
          <rect x="5.5" y="5.5" width="13" height="13" rx="4" stroke="#fff" strokeWidth="1.5" fill="none"/>
          <circle cx="12" cy="12" r="3.2" stroke="#fff" strokeWidth="1.5" fill="none"/>
          <circle cx="16.2" cy="7.8" r="0.9" fill="#fff"/>
        </svg>
      );
    }
    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          {!flat && <rect width="24" height="24" rx={Math.round(24 * 0.22)} fill="#fff"/>}
          <rect x="2.5" y="6" width="19" height="12" rx="3" fill="#FF0033"/>
          <path d="M10.5 9.4 L15.4 12 L10.5 14.6 Z" fill="#fff"/>
        </svg>
      );
    case 'competitor':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          {!flat && <rect width="24" height="24" rx={Math.round(24 * 0.22)} fill="#1A1A1A"/>}
          {/* eye glyph — "watching competitors" */}
          <path d="M4.6 12 C7 8.4 9.6 7 12 7 C14.4 7 17 8.4 19.4 12 C17 15.6 14.4 17 12 17 C9.6 17 7 15.6 4.6 12 Z"
                stroke="#fff" strokeWidth="1.3" fill="none"/>
          <circle cx="12" cy="12" r="2.4" fill="#fff"/>
        </svg>
      );
    default:
      return null;
  }
};

window.SOURCE_META = SOURCE_META;
window.SourceLogo = SourceLogo;
