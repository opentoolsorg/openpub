import type { Context } from 'hono'
import * as db from './db'
import { adapters, platformNames } from './platforms'
import { enqueuePublish } from './publish'
import { buildFrontmatter, type FmFormat } from '@openpub/core/frontmatter'
import type { Env, PlatformName } from './types'

// Minimal MCP JSON-RPC handler over Streamable HTTP (stateless JSON mode).
// Handles initialize, tools/list, tools/call — enough for Claude Code, Cursor, etc.

interface JsonRpc { jsonrpc: string; id?: string | number; method: string; params?: any }

const SERVER_INFO = { name: 'openpub', version: '0.1.0' }

const TOOLS = [
  { name: 'publish', description: 'Publish a draft to one platform. Auth: ADMIN_KEY required. Returns {draftId, jobs}.', inputSchema: { type: 'object', properties: { draftId: { type: 'string' }, platform: { type: 'string', enum: platformNames } }, required: ['draftId', 'platform'] } },
  { name: 'cross_publish', description: 'Publish a draft (or inline content) to all its platforms with canonical URL wiring. Returns job ids.', inputSchema: { type: 'object', properties: { draftId: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' }, platforms: { type: 'array', items: { type: 'string' } } } } },
  { name: 'save_draft', description: 'Save markdown as a draft. Returns {id}.', inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, platforms: { type: 'array', items: { type: 'string' } } }, required: ['content', 'platforms'] } },
  { name: 'list_drafts', description: 'List saved drafts with status and platforms.', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_draft', description: 'Get one draft by id.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'delete_draft', description: 'Delete a draft by id.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'setup', description: 'Store API credentials for a platform. Body: credentials object per platform.', inputSchema: { type: 'object', properties: { platform: { type: 'string', enum: platformNames }, credentials: { type: 'object' } }, required: ['platform', 'credentials'] } },
  { name: 'status', description: 'Show configured and available platforms.', inputSchema: { type: 'object', properties: {} } },
  { name: 'test_platform', description: 'Test stored credentials against a platform API.', inputSchema: { type: 'object', properties: { platform: { type: 'string', enum: platformNames } }, required: ['platform'] } },
  { name: 'generate_cover', description: 'Generate a cover image via Workers AI and attach to a draft. Returns {url}.', inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, draftId: { type: 'string' } }, required: ['prompt'] } },
  { name: 'list_posts', description: 'Publish history with per-platform status and urls.', inputSchema: { type: 'object', properties: {} } },
  { name: 'check_links', description: 'Validate all URLs in a markdown body. Returns per-link status.', inputSchema: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] } },
  { name: 'frontmatter', description: 'Generate frontmatter for hugo/jekyll/astro/nextjs/devto/hashnode/ghost.', inputSchema: { type: 'object', properties: { title: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, format: { type: 'string' } }, required: ['title', 'format'] } },
]

function ok(id: any, result: any) { return { jsonrpc: '2.0', id, result } }
function err(id: any, code: number, message: string) { return { jsonrpc: '2.0', id, error: { code, message } } }

async function keyEq(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ])
  const x = new Uint8Array(ha), y = new Uint8Array(hb)
  let d = x.length ^ y.length
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]
  return d === 0
}

