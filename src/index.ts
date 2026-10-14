import { Hono } from 'hono'
import { api } from './api'
import { mcpHandler } from './mcp'
import { publishConsumer } from './publish'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

// SPA shell served by Workers Static Assets (see wrangler.toml [assets]):
// '/', '/app', '/docs' resolve to dashboard/.output/public/index.html.
app.get('/health', (c) => c.json({ ok: true, name: 'openpub' }))
app.get('/dashboard', (c) => c.redirect('/app', 302))
app.route('/api', api)
// public covers: random UUID keys, read-only — published og:images must not need auth
app.get('/covers/:key{.+}', async (c) => {
  const k = c.req.param('key')
  if (!/^[\w.\-]+$/.test(k)) return c.notFound()
  const obj = await c.env.MEDIA.get(`covers/${k}`)
  if (!obj) return c.notFound()
  return new Response(obj.body, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
})
app.post('/mcp', mcpHandler)
app.get('/mcp', (c) => c.json({ name: 'openpub', transport: 'streamable-http', usage: 'POST JSON-RPC with Authorization: Bearer ADMIN_KEY' }))

export default {
  fetch: app.fetch,
  queue: publishConsumer,
}
