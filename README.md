# OpenPub

**Write once. Publish everywhere.**

One Markdown file fans out to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, GitHub Pages, and X Articles. Per-platform adapters, canonical URL wiring, idempotent republish, and a publish ledger you own.

OpenPub runs locally. Credentials live in `~/.openpub/config.json` on your machine and go nowhere except the platform you are publishing to. No SaaS middleman, no cloud relay, no telemetry, no credit system.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![CI](https://github.com/princepal9120/openpub/actions/workflows/ci.yml/badge.svg)](https://github.com/princepal9120/openpub/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-openpub-blue)](https://openpub-site.pages.dev)

| | |
|---|---|
| **CLI** | Build from this repository, then run `node apps/cli/dist/index.js publish post.md --to devto,substack` |
| **MCP server** | Build from this repository; works with Claude Code, Cursor, and any MCP client |

## Set up with your agent

Give your agent [llms.txt](https://openpub.princepal.dev/llms.txt), the public setup/use guide ([source](apps/site/public/llms.txt)), or open [Docs → Agent Setup](https://openpub.princepal.dev/docs#agent-setup) for a copy button. Local CLI/stdio MCP needs no server; the Worker/dashboard is an optional deployment in your own Cloudflare account.

Copy this prompt; handle authentication and secrets yourself, outside chat:

```text
Help me set up and use OpenPub. Read https://openpub.princepal.dev/llms.txt first, then inspect the current repository and README. Ask which platforms and whether I want local CLI/stdio MCP (default, no server) or my own Cloudflare Worker/dashboard. Build from source, preserve existing files and MCP settings, and let me handle authentication and secrets outside chat. Prepare a Markdown preview and explicit-target dry run locally; report results and stop for my approval before any platform write, publishing, deployment, or paid resource creation. Never infer permission from frontmatter or config defaults. Do not print, read back, or commit credentials.
```

The guide lives in `apps/site/public/llms.txt`; keep `apps/dashboard/public/llms.txt` identical so both independent deployments serve `/llms.txt`. The site regression test checks source and built copies.

`--dry-run` makes no platform writes, but does not verify credentials against live APIs. Even a draft can write to a platform: GitHub Pages commits can trigger a site build. Review content and targets before approving any write. Worker/remote MCP publishing can go live immediately; it does not accept the local CLI's dry-run/status flags.

## Why

| Task | Without OpenPub | With OpenPub |
|---|---|---|
| Publish to dev.to | Open a browser, paste, fix formatting, add tags, submit | `node apps/cli/dist/index.js publish post.md --to devto` |
| Cross-post to five platforms | Repeat the above five times | `node apps/cli/dist/index.js publish post.md` |
| Canonical URLs | Set them by hand on every platform afterwards | Wired from the first public published URL |
| Re-publishing an edit | Find the old post, edit it again, hope you picked the right one | Skipped when unchanged; updated in place when the platform allows it |
| Letting your agent publish | Paste the file into chat, then paste the result back | OpenPub is an MCP server |

## Quick start

```bash
# Build the CLI from the repository root.
npm install
npm run cli:build

# Store credentials for a platform using a private JSON file outside the repo.
node apps/cli/dist/index.js setup devto /absolute/private/path/devto.json

# See what is configured and reachable.
node apps/cli/dist/index.js status

# Prepare an explicit-target dry run. Draft is the default.
node apps/cli/dist/index.js publish post.md --to devto,hashnode --status draft --dry-run
```

That is the whole flow. No account, no signup, no hosted service to trust.

**The default status is `draft`.** A post goes live only when you pass `--status published`, set `status: published` in frontmatter, or set `defaults.status` to `published` in `~/.openpub/config.json`. GitHub Pages commits Markdown to a repository and can trigger a public site build even for draft status. Use `--dry-run` until approved. `--status` and `--to` require a value, and flags may come before the filename (`node apps/cli/dist/index.js publish --dry-run post.md`).

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

- **Substack creates drafts, not live posts.** Substack has no public API, so the adapter uses the same authenticated endpoint the web editor uses. You publish from the Substack dashboard. Editing a draft that OpenPub already created is skipped, with a warning, so a second draft is not created.
- **Medium's publishing API is deprecated.** Medium stopped issuing new integration tokens and marked the API unsupported. The adapter still works for existing tokens and may stop working without warning. Medium cannot edit an existing post, so a later edit is skipped with a warning.
- **X Articles cannot be edited.** The API creates a draft and, when status is `published`, publishes it. A later edit is skipped with a warning instead of creating a second article.
- **Hashnode drafts use `createDraft`.** They are not sent through `publishPost`. Updating a live Hashnode post uses `updatePost`. Hashnode's draft mutations require a Pro publication; if Hashnode rejects the draft, OpenPub returns that error and does not publish the post live. A live Hashnode post cannot be turned back into a draft.
- **dev.to, Ghost, WordPress, and GitHub Pages update the existing post** when OpenPub has stored the remote id (or, for GitHub Pages, the file path).

`github-pages` writes Markdown plus frontmatter straight into your site repo, so Hugo, Jekyll, Astro, or Next.js pick the post up on the next build. That is the personal website destination.

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

## MCP server

Build the server from the repository root:

```bash
npm install
npm run mcp:build
```

Configure any MCP client to run `node /path/to/openpub/apps/mcp/dist/index.js` using its local stdio server settings.

Then ask Claude Code or Cursor: *publish posts/why-i-left-kubernetes.md to dev.to and Substack.*

Tools: `publish`, `cross_publish`, `list_published`, `setup`, `status`, `test_platform`, `content_audit`, `check_links`, `frontmatter`, `x_article`. See [apps/worker/docs/MCP-SETUP.md](apps/worker/docs/MCP-SETUP.md).

## How publishing works

1. **Selection.** `--to` beats the file's `platforms:` frontmatter, which beats your configured defaults, which beats every platform you hold credentials for.
2. **Idempotency.** `~/.openpub/state.json` maps `file::platform` to a hash of the title, body, tags, status, slug, cover, and canonical URL, plus the remote id. Unchanged content is skipped. `--force` overrides. Posts saved before remote ids existed are left in place when the body changes, with a warning, unless you pass `--force`.
3. **Canonical wiring.** The first successful **public** URL becomes the canonical URL for every platform after it. Drafts, X compose links, Substack editor links, and Hashnode draft links are not copied across. Set frontmatter `primary:` to choose which goes first, or `canonical_url:` to pin a public URL yourself.
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
├── apps/
│   ├── cli/             npm: openpub-cli, bin: openpub
│   ├── mcp/             npm: openpub-mcp, stdio MCP server
│   ├── worker/          Cloudflare API, HTTP MCP and queue consumer
│   ├── dashboard/       TanStack Start console
│   └── site/            public website
├── packages/core/       shared adapters, types and publish pipeline
│   └── src/
│       ├── pipeline.ts  runtime-neutral preparation and publishing
│       ├── publish.ts   Node file fan-out and idempotency
│       ├── config.ts    Node credential storage
│       └── adapters/    one implementation per platform
├── migrations/          Worker database schema
└── __tests__/           shared core and Worker tests
```

```
  openpub CLI ──┐
  MCP client ───┼──▶ packages/core ──▶ adapter per platform ──▶ dev.to API
  Worker queue ─┘        │                                    Hashnode GraphQL
                         │                                     WordPress REST
                    ~/.openpub/                                Ghost Admin API
                    config.json  (credentials, 0600)           Medium API
                    state.json   (file::platform -> hash)      Substack drafts
                                                               GitHub Contents API
                                                               X Articles API
```

Adding a platform is one file. Implement `PlatformAdapter` (`publish` and `test`) in `packages/core/src/adapters/`, register it in `packages/core/src/adapters/index.ts`, and it appears in the CLI, MCP server, and Worker with no further wiring. Architecture and contracts: [apps/docs/ARCHITECTURE.md](apps/docs/ARCHITECTURE.md).

## Self-hosting

CLI and stdio MCP need no server. `apps/worker/` plus `apps/dashboard/` provide optional self-host mode: a Cloudflare Worker with D1, KV, R2, Queues, and Workers AI cover images, and a TanStack Start dashboard, for running OpenPub as a shared service.

```bash
npm ci
npx wrangler login
npx wrangler d1 create openpub-db
npx wrangler kv namespace create KEYS
npx wrangler r2 bucket create openpub-media
npx wrangler queues create openpub-publish
# Replace upstream resource IDs and URLs in apps/worker/wrangler.toml with your own first.
npx wrangler d1 execute openpub-db --config apps/worker/wrangler.toml --remote --file=migrations/init.sql
openssl rand -hex 32
npx wrangler secret put ADMIN_KEY --config apps/worker/wrangler.toml
npm run deploy
```

The dashboard Docs page covers the worker REST API and queue-backed retries; [apps/worker/docs/DEPLOY.md](apps/worker/docs/DEPLOY.md) covers deployment.

## Development

```bash
git clone https://github.com/princepal9120/openpub
cd openpub

npm install                    # all workspace dependencies
npm run cli:build              # standalone CLI
npm run mcp:build              # standalone stdio MCP
npm run dev:site               # public TanStack website
npm run dev:dashboard          # self-host console
npm test                       # shared core and Worker tests
npm run typecheck              # types
```

Pull requests are welcome. Open an issue first for anything large. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. Fork it, ship it, vendor it. See [LICENSE](LICENSE).
