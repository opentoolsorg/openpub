import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { mcpHandler } from '../apps/worker/src/mcp'
import type { Env } from '../apps/worker/src/types'

const env = {
  DB: {} as any,
  KEYS: {} as any,
  MEDIA: { put: async () => ({}) } as any,
  PUBLISH_QUEUE: { send: async () => {} } as any,
  AI: { run: async () => ({}) } as any,
  ADMIN_KEY: 'test-key',
  BASE_URL: 'https://example.test',
} as unknown as Env

const app = new Hono<{ Bindings: Env }>()
app.post('/mcp', mcpHandler)

describe('Worker MCP frontmatter formatting', () => {
  it('keeps the response keys and requested format while using the shared builder', async () => {
    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'frontmatter', arguments: { title: 'A "quoted" title', tags: ['workers', 'markdown'], format: 'hugo' } },
      }),
    }, env)
    const rpc = await response.json() as any
    const result = JSON.parse(rpc.result.content[0].text)
    expect(result.format).toBe('hugo')
    expect(result.frontmatter).toContain('title: "A \\"quoted\\" title"')
    expect(result.frontmatter).toContain('slug: "a-quoted-title"')
    expect(result.frontmatter).toContain('tags: ["workers", "markdown"]')
    expect(result.frontmatter).toContain('draft: false')
  })

  it('keeps format as a string in the exposed tool schema', async () => {
    const response = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    }, env)
    const rpc = await response.json() as any
    const tool = rpc.result.tools.find((item: any) => item.name === 'frontmatter')
    expect(tool.inputSchema.properties.format).toEqual({ type: 'string' })
    expect(tool.inputSchema.required).toEqual(['title', 'format'])
  })
})
