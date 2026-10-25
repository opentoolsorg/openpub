import { describe, expect, it, vi } from 'vitest'
import { api } from '../apps/worker/src/api'
import type { Env } from '../apps/worker/src/types'

type Row = Record<string, unknown>

function testEnv() {
  const drafts = new Map<string, Row>()
  const log = new Map<string, Row>()
  const sent: { draftId: string; platform: string }[] = []
  const DB = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            first: async () => {
              if (sql.includes('FROM drafts')) return drafts.get(args[0] as string) ?? null
              if (sql.includes('FROM publish_log')) {
                const row = log.get(`${args[0]}:${args[1]}`)
                return row?.status === 'success' ? { url: row.url } : null
              }
              return null
            },
            run: async () => {
              if (sql.startsWith('INSERT INTO drafts')) {
                const id = args[0] as string
                if (drafts.has(id)) throw new Error('duplicate id')
                drafts.set(id, { id, title: args[1], content: args[2], platforms: args[3], cover_image: args[4], status: 'draft' })
              } else if (sql.startsWith("UPDATE publish_log SET status = 'retryable'")) {
                const row = log.get(`${args[0]}:${args[1]}`)
                if (row?.status === 'failed') row.status = 'retryable'
              } else if (sql.startsWith('INSERT OR IGNORE INTO publish_log')) {
                const key = `${args[1]}:${args[2]}`
                if (log.has(key)) return { meta: { changes: 0 } }
                log.set(key, { id: args[0], draft_id: args[1], platform: args[2], status: 'queued', attempts: 0 })
              } else if (sql.startsWith("DELETE FROM publish_log")) {
                const key = `${args[0]}:${args[1]}`
                if (log.get(key)?.status === 'queued') log.delete(key)
              } else if (sql.startsWith('UPDATE drafts SET status')) {
                const row = drafts.get(args[1] as string)
                if (row) row.status = args[0]
              } else if (sql.startsWith('UPDATE drafts SET title')) {
                const row = drafts.get(args[4] as string)
                if (row) Object.assign(row, { title: args[0], content: args[1], platforms: args[2], cover_image: args[3] })
              }
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  } as unknown as D1Database
  const send = vi.fn(async (job: { draftId: string; platform: string }) => { sent.push(job) })
  const env = {
    ADMIN_KEY: 'test-key',
    DB,
    PUBLISH_QUEUE: { send },
  } as unknown as Env
  const request = (path: string, method: string, body?: unknown) => api.request(path, {
    method,
    headers: { Authorization: 'Bearer test-key', 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, env)
  return { drafts, log, env, request, sent, send }
}

describe('history retry route', () => {
  it.each(['failed', 'retryable', 'queued', 'publishing', 'pending', 'success', undefined])('preserves retry and queue decisions for %s rows', async (status) => {
    const { request, log, drafts, send, sent } = testEnv()
    await request('/drafts', 'POST', { id: 'd1', content: 'post', platforms: ['devto'] })
    const row = { draft_id: 'd1', platform: 'devto', status, url: 'https://dev.to/post', error: 'old error', attempts: 3, created_at: 123 }
    if (status) log.set('d1:devto', { ...row })
    log.set('d2:devto', { ...row, draft_id: 'd2', status: 'failed' })
    log.set('d1:hashnode', { ...row, platform: 'hashnode', status: 'failed' })
    send.mockImplementationOnce(async (job) => {
      expect(log.get('d1:devto')?.status).toBe(status === 'failed' ? 'retryable' : status ?? 'queued')
      sent.push(job)
    })

    const response = await request('/history/d1/devto/retry', 'POST')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ jobs: status === 'success' ? [] : ['devto'] })
    expect(sent).toEqual(status === 'success' ? [] : [{ draftId: 'd1', platform: 'devto' }])
    if (status) expect(log.get('d1:devto')).toEqual({ ...row, status: status === 'failed' ? 'retryable' : status })
    else expect(log.get('d1:devto')).toMatchObject({ status: 'queued', attempts: 0 })
    expect(log.get('d2:devto')?.status).toBe('failed')
    expect(log.get('d1:hashnode')?.status).toBe('failed')
    expect(drafts.get('d1')?.status).toBe(status === 'success' ? 'draft' : 'queued')
  })

  it('rejects unknown, missing, and unselected targets before writing or sending', async () => {
    const { request, log, sent } = testEnv()
    await request('/drafts', 'POST', { id: 'd1', content: 'post', platforms: ['devto'] })
    log.set('d1:hashnode', { status: 'failed' })
    for (const [path, status, error] of [
      ['/history/d1/constructor/retry', 400, 'unknown platform constructor'],
      ['/history/missing/devto/retry', 404, 'not found'],
      ['/history/d1/hashnode/retry', 400, 'hashnode not in draft platforms'],
    ] as const) {
      const response = await request(path, 'POST')
      expect(response.status).toBe(status)
      expect(await response.json()).toEqual({ error })
    }
    expect(log.get('d1:hashnode')).toEqual({ status: 'failed' })
    expect(sent).toEqual([])
  })

  it('keeps a failed row retryable and restores draft status when queue send fails', async () => {
    const { request, log, drafts, env } = testEnv()
    await request('/drafts', 'POST', { id: 'd1', content: 'post', platforms: ['devto'] })
    drafts.get('d1')!.status = 'partial'
    log.set('d1:devto', { status: 'failed', attempts: 3, error: 'old error' })
    vi.mocked(env.PUBLISH_QUEUE.send).mockRejectedValueOnce(new Error('queue unavailable'))
    const response = await request('/history/d1/devto/retry', 'POST')
    expect(response.status).toBe(500)
    expect(log.get('d1:devto')).toEqual({ status: 'retryable', attempts: 3, error: 'old error' })
    expect(drafts.get('d1')?.status).toBe('partial')
  })
})

