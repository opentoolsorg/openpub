# OpenPub

**Write once. Publish everywhere.**

One Markdown file fans out to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, GitHub Pages, and X Articles. Per-platform adapters, canonical URL wiring, idempotent republish, and a publish ledger you own.

OpenPub runs locally. Credentials live in `~/.openpub/config.json` on your machine and go nowhere except the platform you are publishing to. No SaaS middleman, no cloud relay, no telemetry, no credit system.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

## Why

| Task | Without OpenPub | With OpenPub |
|---|---|---|
| Publish to dev.to | Open a browser, paste, fix formatting, add tags, submit | `openpub publish post.md --to devto` |
| Cross-post to five platforms | Repeat the above five times | `openpub publish post.md` |
| Canonical URLs | Set them by hand on every platform afterwards | Wired automatically from the first successful publish |
| Re-publishing an edit | Find the old post, edit it again, hope you picked the right one | Skipped when unchanged, updated when it changed |
| Publishing from CI | A bespoke script per platform | `uses: princepal9120/openpub@v1` |
| Letting your agent publish | Paste the file into chat, then paste the result back | OpenPub is an MCP server |

## Quick start

```bash
# Store credentials for a platform. They never leave your machine.
npx openpub-cli setup devto '{"api_key": "dv1_..."}'

# See what is configured and reachable.
npx openpub-cli status

# Publish. Platforms come from --to, or from the file's frontmatter.
npx openpub-cli publish post.md --to devto,hashnode,github-pages
```

Or let an agent do it. Add OpenPub to your MCP client:

```json
{
  "mcpServers": {
    "openpub": { "command": "npx", "args": ["-y", "openpub-mcp"] }
  }
}
```

Then ask Claude Code or Cursor: *publish posts/why-i-left-kubernetes.md to dev.to and Substack.*

## Commands

| Command | What it does |
|---|---|
| `openpub init` | Create `~/.openpub` and show the next step |
| `openpub setup <platform> <json\|file>` | Store and verify credentials |
| `openpub test <platform>` | Check stored credentials against the live API |
| `openpub status` | List configured platforms and their reachability |
| `openpub publish <file.md>` | Fan out to every selected platform |
| `openpub preview <file.md>` | Render to HTML in `~/.openpub/preview/` |
| `openpub frontmatter <file.md> --format <f>` | Emit frontmatter for Hugo, Jekyll, Astro, Next.js, dev.to, Hashnode, or Ghost |
| `openpub audit <file.md>` | Score the post and list what is missing |
| `openpub check-links <file.md>` | Validate every URL in the post |
| `openpub forget <platform>` | Remove stored credentials |

`publish` flags: `--to a,b,c`, `--status draft|published`, `--canonical <url>`, `--dry-run`, `--force`.

## Platforms

| Platform | Credentials | Where to get them |
|---|---|---|
| `devto` | `{"api_key": "..."}` | dev.to, Settings, Extensions, DEV Community API Keys |
| `hashnode` | `{"token": "...", "publication_id": "..."}` | Hashnode, Account Settings, Developer, Personal Access Token |
| `wordpress` | `{"site_url": "...", "username": "...", "app_password": "..."}` | WP Admin, Users, Profile, Application Passwords |
| `ghost` | `{"site_url": "...", "admin_key": "id:secret"}` | Ghost Admin, Settings, Integrations, Custom Integration |
| `medium` | `{"integration_token": "..."}` | medium.com/me/settings, Security and apps, Integration tokens |
| `substack` | `{"publication_url": "...", "connect_sid": "..."}` | Log in, then copy the `connect.sid` cookie from devtools |
| `github-pages` | `{"token": "...", "repo": "owner/name", "dir": "content/posts", "branch": "main"}` | A fine-grained PAT with Contents read and write on your site repo |
| `x` | `{"access_token": "..."}` | X Articles API v2. OAuth2 user token with `tweet.write`. X Premium required |

Two upstream limits worth knowing, documented rather than hidden:

- **Substack creates drafts, not live posts.** Substack has no public API, so the adapter uses the same authenticated endpoint the web editor uses. You publish from the Substack dashboard.
- **Medium's publishing API is deprecated.** Medium stopped issuing new integration tokens and marked the API unsupported. The adapter still works for existing tokens and may stop working without warning.

`github-pages` writes Markdown plus frontmatter straight into your site repo, so Hugo, Jekyll, Astro, or Next.js pick the post up on the next build. That is the personal website destination.

## Three surfaces, one engine

OpenPub is one publishing engine with three ways in.

