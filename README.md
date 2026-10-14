# OpenPost

Write once in Markdown. Publish everywhere. Own the infrastructure.

OpenPost is a self-hosted, Cloudflare-native cross-posting engine for technical blogs. Drop a Markdown file in, and OpenPost fans it out to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, and a GitHub Pages repo - with per-platform adapters, canonical URL wiring, automatic retries, and a publish log you actually control.

It runs as a single Cloudflare Worker, so there is no server to babysit, no Docker container to keep alive, and no SaaS middleman holding your credentials. Your drafts, credentials, and publish history live in your own D1 database.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Why

Cross-posting tools either want your platform tokens on their servers, charge per publication, or quietly rot as platform APIs change. OpenPost keeps the credential store in your account, treats every platform as a small adapter you can read in one screen, and exposes the whole thing over MCP so your coding agent can publish a post without you leaving the editor.

## Features

- **One Markdown source of truth** - frontmatter for title, tags, platforms, canonical URL
- **7 platform adapters** - devto, hashnode, wordpress, ghost, medium, substack, github-pages
- **Canonical URL wiring** - first successful publish becomes the canonical URL for the rest
- **Queue-backed publishes** - Cloudflare Queues with retries and per-platform status; failed platforms retry without touching succeeded ones (idempotent)
- **MCP server** - Streamable HTTP, works with Claude Code, Cursor, and any MCP client
- **CLI** - `openpost publish post.md --to devto,hashnode` from your terminal
- **Cover images** - Workers AI (FLUX schnell) generates covers, stored in R2 and served by the worker
- **Dashboard** - TanStack Start web UI for drafts, platform status, and history

## Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/<you>/openpost)

## Quickstart

