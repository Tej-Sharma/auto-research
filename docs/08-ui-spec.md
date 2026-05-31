# 08 · UI Spec — the Constella Auto Research canvas

A faithful reimplementation of the design (`Auto Research.html` + components). The design is a React-via-Babel prototype with baked scenes; we rebuild it as a **Vite + React** app driven by **live `canvas_events`** from InsForge. Design tokens come straight from `colors_and_type.css`; layout/animation from `app.css`. Copy those two CSS files in nearly verbatim — they are the source of truth for pixels.

## Design tokens (from `colors_and_type.css`)
- Brand teal: `--c-teal-500 #0096A0` (primary), `--c-teal-700 #00807B`, glow `rgba(0,150,160,.10/.20)`.
- Surfaces: bg `--c-bg #EFEEED` (dotted grid), card `#FAFAFA`, glass `rgba(255,255,255,.40–.60)` + `backdrop-filter: blur(18–28px)`.
- Ink: `#000 / #4C4C4C / #A3A3A3`. Semantic: mint `#D3FFEA/#02894A`, yellow `#FFF6D3/#E7850E`, blue `#B5E5FF/#025A89`.
- Fonts: display **Manrope**, UI **Google Sans Flex / DM Sans**, JP **Noto Sans JP**. Radii: card 16, pill 999, chip 8.4. Motion ease `cubic-bezier(.22,1,.36,1)`.

## Layout (fixed regions, from `app.css`)
```
┌──────────────────────────────────────────────────────────────────┐
│ [icon rail]   ◖ Auto Research · status pill ◗      ◖ +credits ◗   │  top chrome
│  (left,        (chrome-tc, glass)                  (chrome-tr)     │
│   chrome-tl)                                                       │
│            ┌───────────────────────────┐   ┌────────────────────┐ │
│            │  CANVAS (.canvas-scroll)  │   │  Open gaps (480px) │ │
│            │  query node → seed cards  │   │  counter · cards   │ │
│            │  → findings → analyses    │   │  detected/investig │ │
│            │  → gaps, animated edges   │   │  /novel/addressed  │ │
│            │                           │   │  (.gaps-panel)     │ │
│  ┌───────┐ │                           │   │                    │ │
│  │paper  │ │                           │   │                    │ │
│  │reader │ │                           │   │                    │ │
│  └───────┘ └───────────────────────────┘   └────────────────────┘ │
│  ◖ status strip: dot + phase text ◗              ◖ Stella Ai ◗     │  bottom chrome
└──────────────────────────────────────────────────────────────────┘
```
Canvas area: `top/left 116px`, `right 520px` (clears the 480px gaps panel), `bottom 100px`. Inner canvas is a `1100px` fixed-width world scaled to fit (`--canvas-scale`). Narrow-viewport media queries shrink the panel (1280 → 340px, 1024 → 264px).

## States
1. **Idle / hero** (`v4-idle.png`): centered glass card — eyebrow "AUTO-RESEARCH", H1 ("What thesis area are you exploring?" / market: "Which AI-agent businesses should we build?"), sub copy, a teal-bordered input with a black **Run ⏎** button, and ≤3 preset chips. Right panel shows "No gaps yet". Bottom-right "Stella Ai" orb.
2. **Running**: hero fades; query node mounts top-center; seed source cards fan out beneath; dashed teal **extract** edges draw from source excerpts up into findings; sub-search **PaperBars** stream in; **Analysis** cards synthesize; **Gap** cards emerge and pop into the right panel. Status strip shows the live phase. Paper-reader widget (bottom-left) animates during scrape phases.
3. **Report** (`v3-report.png`): full-screen blurred overlay, white card slides up — stat header (papers/sources read · gaps · novel), summary bullets, **novel cards** (academic) or **business-idea cards** with the black CTA pill "Implement business plan with agents now →" (market), and an "already addressed" list.

## Components (port from the design's JSX)
- `IconRail` — left vertical glass rail (Constella mark, folder, graph, calendar, settings).
- `StatusPill` / `CreditsPill` / `StellaOrb` — floating chrome.
- `CommandHero` — idle card + input + presets (`.cmd-hero*`).
- `Canvas` — scaled scroll world holding nodes + an SVG `<Edges>` layer.
- Nodes (`nodes.jsx`): `QueryNode`, `SourceCard`/`PaperCard` (+ platform brand chip for reddit/x/tiktok/youtube/competitor), `PaperBar`, `FindingCard`, `AnalysisCard` (tone-colored: good=mint, mixed=yellow, novel=teal), `GapCard`.
- `Edges` (`edges.jsx`) — animated SVG paths with per-edge draw-in; types: extract (dashed teal), flow (solid), spawn (gap→sub-gap).
- `GapsPanel` (`panels.jsx`) — header with target icon + counter; gap items styled by status: `detected` (plain), `investigating` (yellow dashed), `novel` (teal glow), `addressed` (greyed). Sub-gaps show a "spawned a sharper gap" line.
- `Report` (`panels.jsx`) — overlay with `report-novel-card` / `report-biz-card` variants.
- `PaperReader` (`paper-reader.jsx`) — bottom-left widget: mini paper/source card, scrolls content lines, highlight band, erupting fact **bubbles**, slides off, next slides in.
- `TweaksPanel` (`tweaks-panel.jsx`) — dev controls: mode/preset, language EN/日本語 (i18n), playback speed, run/reset. Optional for v1.

## Driving the canvas from live events
Replace baked `scenes.js` + `timeline.js` playback with a reducer over `canvas_events`:
```ts
function applyCanvasEvent(state, ev) {
  switch (ev.type) {
    case 'node.add':    return addNode(state, ev.payload)      // {kind, id, parentId, data, x, y}
    case 'edge.add':    return addEdge(state, ev.payload)      // {from, to, kind}
    case 'status':      return { ...state, phase: ev.payload.text }
    case 'gap.update':  return upsertGap(state, ev.payload)    // gap row → right panel
    case 'reader.open': case 'reader.bubble': case 'reader.close':
                        return reader(state, ev)               // paper-reader widget
    case 'report.ready':return { ...state, report: load(ev.payload.runId) }
  }
}
```
- **Live run**: subscribe to `run:{id}`; apply events as they arrive (keep the design's entry animations — `node-pop`, edge draw-in, bubble rise — they fire on mount).
- **Replay (archive)**: `SELECT canvas_events ORDER BY seq`, then play them back on a timer (respecting the Tweaks playback speed) so reopening a finished run re-animates exactly.
- **Layout**: the orchestrator can emit `x,y`, or the client can run a simple layered layout (query row 0; findings row 1 fanned by index; analyses/gaps below). Keep the `1100px` world + fit-scale.

## i18n
Keep `i18n.js`'s EN/日本語 map and the language toggle. Narration strings (status, verdicts, gap titles, report) are translatable; scraped source titles/authors stay as-is. For live runs the LLM can emit `{en, ja}` for narration, or we translate client-side from the EN field; v1 can ship EN-only and keep the toggle wired to the static strings.

## Build notes
- Vite + React 18, plain CSS (copy `colors_and_type.css` + `app.css`; add the small bits from the JSX inline styles). No Tailwind — the design is hand-tuned CSS.
- Bring over `assets/` (logo) and the Google Fonts links from the HTML `<head>`.
- Keep components 1:1 with the design names so the design chats remain a useful reference.
