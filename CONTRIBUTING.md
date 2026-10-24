# Contributing

Thanks for taking a look. Bug reports, platform requests, and pull requests are all welcome.

## Setup

```bash
git clone https://github.com/princepal9120/openpub
cd openpub

npm install                    # core dependencies
npm test                       # core tests
npm run typecheck              # types
```

## Before you open a PR

CI runs four jobs. Reproduce them locally and keep them green:

```bash
npm ci && npx tsc --noEmit && npm test   # core
npm --prefix cli install && npm --prefix cli run build   # cli
npm --prefix mcp install && npm --prefix mcp run build   # mcp
bash test/publish.test.sh                # action
```

Keep changes small and focused. One logical change per PR. If you are planning something large, open an issue first so we can agree on the shape before you write it.

## Adding a platform

Adding a platform is one file plus one registration:

1. Copy `src/core/adapters/template.ts`.
2. Implement `publish` and `test`.
3. Register it in `src/core/adapters/index.ts`.
4. Add it to `PLATFORMS` in `src/core/types.ts`, and to the credentials table in `README.md`.
5. Add tests in `__tests__/`.

It then appears in the CLI, the MCP server, the GitHub Action, and the self-hosted worker with no further wiring. `src/platforms/` holds thin re-export shims for the worker, so nothing there needs editing.

## Hard rule: never leak a credential

OpenPub stores publishing credentials for every configured platform. A credential value must never reach an error message, a log line, or a publish report. `sanitize()` in the publish path scrubs known values before an error is stored, and adapters should still fail with a status code and a short reason rather than an echoed request.

If you find a credential leak, report it privately per [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Docs

If a change is user-visible, update `README.md`. Deeper detail belongs in `docs/`:

- `docs/ARCHITECTURE.md` for the engine, its contracts, and the publish lifecycle
- `docs/DEPLOY.md` for the self-hosted worker
- `docs/MCP-SETUP.md` for MCP client wiring
- `docs/PLATFORMS.md` for per-platform adapter behaviour and limits

## Style

No em dashes. Terse dev-tool voice. Plain `fetch`, `try`/`catch`, and `for` loops over new abstractions. A dependency needs a reason to exist.

## License

MIT. Contributing means you agree your changes ship under it.
