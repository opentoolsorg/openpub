# Deploying OpenPub

OpenPub runs as a single Cloudflare Worker backed by D1 (drafts and publish log), KV (config), R2 (cover images), a Queue (publish jobs), and Workers AI (cover generation). One worker, no servers.

## Prerequisites

- Cloudflare account (free plan works)

- Node.js 22 or newer (matches the repository's CI)
- Wrangler CLI: `npm install -g wrangler` (or use `npx wrangler`)
- Wrangler 4.x recommended; the repo pins `wrangler@^4` as a dev dependency

Log in once so wrangler can talk to your account:

```bash
wrangler login
```

## 1. Clone and install

```bash
git clone https://github.com/princepal9120/openpub.git
cd openpub
npm ci
```

## 2. Create the Cloudflare resources

OpenPub needs four bindings, matching `apps/worker/wrangler.toml`:

```bash
# D1 database (drafts, publish log, platform credentials)
wrangler d1 create openpub-db

# KV namespace (worker key/value config)
wrangler kv namespace create KEYS

# R2 bucket (generated cover images)
wrangler r2 bucket create openpub-media

# Queue (async publish jobs, with consumer configured in wrangler.toml)
wrangler queues create openpub-publish
```

D1 and KV print resource IDs. Replace the existing D1 and KV IDs in `apps/worker/wrangler.toml` with your own before deploying; the checked-in IDs belong to the upstream installation. R2 and Queues use the names above. Enable R2 and Queues in your Cloudflare account if prompted; account or billing requirements may apply.

Keep the resource bindings below:

```toml
[[d1_databases]]
binding = "DB"
database_name = "openpub-db"
database_id = "<id from d1 create>"

[[kv_namespaces]]
binding = "KEYS"
id = "<id from kv namespace create>"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "openpub-media"

[[queues.producers]]
binding = "PUBLISH_QUEUE"
queue = "openpub-publish"

[[queues.consumers]]
queue = "openpub-publish"
max_batch_size = 5
max_retries = 3

[ai]
binding = "AI"
```

## 3. Apply the database schema

```bash
npx wrangler d1 execute openpub-db --config apps/worker/wrangler.toml --remote --file=./migrations/init.sql
```

This creates the platform, draft, publish, and dashboard-auth tables. Safe to re-run; all statements are `IF NOT EXISTS`.

For an existing deployment, apply the auth migration before deploying the password-login version:

```bash
npx wrangler d1 execute openpub-db --config apps/worker/wrangler.toml --remote --file=./migrations/002_dashboard_auth.sql
```

## 4. Set the admin secret

`ADMIN_KEY` authenticates REST API and MCP clients. The dashboard also uses it once to initialize its password; after setup, you sign in with that password instead. Note: `?key=` query authentication only works on GET requests; POST and DELETE requests must use the `Authorization: Bearer <ADMIN_KEY>` header. Public endpoints such as `/health`, `/docs`, and `GET /covers/<uuid>.png` do not require authentication.

Generate a strong one:

```bash
openssl rand -hex 32
wrangler secret put ADMIN_KEY --config apps/worker/wrangler.toml
# paste the generated key when prompted
```

Store this key in your password manager. You still need it for MCP clients and one-time dashboard setup.

## 5. Set BASE_URL and DASHBOARD_URL

Update `[vars]` in `apps/worker/wrangler.toml` for your deployment:

```toml
[vars]
BASE_URL = "https://openpub.<your-subdomain>.workers.dev"
DASHBOARD_URL = "https://openpub.<your-subdomain>.workers.dev"
```

- `BASE_URL`: Used to construct absolute URLs for generated cover images. If you do not know the worker URL yet, deploy once (step 6), note the printed URL, update `BASE_URL`, and deploy again.
- `DASHBOARD_URL`: Sets the exact trusted browser origin for dashboard password setup, login, logout, and cookie-session API mutations; it also controls API CORS (not `*`). Set it to the dashboard's actual origin, including when using a custom domain or preview hostname. If unset, API CORS falls back to `http://localhost:3000`, while trusted-origin checks use the Worker request origin. Localhost Workers also allow `http://localhost:3000` for local development. Direct API clients using `Authorization: Bearer <ADMIN_KEY>` are exempt from the cookie-session origin check.

The dashboard uses the same origin as the Worker, so it fills in the instance URL automatically. On first visit, enter `ADMIN_KEY` once and choose a password. The password is stored as a salted hash in D1; later dashboard sign-ins use an HttpOnly session cookie. Keep `ADMIN_KEY` for MCP and direct API clients.

If you forget the dashboard password, clear only the auth rows in D1 (`auth_sessions`, `auth_login_attempts`, and `auth_settings`) and visit `/app` again to set a new one with `ADMIN_KEY`. Drafts and platform credentials are unaffected.

### Cover images

Generated cover images are stored in R2 and served publicly at `GET /covers/<uuid>.png`. Covers are public-by-design with unguessable keys (random UUIDs) so that external social platforms, scrapers, and reader apps can fetch `og:image` preview cards without credentials. Cover generation via `POST /api/images/generate` remains authenticated with `ADMIN_KEY`.

## 6. Deploy

```bash
npm run deploy
```

This builds the dashboard, then deploys the Worker and its static assets together. The landing page, `/app`, and `/docs` share the Worker URL. The dashboard's deployment guide helps you run this setup; it does not provision Cloudflare resources in your browser.

Wrangler prints the worker URL, e.g. `https://openpub.<subdomain>.workers.dev`.

## 7. Verify

Health check (no auth):

```bash
curl https://openpub.<subdomain>.workers.dev/health
# {"ok":true,"name":"openpub"}
```

Authenticated API check:

```bash
curl -H "Authorization: Bearer $ADMIN_KEY" \
  https://openpub.<subdomain>.workers.dev/api/status
# {"platforms":[],"available":["devto","hashnode","wordpress","ghost","medium","substack","github-pages","x"]}
```

MCP endpoint check:

```bash
curl https://openpub.<subdomain>.workers.dev/mcp
# {"name":"openpub","transport":"streamable-http", ...}
```

If all three respond, the deployment is live. Next: configure platform credentials (see [PLATFORMS.md](../../docs/PLATFORMS.md)) and wire up an MCP client (see [MCP-SETUP.md](MCP-SETUP.md)).

## Custom domain (optional)

To serve OpenPub on your own domain:

1. Add the domain's zone to your Cloudflare account.
2. Dashboard: Workers & Pages, open `openpub`, Settings, Domains & Routes, Add, Custom Domain.
3. Enter e.g. `post.example.com`. Cloudflare provisions the cert automatically.
4. Update `BASE_URL` in `apps/worker/wrangler.toml` to `https://post.example.com` and run `npm run deploy` from the repository root again.

Or via wrangler.toml directly:

```toml
routes = [
  { pattern = "post.example.com", custom_domain = true }
]
```

## Free tier notes

Everything OpenPub uses fits inside the Cloudflare free plan for typical personal publishing volume:

| Resource | Free tier |
|---|---|
| Workers requests | 100,000/day |
| D1 | 5 GB storage, 5M rows read/day |
| KV | 100,000 reads/day, 1,000 writes/day |
| R2 | 10 GB storage, no egress fees |
| Queues | 1M operations/month |
| Workers AI | 10,000 neurons/day (flux-1-schnell covers are cheap) |

The only real constraint is Workers AI: `generate_cover` uses `@cf/black-forest-labs/flux-1-schnell`, which requires Workers AI to be enabled on your account (free tier allocation included; enable it in the dashboard under AI if image generation errors).

Free allocations are not a guarantee of zero cost or card-free signup. Check current Cloudflare pricing and account requirements before provisioning R2, Queues, or Workers AI. Usage beyond an allocation may incur charges or fail according to your account settings.

## Updating

```bash
git pull
npm ci
npm run deploy
```

Secrets (`ADMIN_KEY`) persist across deploys. Schema changes: apply new files in `migrations/` with `npx wrangler d1 execute openpub-db --config apps/worker/wrangler.toml --remote --file=./migrations/<name>.sql`.
