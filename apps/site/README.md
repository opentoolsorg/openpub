# OpenPub website

TanStack Start + React marketing website, based on the OpenPub landing design. CLI and MCP are the local publishing interfaces. The optional self-hosted dashboard remains a separate app.

From the repository root:

```sh
npm install
npm run dev:site
npm run build --workspace @openpub/site
npm run typecheck --workspace @openpub/site
npm test --workspace @openpub/site # after building, checks prerendered HTML
```

Development runs at `http://localhost:8000`. Production builds prerender `/` and emit a Nitro server plus public assets under `.output/`. Run `node apps/site/.output/server/index.mjs` for production, or serve `.output/public` for a static deployment.

`src/routes/index.tsx` holds product sections, `src/components/Setup.tsx` holds local MCP/CLI setup, and `src/styles/site.css` holds responsive theme tokens and motion. Shared branding and the theme control come from `@openpub/ui`, also used by the dashboard. Logo assets are local; typography uses Google Fonts with system fallbacks.

Setup tabs cycle every six seconds, pause on hover or focus, and stop on manual selection or copying. Arrow keys, Home and End navigate the tablist. A pause control and reduced-motion support disable automatic cycling. Copy failures expose manual-copy instructions. Theme preference uses `op-theme`; unavailable storage never blocks rendering.

Keep sample commands aligned with `apps/cli/index.ts`, the workspace scripts and the MCP docs. Samples build from source; no published npm package is assumed. Platform limitations and sample-only previews must stay explicit.