**CLI** for a terminal, a Makefile, or a cron job.

**MCP server** (`openpub-mcp`) over stdio, for Claude Code, Cursor, and any MCP client. Tools: `publish`, `cross_publish`, `list_published`, `setup`, `status`, `test_platform`, `content_audit`, `check_links`, `frontmatter`, `x_article`.

**GitHub Action** for publishing from a repo:

```yaml
name: Publish
on:
  push:
    branches: [main]
    paths: ["posts/**/*.md"]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: princepal9120/openpub@v1
        with:
          config: ${{ secrets.OPENPUB_CONFIG }}
```

The action publishes only the files the push actually changed, and reports `published-count`.

## How publishing works

1. **Selection.** `--to` beats the file's `platforms:` frontmatter, which beats your configured defaults, which beats every platform you hold credentials for.
2. **Idempotency.** `~/.openpub/state.json` maps `file::platform` to the content hash it last published there. Unchanged content is skipped. `--force` overrides.
3. **Canonical wiring.** The first successful platform's URL becomes the canonical URL for every platform after it. Set frontmatter `primary:` to choose which goes first, or `canonical_url:` to pin it yourself.
4. **Failure isolation.** One platform failing never aborts the others. Every run reports a per-platform outcome.

```markdown
---
title: "Shipping a Cloudflare-native publishing pipeline"
tags: [cloudflare, typescript, publishing]
platforms: [devto, hashnode, github-pages]
primary: github-pages
---

Body goes here. The first heading is used as the title when frontmatter omits one.
```

## What makes it different

Most cross-posting tools stop at dev.to, Hashnode, and Medium. Several still advertise Medium support that has not worked since Medium deprecated its publishing API.

OpenPub ships **X Articles, Substack, Ghost, and git-push in the same binary**, alongside the usual platforms. If you publish long-form to X or run a Substack, this is the tool that covers the whole set.

It is also local-first by default: no account, no credits, no hosted relay. Your keys sit in a `0600` file you can read.

## Architecture

```
openpub/
├── src/core/            the engine (no cloud dependencies)
│   ├── types.ts         PlatformName, PublishInput, Config, PublishReport
│   ├── config.ts        ~/.openpub/config.json (0600) + state.json
│   ├── frontmatter.ts   dependency-free parse and emit, 8 formats
│   ├── state.ts         content-hash idempotency ledger
│   ├── publish.ts       fan-out, canonical wiring, dry-run
│   └── adapters/        one file per platform: (input, creds) => fetch
├── cli/                 npm: openpub-cli, bin: openpub
├── mcp/                 npm: openpub-mcp, stdio MCP server
├── site/                landing page
├── action.yml           composite GitHub Action
├── scripts/publish.sh   action entrypoint: git pathspec to changed files to CLI
└── test/                action tests (real git fixture, fake npx)
```

```
  openpub CLI ──┐
  MCP client ───┼──▶  src/core  ──▶  adapter per platform  ──▶  dev.to API
  GitHub Action ┘        │                                     Hashnode GraphQL
                         │                                     WordPress REST
                    ~/.openpub/                                Ghost Admin API
                    config.json  (credentials, 0600)           Medium API
                    state.json   (file::platform -> hash)      Substack drafts
                                                               GitHub Contents API
                                                               X Articles API
```

Adding a platform is one file. Implement `PlatformAdapter` (`publish` and `test`) in `src/core/adapters/`, register it in `src/core/adapters/index.ts`, and it appears in the CLI, the MCP server, and the action with no further wiring.

## Self-hosting

`src/` outside `src/core`, plus `dashboard/`, are an optional self-host mode: a Cloudflare Worker with D1, KV, R2, Queues, and Workers AI cover images, and a TanStack Start dashboard, for running OpenPub as a shared service. None of the three surfaces above require it.

```bash
wrangler d1 create openpub-db
wrangler kv namespace create KEYS
wrangler r2 bucket create openpub-media
wrangler queues create openpub-publish
wrangler d1 execute openpub-db --file=migrations/init.sql
wrangler secret put ADMIN_KEY
wrangler deploy
```

The worker REST surface, its queue-backed retry classifier, and the dashboard are documented in [docs/DEPLOY.md](docs/DEPLOY.md).

## Development

```bash
git clone https://github.com/princepal9120/openpub
cd openpub

npm --prefix cli install && npm --prefix cli run build   # build the CLI
bash test/publish.test.sh                                # action tests
npm test                                                 # core tests
```

Architecture and contracts: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

MIT. Fork it, ship it, vendor it. See [LICENSE](LICENSE).
