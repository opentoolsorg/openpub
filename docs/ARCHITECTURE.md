# OpenPub architecture

Write once, publish everywhere. One Markdown file fans out to dev.to, Hashnode,
WordPress, Ghost, Medium, Substack, GitHub Pages, and X Articles.

MIT. Self-hosted. Agent-native. Local-first.

## Layout

```
openpub/
├── src/core/            shared publishing engine (platform-agnostic, no cloud deps)
│   ├── types.ts         PlatformName, PublishInput, Config, PublishReport
│   ├── config.ts        ~/.openpub/config.json (0600) + state.json
│   ├── frontmatter.ts   dependency-free frontmatter parse + emit (8 formats)
│   ├── state.ts         content-hash idempotency ledger
│   ├── publish.ts       fan-out engine, canonical wiring, dry-run
│   └── adapters/        one file per platform, all `(input, creds) => fetch`
├── cli/                 npm: openpub-cli, bin: openpub
├── mcp/                 npm: openpub-mcp  (stdio MCP server)
├── site/                landing page
├── src/ (worker)        optional self-host mode: Cloudflare Worker + D1 + R2 + Queues
├── dashboard/           optional self-host dashboard (TanStack Start)
├── action.yml           composite GitHub Action
├── scripts/publish.sh   action entrypoint (git pathspec -> changed files -> CLI)
└── test/                action tests (real git fixture + fake npx)
```

The core is the product. The CLI, the MCP server, and the GitHub Action are thin
surfaces over `src/core`. The Cloudflare Worker is an optional self-host mode,
never a requirement.

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
| `x` | `{"access_token": "..."}` (OAuth2 user token, `tweet.write`, X Premium required) |

## Verified

- `help`, `init`, `status`, `setup`, `test`, `audit`, `preview`, `frontmatter`,
  `check-links` all run against real files.
- `publish <file> --to github-pages` wrote a real file into a real repo and
  wired the canonical URL to it.
- Republish is skipped as unchanged; `--force` republishes.
- `bash test/publish.test.sh` passes: changed-file detection, argument
  forwarding, and the `published-count` output.
