import { Hono } from 'hono'
import { api } from './api'
import { dashboardHtml } from './dashboard'
import { mcpHandler } from './mcp'
import { publishConsumer } from './publish'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => c.json({
  name: 'openpost',
  version: '0.1.0',
  docs: 'https://github.com/princepal9120/openpost',
  endpoints: {
    health: '/health',
    api: '/api/status',
    mcp: '/mcp (POST JSON-RPC, Authorization: Bearer <ADMIN_KEY>)',
    dashboard: '/dashboard',
  },
}))
app.get('/health', (c) => c.json({ ok: true, name: 'openpost' }))
app.get('/dashboard', (c) => c.html(dashboardHtml()))
app.route('/api', api)
app.post('/mcp', mcpHandler)
app.get('/mcp', (c) => c.json({ name: 'openpost', transport: 'streamable-http', usage: 'POST JSON-RPC with Authorization: Bearer ADMIN_KEY' }))

export default {
  fetch: app.fetch,
  queue: publishConsumer,
}
