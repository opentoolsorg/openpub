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

CI checks all workspace surfaces. Reproduce checks locally:

```bash
npm ci && npx tsc --noEmit && npm test   # core
npm run cli:build                      # CLI
npm run mcp:build                      # stdio MCP
npm run build --workspace openpub-dashboard
npm run build --workspace @openpub/worker
python3 test/mcp-handshake.py
```

Keep changes small and focused. One logical change per PR. If you are planning something large, open an issue first so we can agree on the shape before you write it.

## Adding a platform

Adding a platform is one file plus one registration:

1. Copy `packages/core/src/adapters/template.ts`.
2. Implement `publish` and `test`.
3. Register it in `packages/core/src/adapters/index.ts`.
4. Add it to `PLATFORMS` in `packages/core/src/types.ts`, and to the credentials table in `README.md`.
5. Add tests in `__tests__/`.

It then appears in CLI, MCP and Worker. All surfaces share the same adapters. Keep Node filesystem/config helpers outside the Worker-safe core entrypoint.

## Hard rule: never leak a credential

OpenPub stores publishing credentials for every configured platform. A credential value must never reach an error message, a log line, or a publish report. `sanitize()` in the publish path scrubs known values before an error is stored, and adapters should still fail with a status code and a short reason rather than an echoed request.

If you find a credential leak, report it privately per [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Docs

If a change is user-visible, update `README.md`. Deeper detail belongs in `docs/`:

- `docs/ARCHITECTURE.md` for the engine, its contracts, and the publish lifecycle
- `apps/worker/docs/DEPLOY.md` for the self-hosted worker
- `apps/worker/docs/MCP-SETUP.md` for MCP client wiring
- `docs/PLATFORMS.md` for per-platform adapter behaviour and limits

## Style

No em dashes. Terse dev-tool voice. Plain `fetch`, `try`/`catch`, and `for` loops over new abstractions. A dependency needs a reason to exist.

## License

MIT. Contributing means you agree your changes ship under it.
