# Contributing

1. Fork the repo, create a branch, open a PR against `main`.
2. Adding a platform? Copy the adapter template at `src/platforms/template.ts`, implement `publish` and `test`, then register it in `src/platforms/index.ts`.
3. Tests are required for new adapters - put them in `__tests__/` and make sure `npx tsc -p tsconfig.json` and `npx vitest run` pass.
4. MIT license; contributing means you agree your changes ship under it.
