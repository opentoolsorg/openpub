# Platform Credentials

OpenPub supports eight platforms. Each needs credentials stored via `POST /api/platforms/:name` (REST) or the `setup` MCP tool. Credential keys are exact: the adapters read them verbatim from the stored JSON object.

> **URL host requirements:** Any `site_url` or `publication_url` credential must be a public HTTPS host (e.g. `https://yourblog.com`). Plaintext HTTP, localhost, loopback addresses, internal hosts (`.internal`, `.local`), private network IP ranges, and URLs with embedded credentials are automatically rejected by platform URL guards.

Store credentials:

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '<credentials json>' \
  https://<worker>/api/platforms/<name>
```

Test them:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_KEY" \
  https://<worker>/api/platforms/<name>/test
# {"ok":true}
```

Or via MCP: `setup` then `test_platform`.

Screenshot placeholders live under `docs/screenshots/<platform>-*.png`.

---

## devto

Dev.to API key. Scope: read + write articles.

**Get it:** dev.to, Settings (top-right avatar), Extensions, "DEV Community API Keys" section. Name the key (e.g. `openpub`), Generate.

**Credentials:**

```json
{ "api_key": "xxxxxxxxxxxxxxxxxxxxxxxx" }
```

**Store:**

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"api_key":"..."}' https://<worker>/api/platforms/devto
```

Notes: publishes to dev.to via `POST /api/articles`, or `PUT /api/articles/{id}` when OpenPub already has the article id. Title maximum is 128 characters. Max 4 tags. `c++` and `c#` become `cpp` and `csharp`; letters outside the Latin alphabet are kept. Canonical URL and cover image supported.

![devto API key settings](screenshots/devto-api-key.png)

---

## hashnode

Hashnode Personal Access Token (PAT).

**Get it:** hashnode.com, avatar, Account Settings, Developer Settings, "Personal Access Tokens", Generate new token. Give it a name; the default scope is enough (it needs to publish to your publication). Copy the token once shown.

**Credentials:**

```json
{ "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

`publication_id` is optional: if omitted, the adapter looks up your first publication via GraphQL `me { publications(first:1) }`. To target a specific publication (e.g. a team blog), add it:

```json
{ "token": "...", "publication_id": "65f1a2b3c4d5e6f7a8b9c0d1" }
```

Find your publication id in the publication dashboard URL or via `query { me { publications(first: 5) { edges { node { id title } } } } }` at gql.hashnode.com with the same token.

Notes: live posts use the `publishPost` mutation at `https://gql.hashnode.com`. `status: draft` uses `createDraft` and never falls back to a live post. Draft mutations require Hashnode Pro; a rejection is reported and nothing is published live. A later edit of a live post uses `updatePost`. A later edit of a draft uses `updateDraft`. A live post cannot be reverted to a draft. Max 5 tags; canonical URL (`originalArticleURL`) and cover image supported.

![hashnode developer settings](screenshots/hashnode-pat.png)

---

## wordpress

WordPress.com or self-hosted WP 5.6+ with Application Passwords. Auth: HTTP Basic `username:app_password` against `/wp-json/wp/v2`.

**Get it:** WP Admin, Users, Profile (or Edit User), scroll to "Application Passwords". Name it `openpub`, Add New Application Password. Copy the generated password (24 chars, displayed with spaces; spaces are fine, Basic auth handles them).

On WordPress.com: Settings, Security, Application Passwords. Requires 2FA enabled first.

**Credentials:**

