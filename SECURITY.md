# Security Policy

## Reporting a vulnerability

Report privately through GitHub's [Report a vulnerability](https://github.com/princepal9120/openpub/security/advisories/new) form, or email princepal9120@gmail.com.

Please do not open a public issue for anything that could expose credentials or allow unauthorised publishing. Expect an acknowledgement within a few days.

## What counts as a vulnerability

OpenPub holds publishing credentials for every platform you configure, so the interesting failure modes are:

- Reading, logging, or leaking stored credentials. Adapters must never put a credential value into an error message, a log line, or a publish report.
- A credential or `ADMIN_KEY` reaching a third party. Credentials belong in `~/.openpub/config.json` (mode `0600`) and nowhere else.
- Bypassing the `0600` permission check on the config file.
- In the self-hosted worker: authentication bypass on `/api/*` or `/mcp`, or a way to reach another tenant's rows in D1, objects in R2, or keys in KV.
- Anything that lets a request publish to a platform without the stored credentials for it.

## What is not a vulnerability

- **Credentials you configured yourself leaking to the platform you configured them for.** That is the product working.
- **Substack and Medium adapter fragility.** Substack has no public API and Medium deprecated its publishing API. Both adapters use endpoints that upstream can change or remove at any time, and that is documented in the README rather than treated as a security bug.
- **A missing `ADMIN_KEY` on your own deployment.** Set one. The docs walk through it.

## Supported versions

The `main` branch and the latest published `openpub-cli` and `openpub-mcp` releases receive fixes. Older versions do not.
