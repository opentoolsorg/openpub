import { describe, expect, it, vi } from 'vitest'
import { api } from '../apps/worker/src/api'
import type { Env } from '../apps/worker/src/types'

type Row = Record<string, unknown>

function testEnv() {
  const drafts = new Map<string, Row>()
  const sent: { draftId: string; platform: string }[] = []
  const DB = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            first: async () => {
              if (sql.includes('FROM drafts')) return drafts.get(args[0] as string) ?? null
              if (sql.includes('FROM publish_log')) return null
              return null
            },
            run: async () => {
              if (sql.startsWith('INSERT INTO drafts')) {
                const id = args[0] as string
                if (drafts.has(id)) throw new Error('duplicate id')
                drafts.set(id, { id, title: args[1], content: args[2], platforms: args[3], cover_image: args[4], status: 'draft' })
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
  const env = {
    ADMIN_KEY: 'test-key',
    DB,
    PUBLISH_QUEUE: { send: vi.fn(async (job: { draftId: string; platform: string }) => { sent.push(job) }) },
  } as unknown as Env
  const request = (path: string, method: string, body?: unknown) => api.request(path, {
    method,
    headers: { Authorization: 'Bearer test-key', 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, env)
  return { drafts, env, request, sent }
}

describe('draft and publish routes', () => {
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