```json
{
  "site_url": "https://yourblog.com",
  "username": "your-wp-username",
  "app_password": "xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

Notes: publishes HTML to `POST /wp-json/wp/v2/posts`, or to `POST /wp-json/wp/v2/posts/{id}` when OpenPub already has the post id. `site_url` must be an HTTPS public host at the site root (not plaintext HTTP, not localhost or internal IPs, not `/wp-admin`, not a post URL). Canonical URL is sent as `meta.canonical_url` (only surfaces if your theme/SEO plugin reads that meta key; Yoast/RankMath use their own). The user needs `publish_posts` capability for live posts; authors can only create drafts.

Self-hosted gotchas: Application Passwords require HTTPS. Some hosts (e.g. certain Apache/cPanel setups) strip the `Authorization` header; if `test` fails with 401, add `SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1` to `.htaccess` or use a plugin like "Application Passwords" fix.

![wordpress application passwords](screenshots/wordpress-app-password.png)

---

## ghost

Ghost Admin API key (JWT-signed requests). Works on Ghost(Pro) and self-hosted Ghost 4+/5+/6+.

**Get it:** Ghost Admin (`/ghost`), Settings (gear), Integrations, Add custom integration. Name it `openpub`. Copy the **Admin API Key** (format: `<24-hex>:<64-hex>`). Do not use the Content API key; that one is read-only.

**Credentials:**

```json
{
  "site_url": "https://yourblog.ghost.io",
  "admin_key": "64f1a2b3c4d5e6f7a8b9c0d1:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

Notes: the key is `id:secret`; the adapter splits on `:` and signs a 5-minute HS256 JWT per request. Publishes HTML via `POST /ghost/api/admin/posts/?source=html` (the `source=html` param is required or content comes out empty). A later edit PUTs `/ghost/api/admin/posts/{id}/?source=html` and sends the post's current `updated_at`. Max 10 tags; canonical URL and feature image supported. `site_url` must be an HTTPS public host with no trailing path (not plaintext HTTP, not internal or private hostnames).

![ghost integrations](screenshots/ghost-admin-key.png)

---

## medium

Medium Integration Token.

**Get it:** medium.com, avatar, Settings, Security and apps, "Integration tokens". Enter a description (`openpub`), Get token. Copy it.

(If the Integration tokens section is missing, Medium has restricted new token issuance on some accounts; check your Settings page. Existing tokens keep working.)

**Credentials:**

```json
{ "integration_token": "2a1b3c4d5e6f..." }
```

Notes: Medium's API only creates **unlisted/draft/public** posts and cannot update them. A later edit is skipped with a warning instead of creating a second post. OpenPub sends `publishStatus: public` or `draft`. Max 5 tags; canonical URL supported (use it, Medium respects it for SEO). No cover image support in the API. Medium API is officially in maintenance mode but functional.

![medium integration tokens](screenshots/medium-integration-token.png)

---

## substack

Substack has no public API. OpenPub uses your `connect.sid` session cookie against the same internal endpoints the web app uses (`/api/v1/drafts`). Posts are created as **drafts** in your dashboard; you publish/send manually.

**Get it:**

1. Log into your publication on substack.com in a desktop browser.
2. Open DevTools (F12), Application tab, Cookies, `https://<yourpub>.substack.com`.
3. Find `connect.sid`, copy its value (long string, URL-encoded like `s%3A...`).

Firefox: Storage tab instead of Application. Safari: Develop menu, Show Web Inspector, Storage.

**Credentials:**

```json
{
  "publication_url": "https://yourpub.substack.com",
  "connect_sid": "s%3Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

Notes: the cookie expires (rotate when `test_platform` starts failing; re-extract the same way). `publication_url` must be an HTTPS public host (e.g. `https://yourpub.substack.com`; plaintext HTTP, localhost, and internal hosts are rejected). Drafts land at `https://<pub>.substack.com/publish/post/<id>`. That editor URL is never used as the canonical URL on other platforms. A later edit is skipped with a warning so OpenPub does not create a second draft. Markdown is converted to a minimal ProseMirror doc: headings, paragraphs. Rich embeds/tweets in markdown are not carried over. Keep the cookie secret; it is full account access.

![substack connect.sid cookie](screenshots/substack-connect-sid.png)

---

## github-pages

Commits markdown files (with frontmatter) into a GitHub repo, e.g. for Hugo, Jekyll, Astro, Next.js, or mdBook blogs deployed via Pages/Actions.

**Get it:** github.com, avatar, Settings, Developer settings, Personal access tokens, Tokens (classic), Generate new token (classic). Scopes: **`repo`** (full). Expiration: your choice; longer = fewer rotations. Generate, copy.

Fine-grained tokens also work: grant `Contents: Read and write` on the single target repo instead of `repo`.

**Credentials:**

```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "repo": "youruser/yourblog",
  "dir": "content/posts",
  "branch": "main"
}
```

- `repo` (required): `owner/name`
- `dir` (optional, default `content/posts`): where files land, relative to repo root
- `branch` (optional, default `main`)

Notes: files are written as `<dir>/<slug>.md` with YAML frontmatter (`title`, `date`, `tags`, `canonical`, `draft`). The slug keeps Unicode letters and numbers. An empty slug falls back to `post-` plus a hash, and the filename is capped at 80 characters. Re-publishing updates the stored path in place (sha-aware PUT), including after a title change. The `test` call checks repo access only. Pair with the `frontmatter` MCP tool if your static site generator wants extra fields.

![github token scopes](screenshots/github-pat-repo.png)

---

## x

X Articles API (v2). Long-form articles on X, not tweets. Publishing is two-step: OpenPub creates a draft article via `POST /2/articles/draft`, then publishes it via `POST /2/articles/:id/publish`. Draft-status publishes stop after step one and return the composer URL.

**Get it:** developer.x.com, create a project + app, enable OAuth 2.0 (user context) with the `tweet.write` and `media.write` scopes (plus `tweet.read`/`users.read` for the test call), then run the authorization-code flow to obtain a user access token. Client credentials / app-only tokens will not work - the token must act as your account.

**Requires X Premium** on the publishing account; the Articles endpoint rejects non-Premium accounts.

**Credentials:**

```json
{ "access_token": "xxxxxxxxxxxxxxxxxxxxxxxx" }
```

Notes: Markdown is converted to X's DraftJS-style `content_state` (headings, lists, quotes, bold/italic/code/links). Text inside fenced code blocks stays literal, including lines that start with `#` or `-`. Images and embeds are not carried over. Titles are limited to 250 characters. A later edit is skipped with a warning because the API has no edit endpoint. Draft compose URLs (`x.com/compose/...`) are never used as a canonical URL. Access tokens expire (default 2h) - refresh tokens are not yet stored, so rotate `access_token` via `setup` when `test_platform` fails. `test` calls `GET /2/users/me`.

![x oauth2 token](screenshots/x-oauth2-token.png)

---

## Quick reference

| Platform | Credential keys | Token location |
|---|---|---|
| `devto` | `api_key` | Settings, Extensions |
| `hashnode` | `token` (+ optional `publication_id`) | Account Settings, Developer Settings |
| `wordpress` | `site_url`, `username`, `app_password` | Users, Profile, Application Passwords |
| `ghost` | `site_url`, `admin_key` | Settings, Integrations |
| `medium` | `integration_token` | Settings, Security and apps |
| `substack` | `publication_url`, `connect_sid` | DevTools, Cookies |
| `github-pages` | `token`, `repo`, `dir?`, `branch?` | Developer settings, PAT |
| `x` | `access_token` | developer.x.com, OAuth2 user token |

Verify any platform after storing:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_KEY" https://<worker>/api/platforms/<name>/test
```
