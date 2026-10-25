import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { preparePost, publishPost } from '@openpub/core'
import { publishFile } from '@openpub/core/publish'
import { storeCreds } from '@openpub/core/config'
import { callTool } from '../apps/mcp/handlers'

const dirs: string[] = []
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const post = { title: 'Shared pipeline', markdown: '# Hello\n\nBody.', tags: ['test'], status: 'draft' as const }

describe('runtime-neutral publish pipeline', () => {
  it('renders without mutating input and drops private canonical URLs', async () => {
    const source = { ...post, canonicalUrl: 'http://localhost/admin' }
    const prepared = await preparePost(source)
    expect(prepared.html).toContain('<h1>Hello</h1>')
    expect(prepared.canonicalUrl).toBeUndefined()
    expect(source.canonicalUrl).toBe('http://localhost/admin')
  })

  it('preserves an already extracted body that begins with Markdown separators', async () => {
    const markdown = '---\nAn article section\n---\n\nBody.'
    const prepared = await preparePost({ ...post, markdown })
    expect(prepared.markdown).toBe(markdown)
    expect(prepared.html).toContain('An article section')
  })

  it('rejects empty content before dispatch', async () => {
    await expect(preparePost({ ...post, title: ' ' })).rejects.toThrow('title is empty')
    await expect(preparePost({ ...post, markdown: ' ' })).rejects.toThrow('post body is empty')
  })

  it('dispatches a prepared post through the shared draft-safe adapter', async () => {
    const fetch = vi.fn(async (_url: unknown, _init?: RequestInit) => new Response(JSON.stringify({ id: 12, url: 'https://dev.to/test/post' })))
    vi.stubGlobal('fetch', fetch)
    const result = await publishPost('devto', await preparePost(post), { api_key: 'fixture' })
    expect(result).toEqual({ id: '12', url: 'https://dev.to/test/post' })
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string).article.published).toBe(false)
  })

  it('MCP and file publisher share state and update the same remote post', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'openpub-workspace-'))
    dirs.push(dir)
    vi.stubEnv('OPENPUB_HOME', join(dir, 'home'))
    storeCreds('devto', { api_key: 'fixture' })
    const file = join(dir, 'post.md')
    writeFileSync(file, '---\ntitle: Shared pipeline\nplatforms: [devto]\n---\n\nFirst body.')
    const fetch = vi.fn(async (_url: unknown, _init?: RequestInit) => new Response(JSON.stringify({ id: 12, url: 'https://dev.to/test/post' })))
    vi.stubGlobal('fetch', fetch)
    const first = await callTool('publish', { file }) as { outcomes: { ok: boolean }[] }
    expect(first.outcomes[0].ok).toBe(true)
    const unchanged = await publishFile(file)
    expect(unchanged.outcomes[0].skipped).toBe(true)
    writeFileSync(file, '---\ntitle: Shared pipeline\nplatforms: [devto]\n---\n\nEdited body.')
    const updated = await publishFile(file)
    expect(updated.outcomes[0].ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[1][0]).toBe('https://dev.to/api/articles/12')
    expect(fetch.mock.calls[1][1]!.method).toBe('PUT')
  })
})
