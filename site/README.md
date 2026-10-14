# OpenPub landing page

`index.html` is the whole site. One file, inline CSS, system font, no framework, no build step, no CDN, no external fonts.

Serve it from this directory with `python3 -m http.server 8000`, then open `http://localhost:8000`. No build step required.

Section order: nav, hero, eight platform chips, CLI transcript, command grid, CLI/MCP/GitHub Action cards, X Articles/Substack/Ghost/git-push, free and MIT, FAQ, footer.

Copy rules: no em dashes, en dashes, or double dashes in prose (CLI flags in code are the only exception), and no hype words. Facts come from `docs/ARCHITECTURE.md` and `cli/index.ts`, which supersede the older README.

When the CLI changes, update the command grid and the transcript to match.
