# OpenPub architecture

Write once, publish everywhere. One Markdown file fans out to dev.to, Hashnode,
WordPress, Ghost, Medium, Substack, GitHub Pages, and X Articles.

MIT. Self-hosted. Agent-native. Local-first.

## Layout

```
openpub/
├── apps/
│   ├── cli/             npm: openpub-cli, bin: openpub
│   ├── mcp/             npm: openpub-mcp, stdio MCP server
│   ├── worker/          optional Cloudflare Worker + D1 + R2 + Queues
│   │   ├── src/         REST API, HTTP MCP, queue publishing
│   │   ├── docs/        deployment and HTTP MCP setup
│   │   └── wrangler.toml
│   ├── dashboard/       TanStack Start self-host console
│   └── site/            TanStack Start public React website
├── packages/
│   ├── core/src/        shared publishing engine, no cloud dependencies
│   │   ├── index.ts     Worker-safe exports
│   │   ├── node.ts      Node-only file/config/state helpers
│   │   ├── pipeline.ts  preparePost and publishPost, shared by all runtimes
│   │   ├── publish.ts   file fan-out, canonical wiring, dry-run
│   │   ├── state.ts     local content-hash idempotency ledger
│   │   └── adapters/    one file per platform, `(input, creds) => fetch`
│   └── ui/              reusable site/dashboard presentation components
├── migrations/          Worker D1 schema
├── __tests__/           publishing, adapter, API and security tests
└── test/                real stdio MCP handshake

```

The core is the product. CLI and stdio MCP share Node file/config/state helpers.
Worker uses the same runtime-neutral preparation, adapters and publish dispatch,
while D1 and Queues own persistence, claims and retries. Import `@openpub/core`
for Worker-safe exports and `@openpub/core/node` for Node-only helpers.
Cloudflare remains optional; local CLI and MCP need no server.

One root `npm install` links all npm workspaces. `npm run cli:build` and
`npm run mcp:build` produce standalone bundles retaining public package names.
`npm run dev:site` starts the TanStack React website; `npm run dev:dashboard`
starts the console; `npm run dev:worker` starts the API. Site preserves landing
animations with reduced-motion support. Shared UI belongs in `packages/ui`
only when both surfaces can reuse it. GitHub Pages remains a destination;
the separate GitHub Actions article-publishing feature is not included.

## Core contracts

```ts
type PlatformName =
  | 'devto' | 'hashnode' | 'wordpress' | 'ghost'
  | 'medium' | 'substack' | 'github-pages' | 'x'

interface PlatformAdapter {
  name: PlatformName
  publish(input: PublishInput, creds: Creds): Promise<PublishResult>
  test(creds: Creds): Promise<boolean>
}

interface PublishInput {
  title: string
  markdown: string
  html: string
  tags: string[]
  canonicalUrl?: string
  coverImage?: string
  status: 'draft' | 'published'
}
```

Credentials live in `~/.openpub/config.json`:

```json
{
  "platforms": { "devto": { "api_key": "..." } },
  "defaults": { "platforms": ["devto", "hashnode"], "status": "draft" }
}
```

## Publish semantics

- **Selection**: `--to` beats frontmatter `platforms:` beats `defaults.platforms`
  beats every configured platform.
- **Idempotency**: `~/.openpub/state.json` maps `file::platform` to a hash of
  the title, body, tags, status, slug, cover, and canonical URL, and to the
  remote id. Unchanged content is skipped unless `--force`. dev.to, Ghost,
  WordPress, Hashnode, and GitHub Pages update that remote id. Medium, Substack,
  and X skip the edit and warn, because those APIs cannot update a post.
- **Canonical wiring**: the first successful public URL becomes the canonical
  URL for every later platform, unless frontmatter `canonical_url:` or
  `--canonical` sets a public one explicitly. Draft and editor URLs are ignored.
  Set frontmatter `primary:` to choose which platform publishes first.
- **Status**: `draft` or `published`, resolved as `--status` > frontmatter >
  `defaults.status` > `draft`.
- **Failure isolation**: one platform failing never aborts the others. Every
  outcome is reported per platform.

## Shared content interpretation

`@openpub/core/post` owns browser-safe frontmatter parsing, body extraction, and
metadata precedence. Node publishing, Worker publishing and preview, and the
dashboard editor reuse that interpretation. Frontmatter supports inline and block
lists and LF or CRLF line endings. Saved or explicit title, cover, canonical URL,
and publish action take precedence over file metadata. The Worker still publishes
only through its existing explicit action and keeps its six-tag adapter limit.

The browser imports the `post` subpath directly. Frontmatter generation retains
its existing slug implementation, which imports Node crypto and stays outside the
browser bundle. `@openpub/core/inspection` owns audit scoring and formatter field
mapping; CLI and stdio MCP retain their file I/O and result presentation. Worker
MCP uses the existing frontmatter builder. Link-checking policies remain specific
to their runtime.

The Worker database module owns publish-log retry transitions and draft-status
rollup. This stays separate from the local file ledger and does not introduce a
new persistence adapter or migration.

## Conventions

- TypeScript, ESM, Node 20+. The core needs no build step; esbuild bundles the CLI.
- Dependencies: `marked` only in core and CLI. Nothing else without a reason.
- No em dashes, no en dashes, no double dashes anywhere in prose.
- Comments explain why, never what. No filler comments.
- Tests exercise real behaviour: real git fixtures, real HTTP shapes, real files.
- Every surface must work end to end before it is called done.

## Platform credential shapes

| Platform | Credentials |
|---|---|
| `devto` | `{"api_key": "..."}` |
| `hashnode` | `{"token": "...", "publication_id": "..."}` |
| `wordpress` | `{"site_url": "...", "username": "...", "app_password": "..."}` |
| `ghost` | `{"site_url": "...", "admin_key": "id:secret"}` |
| `medium` | `{"integration_token": "..."}` |
| `substack` | `{"publication_url": "...", "connect_sid": "..."}` |
| `github-pages` | `{"token": "...", "repo": "owner/name", "dir": "content/posts", "branch": "main"}` |
| `x` | `{"access_token": "..."}` (OAuth2 user token, `tweet.write` and `media.write`, X Premium required) |

## Verified

- `help`, `init`, `status`, `setup`, `test`, `audit`, `preview`, `frontmatter`,
  `check-links` all run against real files.
- `publish <file> --to github-pages` wrote a real file into a real repo and
  wired the canonical URL to it.
- Republish is skipped as unchanged; `--force` republishes.
- `npm test`, root TypeScript checks, bundled CLI commands and the real stdio
  handshake validate workspace publishing without posting to live accounts.