async function callTool(env: Env, name: string, args: any): Promise<any> {
  switch (name) {
    case 'publish': {
      const draft = await db.getDraft(env.DB, args.draftId)
      if (!draft) throw new Error('draft not found')
      if (!adapters[args.platform as PlatformName]) throw new Error(`unknown platform ${args.platform}`)
      const jobs = await enqueuePublish(env, args.draftId, args.platform as PlatformName)
      return { draftId: args.draftId, jobs }
    }
    case 'cross_publish': {
      let draftId = args.draftId
      if (!draftId) {
        draftId = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
        await db.createDraft(env.DB, { id: draftId, title: args.title, content: args.content, platforms: args.platforms ?? platformNames })
      }
      const jobs = await enqueuePublish(env, draftId)
      return { draftId, jobs }
    }
    case 'save_draft': {
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      await db.createDraft(env.DB, { id, title: args.title, content: args.content, platforms: args.platforms })
      return { id }
    }
    case 'list_drafts': return { drafts: await db.listDrafts(env.DB) }
    case 'get_draft': return await db.getDraft(env.DB, args.id) ?? { error: 'not found' }
    case 'delete_draft': { await db.deleteDraft(env.DB, args.id); return { ok: true } }
    case 'setup': {
      if (!adapters[args.platform as PlatformName]) throw new Error(`unknown platform ${args.platform}`)
      await db.setCreds(env.DB, args.platform, args.credentials)
      return { ok: true, platform: args.platform }
    }
    case 'status': return { platforms: await db.listConfiguredPlatforms(env.DB), available: platformNames }
    case 'test_platform': {
      if (!adapters[args.platform as PlatformName]) throw new Error(`unknown platform ${args.platform}`)
      const creds = await db.getCreds(env.DB, args.platform)
      if (!creds) return { ok: false, error: 'no credentials stored' }
      return { ok: await adapters[args.platform as PlatformName].test(creds).catch(() => false) }
    }
    case 'generate_cover': {
      const res = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt: args.prompt }) as { image?: string }
      if (!res.image) throw new Error('image generation failed')
      const key = `covers/${crypto.randomUUID()}.png`
      await env.MEDIA.put(key, Uint8Array.from(atob(res.image), ch => ch.charCodeAt(0)), { httpMetadata: { contentType: 'image/png' } })
      const url = `${env.BASE_URL}/covers/${key.replace(/^covers\//, '')}`
      if (args.draftId) await env.DB.prepare('UPDATE drafts SET cover_image = ? WHERE id = ?').bind(url, args.draftId).run()
      return { url }
    }
    case 'list_posts': return { history: await db.listHistory(env.DB) }
    case 'check_links': {
      const urls = [...(args.content as string).matchAll(/https?:\/\/[^\s)\]"']+/g)].map(m => m[0]).slice(0, 50)
      const blocked = (u: string) => {
        try {
          const h = new URL(u).hostname.replace(/^\[|\]$/g, '').toLowerCase()
          if (h === 'localhost' || h === '::1' || h.endsWith('.internal')) return true
          const n = Number(h) // decimal/hex IPv4 like 2130706433 or 0x7f000001
          if (Number.isInteger(n) && n >= 0 && n <= 0xffffffff) return true
          const v4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
          if (v4) {
            const [a, b, c2, d2] = v4.slice(1).map(Number)
            if ([a, b, c2, d2].some(o => o > 255)) return true
            if (a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168) return true
          }
          if (/^(::ffff:|fe|fc|fd|ff)/.test(h)) return true // v6 mapped/link-local/ULA
          return /^\d+\./.test(h) && !(v4) // partial IPs like 127.1
        } catch { return true }
      }
      const results = await Promise.all(urls.filter(u => !blocked(u)).map(async u => {
        try { const r = await fetch(u, { method: 'HEAD', redirect: 'manual' }); return { url: u, status: r.status } }
        catch { return { url: u, status: 0 } }
      }))
      const skipped = urls.length - results.length
      return { results, skipped }
    }
    case 'frontmatter': {
      const frontmatter = buildFrontmatter(args.format as FmFormat, {
        title: args.title,
        tags: args.tags ?? [],
      }).trimEnd()
      return { format: args.format, frontmatter }
    }
    default: throw new Error(`unknown tool ${name}`)
  }
}

export async function mcpHandler(c: Context<{ Bindings: Env }>) {
  const m = c.req.header('Authorization')?.match(/^Bearer\s+(.+)$/i)
  const key = m?.[1] // POST: Bearer only, ?key= is a GET convenience
  if (!c.env.ADMIN_KEY || !key || !(await keyEq(key, c.env.ADMIN_KEY))) return c.json({ error: 'unauthorized' }, 401)

  let body: JsonRpc | JsonRpc[]
  try { body = await c.req.json() } catch { return c.json(err(null, -32700, 'parse error')) }
  const reqs = (Array.isArray(body) ? body : [body]).slice(0, 25) // cap batch size
  const resps = []

  for (const req of reqs) {
    try {
      if (req.method === 'initialize') {
        resps.push(ok(req.id, { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: SERVER_INFO }))
      } else if (req.method === 'notifications/initialized' || req.method === 'notifications/cancelled') {
        continue
      } else if (req.method === 'ping') {
        resps.push(ok(req.id, {}))
      } else if (req.method === 'tools/list') {
        resps.push(ok(req.id, { tools: TOOLS }))
      } else if (req.method === 'tools/call') {
        const result = await callTool(c.env, req.params?.name ?? '', req.params?.arguments ?? {})
        resps.push(ok(req.id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }))
      } else {
        resps.push(err(req.id, -32601, `method not found: ${req.method}`))
      }
    } catch (e) {
      resps.push(err(req.id, -32000, e instanceof Error ? e.message : String(e)))
    }
  }

  return c.json(Array.isArray(body) ? resps : resps[0])
}
