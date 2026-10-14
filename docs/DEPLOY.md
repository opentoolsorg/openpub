# Deploying OpenPost

OpenPost runs as a single Cloudflare Worker backed by D1 (drafts and publish log), KV (config), R2 (cover images), a Queue (publish jobs), and Workers AI (cover generation). One worker, no servers.

## Prerequisites

- Cloudflare account (free plan works)
- Node.js 20 or newer
- Wrangler CLI: `npm install -g wrangler` (or use `npx wrangler`)
- Wrangler 4.x recommended; the repo pins `wrangler@^4` as a dev dependency

Log in once so wrangler can talk to your account:

```bash
wrangler login
```

## 1. Clone and install

```bash
git clone <your-fork-or-repo-url> openpost
cd openpost
npm install
```

## 2. Create the Cloudflare resources

OpenPost needs four bindings, matching `wrangler.toml`:

```bash
# D1 database (drafts, publish log, platform credentials)
wrangler d1 create openpost-db

# KV namespace (worker key/value config)
wrangler kv namespace create KEYS

# R2 bucket (generated cover images)
wrangler r2 bucket create openpost-media

# Queue (async publish jobs, with consumer configured in wrangler.toml)
wrangler queues create openpost-publish
```

Each command prints an ID. Copy them into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "openpost-db"
database_id = "<id from d1 create>"

[[kv_namespaces]]
binding = "KEYS"
id = "<id from kv namespace create>"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "openpost-media"

[[queues.producers]]
binding = "PUBLISH_QUEUE"
queue = "openpost-publish"

[[queues.consumers]]
queue = "openpost-publish"
max_batch_size = 5
max_retries = 3

[ai]
binding = "AI"
```

## 3. Apply the database schema

```bash
wrangler d1 execute openpost-db --file=./migrations/init.sql
```

This creates `platform_config`, `drafts`, and `publish_log`. Safe to re-run; all statements are `IF NOT EXISTS`.

## 4. Set the admin secret

`ADMIN_KEY` authenticates requests to `/api/*` and `/mcp`. Note: `?key=` query authentication only works on GET requests; POST and DELETE requests must use the `Authorization: Bearer <ADMIN_KEY>` header. Public endpoints such as `/health`, `/docs`, and `GET /covers/<uuid>.png` do not require authentication.

Generate a strong one:

```bash
openssl rand -hex 32
wrangler secret put ADMIN_KEY
# paste the generated key when prompted
```

Store this key in your password manager. It is the only credential for the whole deployment.

## 5. Set BASE_URL and DASHBOARD_URL

Update `[vars]` in `wrangler.toml` for your deployment:

```toml
[vars]
BASE_URL = "https://openpost.<your-subdomain>.workers.dev"
DASHBOARD_URL = "https://openpost-dashboard.<your-subdomain>.workers.dev"
```

- `BASE_URL`: Used to construct absolute URLs for generated cover images. If you do not know the worker URL yet, deploy once (step 6), note the printed URL, update `BASE_URL`, and deploy again.
- `DASHBOARD_URL`: Restricts CORS for API requests (CORS is restricted to `DASHBOARD_URL` instead of `*`). In local development, it defaults to `http://localhost:3000` if unset.

### Cover images

Generated cover images are stored in R2 and served publicly at `GET /covers/<uuid>.png`. Covers are public-by-design with unguessable keys (random UUIDs) so that external social platforms, scrapers, and reader apps can fetch `og:image` preview cards without credentials. Cover generation via `POST /api/images/generate` remains authenticated with `ADMIN_KEY`.

## 6. Deploy

```bash
wrangler deploy
```

Wrangler prints the worker URL, e.g. `https://openpost.<subdomain>.workers.dev`.

## 7. Verify

Health check (no auth):

```bash
curl https://openpost.<subdomain>.workers.dev/health
# {"ok":true,"name":"openpost"}
```

Authenticated API check:

```bash
curl -H "Authorization: Bearer $ADMIN_KEY" \
  https://openpost.<subdomain>.workers.dev/api/status
# {"platforms":[],"available":["devto","hashnode","wordpress","ghost","medium","substack","github-pages","x"]}
```

MCP endpoint check:

```bash
curl https://openpost.<subdomain>.workers.dev/mcp
# {"name":"openpost","transport":"streamable-http", ...}
```

If all three respond, the deployment is live. Next: configure platform credentials (see [PLATFORMS.md](PLATFORMS.md)) and wire up an MCP client (see [MCP-SETUP.md](MCP-SETUP.md)).

## Custom domain (optional)

To serve OpenPost on your own domain:

1. Add the domain's zone to your Cloudflare account.
2. Dashboard: Workers & Pages, open `openpost`, Settings, Domains & Routes, Add, Custom Domain.
3. Enter e.g. `post.example.com`. Cloudflare provisions the cert automatically.
4. Update `BASE_URL` in `wrangler.toml` to `https://post.example.com` and run `wrangler deploy` again.

Or via wrangler.toml directly:

```toml
routes = [
  { pattern = "post.example.com", custom_domain = true }
]
```

## Free tier notes

Everything OpenPost uses fits inside the Cloudflare free plan for typical personal publishing volume:

| Resource | Free tier |
|---|---|
| Workers requests | 100,000/day |
| D1 | 5 GB storage, 5M rows read/day |
| KV | 100,000 reads/day, 1,000 writes/day |
| R2 | 10 GB storage, no egress fees |
| Queues | 1M operations/month |
| Workers AI | 10,000 neurons/day (flux-1-schnell covers are cheap) |

The only real constraint is Workers AI: `generate_cover` uses `@cf/black-forest-labs/flux-1-schnell`, which requires Workers AI to be enabled on your account (free tier allocation included; enable it in the dashboard under AI if image generation errors).

D1, KV, R2, and Queues all work on the free plan without a card on file. Workers AI usage beyond the free daily allocation bills per-neuron if you add a payment method; otherwise requests just fail until the next day.

## Updating

```bash
git pull
wrangler deploy
```

Secrets (`ADMIN_KEY`) persist across deploys. Schema changes: apply new files in `migrations/` with `wrangler d1 execute openpost-db --file=./migrations/<name>.sql`.
