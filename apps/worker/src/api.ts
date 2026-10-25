import { Hono } from 'hono'
import { marked } from 'marked'
import * as db from './db'
import { adapters, platformNames } from './platforms'
import { enqueuePublish } from './publish'
import { images } from './images'
import { auth, hasValidSession, trustedOrigin } from './auth'
import type { Env, PlatformName } from './types'

export const api = new Hono<{ Bindings: Env }>()

function corsOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin')
  const host = new URL(request.url).hostname
  if (origin === 'http://localhost:3000' && (host === 'localhost' || host === '127.0.0.1')) return origin
  return env.DASHBOARD_URL ?? 'http://localhost:3000'
}

api.use('*', async (c, next) => {
  const origin = corsOrigin(c.req.raw, c.env)
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization,Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        Vary: 'Origin',
      },
    })
  }
  await next()
  c.res.headers.set('Access-Control-Allow-Origin', origin)
  c.res.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type')
  c.res.headers.set('Access-Control-Allow-Credentials', 'true')
})

// timing-safe-ish key compare; ?key= accepted on GET only (covers/previews need it)
async function keyMatch(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ])
  const x = new Uint8Array(ha), y = new Uint8Array(hb)
  if (x.length !== y.length) return false
  let d = 0
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]
  return d === 0
}

api.use('*', async (c, next) => {
  if (c.req.path.startsWith('/auth/') || c.req.path.startsWith('/api/auth/')) return next()
  const m = c.req.header('Authorization')?.match(/^Bearer\s+(.+)$/i)
  const key = m?.[1] ?? (c.req.method === 'GET' ? c.req.query('key') : undefined)
  if (c.env.ADMIN_KEY && key && await keyMatch(key, c.env.ADMIN_KEY)) return next()

  if (await hasValidSession(c.env.DB, c.req.raw)) {
    const safeMethod = c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS'
    if (!safeMethod && !trustedOrigin(c.req.raw, c.env)) return c.json({ error: 'request origin not allowed' }, 403)
    return next()
  }
  return c.json({ error: 'unauthorized' }, 401)
})

api.route('/auth', auth)
api.route('/images', images)

api.get('/status', async (c) => {
  const platforms = await db.listConfiguredPlatforms(c.env.DB)
  return c.json({ platforms, available: platformNames })
})

api.post('/platforms/:name', async (c) => {
  const name = c.req.param('name') as PlatformName
  if (!adapters[name]) return c.json({ error: `unknown platform ${name}` }, 400)
  const creds = await c.req.json<Record<string, string>>()
  await db.setCreds(c.env.DB, name, creds)
  return c.json({ ok: true, platform: name })
})

api.post('/platforms/:name/test', async (c) => {
  const name = c.req.param('name') as PlatformName
  if (!adapters[name]) return c.json({ error: `unknown platform ${name}` }, 400)
  const creds = await db.getCreds(c.env.DB, name)
  if (!creds) return c.json({ ok: false, error: 'no credentials stored' })
  const ok = await adapters[name].test(creds).catch(() => false)
  return c.json({ ok })
})

api.get('/drafts', async (c) => c.json({ drafts: await db.listDrafts(c.env.DB) }))

api.post('/drafts', async (c) => {
  let body: { id?: string; title?: string; content: string; platforms: string[]; cover_image?: string | null }
  try {
    if (Number(c.req.header('content-length') ?? 0) > 1_000_000) return c.json({ error: 'body too large' }, 413)
    body = await c.req.json()
    if (JSON.stringify(body).length > 1_000_000) return c.json({ error: 'body too large' }, 413)
  } catch { return c.json({ error: 'invalid JSON body' }, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'invalid request body' }, 400)
  if (typeof body.content !== 'string' || !body.content.trim() || !Array.isArray(body.platforms) || !body.platforms.length || !body.platforms.every(p => typeof p === 'string')) {
    return c.json({ error: 'content + platforms[] required' }, 400)
  }
  if ((body.id !== undefined && (typeof body.id !== 'string' || !body.id)) || (body.title != null && typeof body.title !== 'string') || (body.cover_image != null && typeof body.cover_image !== 'string')) {
    return c.json({ error: 'invalid draft fields' }, 400)
  }
  const bad = body.platforms.filter(p => !Object.prototype.hasOwnProperty.call(adapters, p))
  if (bad.length) return c.json({ error: `unknown platforms: ${bad.join(', ')}` }, 400)
  const id = body.id ?? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  try {
    await db.createDraft(c.env.DB, { id, title: body.title, content: body.content, platforms: body.platforms, cover_image: body.cover_image ?? undefined })
  } catch {
    return c.json({ error: 'draft id already exists' }, 409)
  }
  return c.json({ id })
})

api.get('/drafts/:id', async (c) => {
  const d = await db.getDraft(c.env.DB, c.req.param('id'))
  return d ? c.json(d) : c.json({ error: 'not found' }, 404)
})

api.put('/drafts/:id', async (c) => {
  const id = c.req.param('id')
  let body: { title?: string | null; content?: string; platforms?: string[]; cover_image?: string | null }
  try {
    if (Number(c.req.header('content-length') ?? 0) > 1_000_000) return c.json({ error: 'body too large' }, 413)
    body = await c.req.json()
    if (JSON.stringify(body).length > 1_000_000) return c.json({ error: 'body too large' }, 413)
  } catch { return c.json({ error: 'invalid JSON body' }, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'invalid request body' }, 400)
  if (('title' in body && body.title !== null && typeof body.title !== 'string') || ('content' in body && (typeof body.content !== 'string' || !body.content.trim())) || ('cover_image' in body && body.cover_image !== null && typeof body.cover_image !== 'string')) {
    return c.json({ error: 'invalid draft fields' }, 400)
  }
  if ('platforms' in body && (!Array.isArray(body.platforms) || !body.platforms.length || !body.platforms.every(p => typeof p === 'string'))) {
    return c.json({ error: 'platforms must be a non-empty string array' }, 400)
  }
  if (body.platforms) {
    const bad = body.platforms.filter(p => !Object.prototype.hasOwnProperty.call(adapters, p))
    if (bad.length) return c.json({ error: `unknown platforms: ${bad.join(', ')}` }, 400)
  }
  const ok = await db.updateDraft(c.env.DB, id, body)
  if (!ok) return c.json({ error: 'not found' }, 404)
  return c.json({ id, ok: true })
})

