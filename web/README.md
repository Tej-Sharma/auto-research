# web — Auto Research canvas

The Constella **Auto Research** canvas, run exactly as designed (React UMD + Babel-standalone over the component files in `public/app/`), with a live bridge to InsForge.

## Run
```bash
npm install
npm run dev        # http://localhost:5273
npm run build      # -> dist/  (deploy via `npx @insforge/cli deployments deploy .`)
```

## Two modes
- **Demo** (default): the baked Constella scenes animate the whole flow (idle → query → seed cards → findings → analyses → gaps → final report with business CTAs). Pick a topic, hit **Run**. No backend needed.
- **Live**: open with `?run=<runId>`. `public/app/live.js` polls InsForge `canvas_events` for that run and maps them onto the same canvas reducer; the orchestrator's real output drives the canvas, and `LiveReport` renders the `reports` row. Needs `VITE_INSFORGE_URL` + `VITE_INSFORGE_ANON_KEY` (in `.env.local`) and a signed-in user (RLS) — see `tasks/todo.md` Phase 4 for the remaining auth + realtime upgrades.

## Files
- `index.html` — design runtime + `AR_CONFIG` (env-injected) + script order.
- `public/app/*` — the design verbatim (`app.jsx` lightly extended for live mode: `setStatusText` op, live-mode auto-start, `LiveReport` overlay).
- `public/app/live.js` — InsForge canvas_events → design-reducer bridge.

See `../docs/08-ui-spec.md` for the full UI spec.
