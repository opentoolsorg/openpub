import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { mcpHandler } from '../src/mcp'
import type { Env } from '../src/types'

// In-memory D1 stub: stores drafts rows keyed by id.
function mockDB() {
  const drafts = new Map<string, any>()
  return {
    drafts,
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            async run() {
              if (sql.startsWith('INSERT INTO drafts')) {
                drafts.set(args[0], {
                  id: args[0], title: args[1], content: args[2],
                  platforms: args[3], cover_image: args[4],
                  canonical_url: null, status: 'draft', created_at: Date.now(),
                })
              } else if (sql.startsWith('DELETE FROM drafts')) {
                drafts.delete(args[0])
              }
              return { success: true }
            },
            async first() {
              if (sql.includes('FROM drafts')) return drafts.get(args[0]) ?? null
              return null
            },
            async all() {
              return { results: [...drafts.values()] }
            },
          }
        },
      }
    },
  }
}

function makeEnv() {
  return {
    DB: mockDB(),
    KEYS: {} as any,
    MEDIA: { put: async () => ({}) } as any,
    PUBLISH_QUEUE: { send: async () => {} } as any,
    AI: { run: async () => ({}) } as any,
    ADMIN_KEY: 'test-key',
    BASE_URL: 'http://localhost',
  } as unknown as Env
}

const app = new Hono<{ Bindings: Env }>()
app.post('/mcp', mcpHandler)

const rpc = (env: Env, body: any, key = 'test-key') =>
  app.request('/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  }, env)

describe('mcpHandler', () => {
  it('initialize returns protocolVersion and serverInfo', async () => {
    const res = await rpc(makeEnv(), { jsonrpc: '2.0', id: 1, method: 'initialize' })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.result.protocolVersion).toBe('2025-03-26')
    expect(body.result.serverInfo).toEqual({ name: 'openpub', version: '0.1.0' })
    expect(body.result.capabilities).toHaveProperty('tools')
  })

  it('tools/list returns all 13 tools', async () => {
    const res = await rpc(makeEnv(), { jsonrpc: '2.0', id: 2, method: 'tools/list' })
    const body = await res.json() as any
    const names = body.result.tools.map((t: any) => t.name)
    expect(names).toHaveLength(13)
    expect(names).toEqual([
      'publish', 'cross_publish', 'save_draft', 'list_drafts', 'get_draft',
      'delete_draft', 'setup', 'status', 'test_platform', 'generate_cover',
      'list_posts', 'check_links', 'frontmatter',
    ])
  })

  it('tools/call with unknown tool returns error', async () => {
    const res = await rpc(makeEnv(), {
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'nope', arguments: {} },
    })
    const body = await res.json() as any
    expect(body.error).toBeDefined()
    expect(body.error.message).toContain('unknown tool')
  })

  it('save_draft + get_draft roundtrip', async () => {
    const env = makeEnv()
    const save = await rpc(env, {
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'save_draft', arguments: { title: 'T', content: '# hi', platforms: ['devto'] } },
    })
    const saveBody = await save.json() as any
    const { id } = JSON.parse(saveBody.result.content[0].text)
    expect(typeof id).toBe('string')

    const get = await rpc(env, {
      jsonrpc: '2.0', id: 5, method: 'tools/call',
      params: { name: 'get_draft', arguments: { id } },
    })
    const getBody = await get.json() as any
    const draft = JSON.parse(getBody.result.content[0].text)
    expect(draft.id).toBe(id)
    expect(draft.title).toBe('T')
    expect(draft.content).toBe('# hi')
    expect(draft.platforms).toEqual(['devto'])
  })

  it('unauthorized request returns 401', async () => {
    const res = await rpc(makeEnv(), { jsonrpc: '2.0', id: 6, method: 'initialize' }, 'wrong')
    expect(res.status).toBe(401)
    const noKey = await app.request('/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'initialize' }),
    }, makeEnv())
    expect(noKey.status).toBe(401)
  })
})