describe('draft and publish routes', () => {
  it('previews CRLF frontmatter without rendering YAML and gives stored title and cover precedence', async () => {
    const { request, drafts } = testEnv()
    const content = '---\r\ntitle: Markdown title\r\ntags:\r\n  - alpha\r\n  - "beta two"\r\ncover_image: https://fm.example/cover.png\r\n---\r\n# Heading fallback\r\n\r\nBody'
    await request('/drafts', 'POST', {
      id: 'preview1', title: 'Stored title', content, platforms: ['devto'],
      cover_image: 'https://stored.example/cover.png',
    })
    drafts.get('preview1')!.canonical_url = 'https://stored.example/post'
    const response = await request('/drafts/preview1/preview', 'GET')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      title: 'Stored title',
      html: '<h1>Heading fallback</h1>\n<p>Body</p>\n',
      frontmatter: {
        title: 'Stored title', tags: ['alpha', 'beta two'],
        cover_image: 'https://stored.example/cover.png', canonical_url: 'https://stored.example/post',
      },
    })
  })

  it('rejects invalid draft bodies and platform fields', async () => {
    const { request } = testEnv()
    expect((await request('/drafts', 'POST', null)).status).toBe(400)
    expect((await request('/drafts', 'POST', { content: 'post', platforms: 'devto' })).status).toBe(400)
    expect((await request('/drafts', 'POST', { content: 'post', platforms: ['devto'] })).status).toBe(200)
    expect((await request('/drafts/1', 'PUT', { content: null })).status).toBe(400)
    expect((await request('/drafts/1', 'PUT', { platforms: 'devto' })).status).toBe(400)
  })

  it('does not let POST overwrite a draft with a reused id', async () => {
    const { request } = testEnv()
    await request('/drafts', 'POST', { id: 'fixed', content: 'first', platforms: ['devto'] })
    const response = await request('/drafts', 'POST', { id: 'fixed', content: 'second', platforms: ['hashnode'] })
    expect(response.status).toBe(409)
  })

  it('clears optional draft fields and preserves saved targets on subset publish', async () => {
    const { drafts, request, sent } = testEnv()
    await request('/drafts', 'POST', { id: 'd1', title: 'title', content: 'post', platforms: ['devto', 'hashnode'], cover_image: 'https://example.com/cover.png' })
    const cleared = await request('/drafts/d1', 'PUT', { title: null, cover_image: null })
    expect(cleared.status).toBe(200)
    expect(drafts.get('d1')).toMatchObject({ title: null, cover_image: null })

    const published = await request('/publish', 'POST', { draftId: 'd1', platforms: ['devto'] })
    expect(published.status).toBe(200)
    expect(drafts.get('d1')?.platforms).toBe(JSON.stringify(['devto', 'hashnode']))
    expect(sent).toEqual([{ draftId: 'd1', platform: 'devto' }])
  })
})
