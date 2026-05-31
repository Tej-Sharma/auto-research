import { defineConfig } from 'vite';

// The Auto Research canvas runs the Constella design exactly as authored
// (React UMD + Babel-standalone over the component files in public/app), with a
// live bridge (public/app/live.js) that maps InsForge canvas_events onto the
// design's event reducer. Vite serves public/ as-is and injects %VITE_*% env
// into index.html.
export default defineConfig({
  publicDir: 'public',
  server: { port: 5273, open: true },
  build: { outDir: 'dist' },
});
