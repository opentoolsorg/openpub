import type { Context } from 'hono'
import * as db from './db'
import { adapters, platformNames } from './platforms'
import { enqueuePublish } from './publish'
import type { Env, PlatformName } from './types'

// Minimal MCP JSON-RPC handler over Streamable HTTP (stateless JSON mode).
// Handles initialize, tools/list, tools/call — enough for Claude Code, Cursor, etc.

interface JsonRpc { jsonrpc: string; id?: string | number; method: string; params?: any }

const SERVER_INFO = { name: 'openpost', version: '0.1.0' }

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
      const url = `${env.BASE_URL}/api/images/${key}`
      if (args.draftId) await env.DB.prepare('UPDATE drafts SET cover_image = ? WHERE id = ?').bind(url, args.draftId).run()
      return { url }
    }
    case 'list_posts': return { history: await db.listHistory(env.DB) }
    case 'check_links': {
      const urls = [...(args.content as string).matchAll(/https?:\/\/[^\s)\]"']+/g)].map(m => m[0]).slice(0, 50)
      const blocked = (u: string) => {
        try { const h = new URL(u).hostname; return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/.test(h) || h.endsWith('.internal') } catch { return true }
      }
      const results = await Promise.all(urls.filter(u => !blocked(u)).map(async u => {
        try { const r = await fetch(u, { method: 'HEAD', redirect: 'follow' }); return { url: u, status: r.status } }
        catch { return { url: u, status: 0 } }
      }))
      const skipped = urls.length - results.length
      return { results, skipped }
    }
    case 'frontmatter': {
      const lines = ['---', `title: "${args.title}"`, `date: ${new Date().toISOString()}`]
      if (args.tags?.length) lines.push(`tags: [${args.tags.map((t: string) => `"${t}"`).join(', ')}]`)
      lines.push('---')
      return { format: args.format, frontmatter: lines.join('\n') }
    }
    default: throw new Error(`unknown tool ${name}`)
  }
}

export async function mcpHandler(c: Context<{ Bindings: Env }>) {
  const m = c.req.header('Authorization')?.match(/^Bearer\s+(.+)$/i)
  const key = m?.[1] ?? c.req.query('key')
  if (!c.env.ADMIN_KEY || !key || key !== c.env.ADMIN_KEY) return c.json({ error: 'unauthorized' }, 401)

  const body = await c.req.json<JsonRpc | JsonRpc[]>()
  const reqs = Array.isArray(body) ? body : [body]
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