Requires [Wrangler](https://developers.cloudflare.com/workers/wrangler/) and a Cloudflare account (free tier is fine).

```bash
git clone https://github.com/<you>/openpost.git
cd openpost
npm install

# Provision the bindings referenced in wrangler.toml
wrangler d1 create openpost-db          # paste database_id into wrangler.toml
wrangler kv namespace create KEYS       # paste id into wrangler.toml
wrangler r2 bucket create openpost-media
wrangler queues create openpost-publish

# Apply the schema
wrangler d1 execute openpost-db --file=migrations/init.sql

# Your admin key - guards the API and the MCP endpoint
wrangler secret put ADMIN_KEY

# Point BASE_URL in wrangler.toml at your worker URL, then ship it
wrangler deploy
```

Then connect the CLI:

```bash
npm install -g openpost-cli
openpost login --url https://openpost.<your-subdomain>.workers.dev --key <ADMIN_KEY>
```

Publish your first post:

```bash
openpost publish hello.md --to devto,hashnode
```

## Platform setup

Credentials are stored per-platform in your own D1 database via `openpost setup <platform> '<json>'` (or a path to a JSON file), then verified with `openpost test <platform>`.

| Platform      | Credentials                                                                 | Where to get them |
|---------------|------------------------------------------------------------------------------|-------------------|
| `devto`       | `{"api_key": "..."}`                                                         | dev.to → Settings → Extensions → DEV Community API Keys |
| `hashnode`    | `{"token": "...", "publication_id": "...?"}`                                 | Hashnode → Account Settings → Developer → Personal Access Token. `publication_id` optional - auto-detected from your first publication. |
| `wordpress`   | `{"site_url": "...", "username": "...", "app_password": "..."}`              | WP Admin → Users → Profile → Application Passwords |
| `ghost`       | `{"site_url": "...", "admin_key": "id:secret"}`                              | Ghost Admin → Settings → Integrations → Custom Integration → Admin API Key |
| `medium`      | `{"integration_token": "..."}`                                               | medium.com/me/settings → Security and apps → Integration tokens |
| `substack`    | `{"publication_url": "...", "connect_sid": "..."}`                           | Log in to Substack, copy the `connect.sid` cookie from browser devtools. Creates drafts, not live posts. |
| `github-pages`| `{"token": "...", "repo": "owner/name", "dir": "?", "branch": "?"}`          | GitHub fine-grained PAT with Contents: read/write on your site repo. `dir` defaults to `content/posts`, `branch` to `main`. Writes Markdown + frontmatter straight into your repo - Hugo/Jekyll/Astro pick it up on the next build. |

Example:

```bash
openpost setup devto '{"api_key": "xxxxx"}'
openpost test devto
openpost status          # shows configured vs available platforms
```

## CLI

`openpost` is a thin client over the REST API. Config lives at `~/.openpost/config.json`.

```bash
openpost login --url <worker-url> --key <admin-key>
openpost setup <platform> '<creds-json-or-file>'
openpost test <platform>
openpost draft <file.md> [--to devto,hashnode] [--title "Override"]
openpost publish <file.md> [--to devto,hashnode]
openpost cover <prompt words...> [--prompt "..."]
openpost drafts          # list drafts with status
openpost status          # configured + available platforms
openpost history         # publish log with per-platform URLs and errors
openpost docs <dir>      # render a directory of .md files into a static HTML site
```

Frontmatter is supported - `title`, `tags`, `platforms`, `cover_image` - so `openpost publish post.md` works with no flags:

```markdown
---
title: "Shipping an MCP server on Workers"
tags: [cloudflare, mcp]
platforms: [devto, hashnode, github-pages]
---

Body goes here.
```

## MCP server

OpenPost speaks MCP over Streamable HTTP at `POST /mcp`. Point any MCP client at it with your admin key as a bearer token.

Claude Code:

```bash
claude mcp add --transport http openpost https://openpost.<your-subdomain>.workers.dev/mcp \
  --header "Authorization: Bearer <ADMIN_KEY>"
```

Cursor / other clients (`mcp.json`):

```json
{
  "mcpServers": {
    "openpost": {
      "url": "https://openpost.<your-subdomain>.workers.dev/mcp",
      "headers": { "Authorization": "Bearer <ADMIN_KEY>" }
    }
  }
}
```

Tools exposed:

| Tool | What it does |
|------|--------------|
| `save_draft` | Save Markdown as a draft |
| `list_drafts` / `get_draft` / `delete_draft` | Draft CRUD |
| `publish` | Publish one draft to one platform |
| `cross_publish` | Publish a draft (or inline content) to all its platforms |
| `setup` / `status` / `test_platform` | Manage and verify platform credentials |
| `generate_cover` | FLUX schnell cover image, stored in R2, optionally attached to a draft |
| `list_posts` | Publish history with per-platform status and URLs |
| `check_links` | HEAD-check every URL in a Markdown body |
| `frontmatter` | Generate frontmatter for hugo/jekyll/astro/nextjs/devto/hashnode/ghost |

That means prompts like *"save this as a draft and cross-publish to devto and hashnode"* just work.

## REST API

All endpoints require `Authorization: Bearer <ADMIN_KEY>` (or `?key=` query param).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/api/status` | Configured + available platforms |
| POST | `/api/platforms/:name` | Store credentials for a platform |
| POST | `/api/platforms/:name/test` | Verify stored credentials |
| GET | `/api/drafts` | List drafts |
| POST | `/api/drafts` | Create a draft `{title?, content, platforms[], cover_image?}` |
| GET | `/api/drafts/:id` | Get one draft |
| DELETE | `/api/drafts/:id` | Delete a draft |
| POST | `/api/publish` | `{draftId}` or `{content, platforms[]}` - enqueues platform jobs |
| GET | `/api/history` | Publish log |
| POST | `/api/history/:draftId/:platform/retry` | Requeue failed publishes for one platform |
| POST | `/api/images/generate` | `{prompt, draftId?}` → `{url}` |
| GET | `/api/images/covers/:key` | Serve a generated cover from R2 |
| POST | `/mcp` | MCP JSON-RPC endpoint |

## Architecture

```
                          ┌─────────────────────────────────────────────┐
  openpost-cli ──────────▶│                                             │
  MCP clients ───────────▶│   Cloudflare Worker (Hono)                  │
  (Claude Code, Cursor)   │                                             │
  Dashboard ─────────────▶│   /api/*   REST    /mcp   JSON-RPC          │
                          └──────┬──────────────────┬──────────────────┘
                                 │                  │
                    ┌────────────▼───┐      ┌───────▼────────┐
                    │  D1            │      │  Queue         │
                    │  drafts, creds,│      │  openpost-     │
                    │  publish_log   │      │  publish       │
                    └────────────▲───┘      └───────┬────────┘
                               │                   │ consumer (retry x3)
                               │                   ▼
                               │          ┌────────────────┐
                               │          │ Platform       │──▶ dev.to API
                               │          │ adapters       │──▶ Hashnode GraphQL
                               │          │                │──▶ WP REST
                               │          │                │──▶ Ghost Admin API
                               │          │                │──▶ Medium API
                               │          │                │──▶ Substack drafts
                               │          │                │──▶ GitHub Contents API
                               │          └───────┬────────┘
                               │                  │ canonical URL of first
                               └──────────────────┘ success feeds the rest

        KV: KEYS      R2: MEDIA (cover images)      Workers AI: FLUX schnell
```

The publish flow is deliberately boring: `POST /api/publish` enqueues one message per platform, the queue consumer calls the adapter, and each outcome lands in `publish_log` with the platform URL or the error. The first successful URL becomes the draft's canonical URL, so every downstream platform points back at the original. Re-running a draft is a no-op for platforms that already succeeded - only failures get retried.

## Stack

Hono · Cloudflare Workers · D1 · KV · R2 · Queues · Workers AI · MCP (Streamable HTTP) · marked · Wrangler · TanStack Start (dashboard)

## Development

```bash
npm install
npx wrangler dev        # local worker with bindings
npx tsc --noEmit        # typecheck
```

Adding a platform is one file: implement `PlatformAdapter` (`publish` + `test`) in `src/platforms/`, register it in `src/platforms/index.ts`, and it shows up in the API, CLI, and MCP tools automatically.

## License

MIT. Fork it, ship it, vendor it - see [LICENSE](LICENSE).