api.delete('/drafts/:id', async (c) => {
  await db.deleteDraft(c.env.DB, c.req.param('id'))
  return c.json({ ok: true })
})

api.post('/publish', async (c) => {
  let body: { draftId?: string; title?: string; content?: string; platforms?: string[] }
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON body' }, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'invalid request body' }, 400)
  if ((body.draftId !== undefined && (typeof body.draftId !== 'string' || !body.draftId)) || (body.title != null && typeof body.title !== 'string') || (body.content !== undefined && (typeof body.content !== 'string' || !body.content.trim()))) {
    return c.json({ error: 'invalid publish fields' }, 400)
  }
  if (body.platforms !== undefined && (!Array.isArray(body.platforms) || !body.platforms.length || !body.platforms.every(p => typeof p === 'string'))) {
    return c.json({ error: 'platforms must be a non-empty string array' }, 400)
  }
  let draftId = body.draftId
  if (!draftId) {
    if (!body.content || !body.platforms) return c.json({ error: 'draftId or content+platforms required' }, 400)
    const bad = body.platforms.filter(p => !Object.prototype.hasOwnProperty.call(adapters, p))
    if (bad.length) return c.json({ error: `unknown platforms: ${bad.join(', ')}` }, 400)
    draftId = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    await db.createDraft(c.env.DB, { id: draftId, title: body.title, content: body.content, platforms: body.platforms })
  }
  const draft = await db.getDraft(c.env.DB, draftId)
  if (!draft) return c.json({ error: 'draft not found' }, 404)

  let targets: PlatformName[] | undefined
  if (body.platforms) {
    const bad = body.platforms.filter(p => !Object.prototype.hasOwnProperty.call(adapters, p))
    if (bad.length) return c.json({ error: `unknown platforms: ${bad.join(', ')}` }, 400)
    const allowed = new Set(draft.platforms as string[])
    const invalid = body.platforms.filter(p => !allowed.has(p))
    if (invalid.length) return c.json({ error: `platforms not in draft: ${invalid.join(', ')}` }, 400)
    targets = body.platforms as PlatformName[]
  }
  const jobs = await enqueuePublish(c.env, draftId, targets)
  return c.json({ draftId, jobs })
})

api.get('/drafts/:id/preview', async (c) => {
  const d = await db.getDraft(c.env.DB, c.req.param('id'))
  if (!d) return c.json({ error: 'not found' }, 404)
  const { frontmatter, body } = parseFrontmatter(d.content)
  return c.json({
    title: (frontmatter.title as string) ?? d.title,
    html: marked.parse(body) as string,
    frontmatter,
  })
})

api.get('/posts', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT l.draft_id, l.platform, l.status, l.url, l.error, l.attempts, l.created_at AS logged_at,
           d.title, d.status AS draft_status, d.created_at
    FROM publish_log l LEFT JOIN drafts d ON d.id = l.draft_id
    ORDER BY l.created_at DESC LIMIT 500`).all<Record<string, unknown>>()
  const posts = new Map<string, Record<string, unknown>>()
  for (const r of results) {
    const id = r.draft_id as string
    if (!posts.has(id)) {
      posts.set(id, { draft_id: id, title: r.title, slug: id, status: r.draft_status, created_at: r.created_at, platforms: {} })
    }
    ;(posts.get(id)!.platforms as Record<string, unknown>)[r.platform as string] =
      { status: r.status, url: r.url, error: r.error, attempts: r.attempts, logged_at: r.logged_at }
  }
  return c.json({ posts: [...posts.values()] })
})

api.get('/history', async (c) => c.json({ history: await db.listHistory(c.env.DB) }))

api.post('/history/:draftId/:platform/retry', async (c) => {
  const platform = c.req.param('platform') as PlatformName
  if (!Object.prototype.hasOwnProperty.call(adapters, platform)) return c.json({ error: `unknown platform ${platform}` }, 400)
  const draft = await db.getDraft(c.env.DB, c.req.param('draftId'))
  if (!draft) return c.json({ error: 'not found' }, 404)
  if (!(draft.platforms as string[]).includes(platform)) return c.json({ error: `${platform} not in draft platforms` }, 400)
  await c.env.DB.prepare("UPDATE publish_log SET status = 'retryable' WHERE draft_id = ? AND platform = ? AND status = 'failed'")
    .bind(c.req.param('draftId'), platform).run()
  const jobs = await enqueuePublish(c.env, c.req.param('draftId'), platform)
  return c.json({ jobs })
})

// ponytail: minimal frontmatter parse — key: value + [a,b] only, no yaml lib (Workers-safe)
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { frontmatter: {}, body: content }
  const frontmatter: Record<string, unknown> = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (!kv) continue
    const v = kv[2].trim()
    frontmatter[kv[1]] = v.startsWith('[')
      ? v.slice(1, v.lastIndexOf(']') + 1 || undefined).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
      : v.replace(/^['"]|['"]$/g, '')
  }
  return { frontmatter, body: m[2] }
}
