import { Hono } from 'hono'
import { api } from './api'
import { dashboardHtml } from './dashboard'
import { docsHtml, landingHtml } from './landing'
import { mcpHandler } from './mcp'
import { publishConsumer } from './publish'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => c.html(landingHtml()))
app.get('/health', (c) => c.json({ ok: true, name: 'openpost' }))
app.get('/docs', (c) => c.html(docsHtml()))
app.get('/dashboard', (c) =>
  c.env.DASHBOARD_URL
    ? c.redirect(c.env.DASHBOARD_URL, 302)
    : c.html(dashboardHtml()),
)
app.route('/api', api)
app.post('/mcp', mcpHandler)
app.get('/mcp', (c) => c.json({ name: 'openpost', transport: 'streamable-http', usage: 'POST JSON-RPC with Authorization: Bearer ADMIN_KEY' }))

export default {
  fetch: app.fetch,
  queue: publishConsumer,
}
