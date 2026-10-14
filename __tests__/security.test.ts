import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { adapters } from '../src/platforms'
import { siteBase } from '../src/platforms/guard'
import { claimPublish, createDraft } from '../src/db'
import { publishConsumer } from '../src/publish'
import type { Env, PlatformName, PublishInput } from '../src/types'

type Row = Record<string, unknown>

function fakeD1() {
  const drafts = new Map<string, Row>()
  const log = new Map<string, Row>()
  const cfg = new Map<string, Row>()
  const stmt = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      run: async () => {
        if (sql.startsWith('UPDATE drafts')) {
          const r = drafts.get(args[1] as string)
          if (!r) return {}
          if (sql.includes('status')) r.status = args[0]
          else if (sql.includes('canonical_url') && r.canonical_url == null) r.canonical_url = args[0]
        } else if (sql.startsWith('INSERT OR IGNORE INTO publish_log')) {
          const k = `${args[1]}:${args[2]}`
          if (log.has(k)) return { meta: { changes: 0 } }
          log.set(k, {
            id: args[0],
            draft_id: args[1],
            platform: args[2],
            status: 'publishing',
            attempts: 0,
            created_at: Math.floor(Date.now() / 1000),
          })
          return { meta: { changes: 1 } }
        } else if (sql.startsWith('UPDATE publish_log')) {
          const k = `${args[3]}:${args[4]}`
          const prev = log.get(k)
          if (!prev) return { meta: { changes: 0 } }
          log.set(k, {
            ...prev,
            status: args[0],
            url: args[1],
            error: args[2],
            attempts: (prev.attempts as number) + 1,
          })
          return { meta: { changes: 1 } }
        } else if (sql.startsWith('DELETE FROM publish_log')) {
          log.delete(`${args[0]}:${args[1]}`)
        } else if (sql.includes('publish_log')) {
          const k = `${args[1]}:${args[2]}`
          const prev = log.get(k)
          log.set(k, {
            id: args[0],
            draft_id: args[1],
            platform: args[2],
            status: args[3],
            url: args[4],
            error: args[5],
            attempts: ((prev?.attempts as number) ?? 0) + 1,
            created_at: prev?.created_at ?? Math.floor(Date.now() / 1000),
          })
        } else if (sql.includes('platform_config')) {
          cfg.set(args[0] as string, { platform: args[0], credentials: args[1], enabled: 1 })
        } else if (sql.startsWith('INSERT INTO drafts')) {
          drafts.set(args[0] as string, {
            id: args[0],
            title: args[1],
            content: args[2],
            platforms: args[3],
            cover_image: args[4],
            canonical_url: null,
            status: 'draft',
            created_at: Math.floor(Date.now() / 1000),
          })
        } else if (sql.startsWith('DELETE FROM drafts')) {
          drafts.delete(args[0] as string)
        }
        return {}
      },
      first: async () => {
        if (sql.includes('FROM platform_config')) return cfg.get(args[0] as string) ?? null
        if (sql.includes('FROM publish_log')) {
          const r = log.get(`${args[0]}:${args[1]}`)
          if (!r) return null
          if (sql.includes('SELECT url')) return r.status === 'success' ? { url: r.url } : null
          return { status: r.status, created_at: r.created_at }
        }
        return drafts.get(args[0] as string) ?? null
      },
      all: async () => ({
        results: sql.includes('FROM publish_log')
          ? [...log.values()]
          : sql.includes('FROM drafts')
            ? [...drafts.values()]
            : [...cfg.values()],
      }),
    }),
  })
  return { db: { prepare: stmt } as unknown as D1Database, drafts, log, cfg }
}

function makeEnv(d1: ReturnType<typeof fakeD1>) {
  const sent: { draftId: string; platform: string }[] = []
  const env = {
    DB: d1.db,
    PUBLISH_QUEUE: {
      send: vi.fn(async (m: { draftId: string; platform: string }) => void sent.push(m)),
    },
  } as unknown as Env
  return { env, sent }
}

type Msg = { body: { draftId: string; platform: PlatformName }; ack: Mock; retry: Mock }
const batch = (...msgs: { draftId: string; platform: PlatformName }[]) =>
  ({ messages: msgs.map(body => ({ body, ack: vi.fn(), retry: vi.fn() })) } as { messages: Msg[] })

const sampleInput = (over: Partial<PublishInput> = {}): PublishInput => ({
  title: 'Hello World',
  markdown: '# Content\n\nBody here.',
  html: '<h1>Content</h1>\n<p>Body here.</p>',
  tags: ['tech', 'security'],
  canonicalUrl: 'https://canon.example/post',
  status: 'published',
  ...over,
})

type Call = { url: string; method: string; headers: Record<string, string>; body?: any }
let calls: Call[]
let responder: (url: string, method: string) => Response

const fetchMock = vi.fn(async (url: unknown, init: any) => {
  const u = String(url)
  calls.push({
    url: u,
    method: init?.method ?? 'GET',
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
  })
  return responder(u, init?.method ?? 'GET')
})
vi.stubGlobal('fetch', fetchMock)

beforeEach(() => {
  calls = []
  responder = () => new Response('{}', { status: 200 })
})

describe('Security Hardening', () => {
  describe('github-pages path and repo validation', () => {
    it('rejects dir="../../.github"', async () => {
      await expect(
        adapters['github-pages'].publish(sampleInput(), {
          repo: 'owner/repo',
          token: 'token123',
          dir: '../../.github',
        })
      ).rejects.toThrow('invalid dir or branch')
    })

    it('rejects repo="bad repo"', async () => {
      await expect(
        adapters['github-pages'].publish(sampleInput(), {
          repo: 'bad repo',
          token: 'token123',
        })
      ).rejects.toThrow('repo must be owner/name')

      expect(
        await adapters['github-pages'].test({
          repo: 'bad repo',
          token: 'token123',
        })
      ).toBe(false)
    })

    it('rejects branch with slashes-dots ".."', async () => {
      await expect(
        adapters['github-pages'].publish(sampleInput(), {
          repo: 'owner/repo',
          token: 'token123',
          branch: '..',
        })
      ).rejects.toThrow('invalid dir or branch')

      await expect(
        adapters['github-pages'].publish(sampleInput(), {
          repo: 'owner/repo',
          token: 'token123',
          branch: 'feature/../main',
        })
      ).rejects.toThrow('invalid dir or branch')
    })
  })

  describe('YAML escaping in github-pages adapter', () => {
    it('title containing double-quote and newline produces single-line quoted yaml value', async () => {
      responder = (_u, m) =>
        m === 'GET' ? new Response('x', { status: 404 }) : new Response('{}', { status: 201 })

      const r = await adapters['github-pages'].publish(
        sampleInput({
          title: 'Post with "quotes" and\nnewline\r\nhere',
        }),
        { repo: 'owner/repo', token: 'token123' }
      )

      expect(r.url).toBe('https://github.com/owner/repo/blob/main/content/posts/post-with-quotes-and-newline-here.md')
      expect(calls).toHaveLength(2)

      const putCall = calls[1]
      expect(putCall.method).toBe('PUT')

      const rawContent = decodeURIComponent(escape(atob(putCall.body.content)))
      const lines = rawContent.split('\n')

      const titleLine = lines.find(l => l.startsWith('title:'))
      expect(titleLine).toBeDefined()
      expect(titleLine).toBe('title: "Post with \\"quotes\\" and newline here"')
      expect(titleLine).toMatch(/^title: ".*"$/)
      expect(rawContent).not.toMatch(/title: [^\n]*\n[^\n]*"/)
    })
  })

  describe('claimPublish race condition', () => {
    it('returns true on first claim and false on racing second claim', async () => {
      const d1 = fakeD1()
      const first = await claimPublish(d1.db, 'claim-1', 'draft-1', 'devto')
      const second = await claimPublish(d1.db, 'claim-2', 'draft-1', 'devto')

      expect(first).toBe(true)
      expect(second).toBe(false)
    })

    it('two consumers racing same draft+platform — second returns false and publish is called once', async () => {
      const d1 = fakeD1()
      await createDraft(d1.db, { id: 'd1', title: 'Test Post', content: '# post', platforms: ['devto'] })
      d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify({ api_key: 'key' }), enabled: 1 })

      const { env } = makeEnv(d1)

      let publishCalls = 0
      const pubSpy = vi.spyOn(adapters.devto, 'publish').mockImplementation(async () => {
        publishCalls++
        await new Promise(resolve => setTimeout(resolve, 50))
        return { url: 'https://dev.to/success' }
      })

      const b1 = batch({ draftId: 'd1', platform: 'devto' })
      const b2 = batch({ draftId: 'd1', platform: 'devto' })

      await Promise.all([
        publishConsumer(b1 as never, env),
        publishConsumer(b2 as never, env),
      ])

      expect(publishCalls).toBe(1)
      expect(pubSpy).toHaveBeenCalledTimes(1)
      expect(b1.messages[0].ack).toHaveBeenCalled()
      expect(b2.messages[0].ack).toHaveBeenCalled()
      expect(b1.messages[0].retry).not.toHaveBeenCalled()
      expect(b2.messages[0].retry).not.toHaveBeenCalled()
      expect(d1.log.get('d1:devto')).toMatchObject({ status: 'success', url: 'https://dev.to/success' })

      pubSpy.mockRestore()
    })
  })

  describe('permanent vs transient error handling', () => {
    it('treats adapter "wordpress 403" style error as permanent and acks without retry', async () => {
      const d1 = fakeD1()
      await createDraft(d1.db, { id: 'd1', title: 'Test Post', content: '# post', platforms: ['devto'] })
      d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify({ api_key: 'key' }), enabled: 1 })
      const { env } = makeEnv(d1)

      const spy = vi.spyOn(adapters.devto, 'publish').mockRejectedValue(
        new Error('wordpress 403: Forbidden - bad credentials')
      )
      const b = batch({ draftId: 'd1', platform: 'devto' })

      await publishConsumer(b as never, env)

      expect(b.messages[0].ack).toHaveBeenCalled()
      expect(b.messages[0].retry).not.toHaveBeenCalled()
      expect(d1.log.get('d1:devto')).toMatchObject({
        status: 'failed',
        error: expect.stringContaining('wordpress 403'),
      })

      spy.mockRestore()
    })

    it('treats generic adapter error as transient and calls retry()', async () => {
      const d1 = fakeD1()
      await createDraft(d1.db, { id: 'd1', title: 'Test Post', content: '# post', platforms: ['devto'] })
      d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify({ api_key: 'key' }), enabled: 1 })
      const { env } = makeEnv(d1)

      const spy = vi.spyOn(adapters.devto, 'publish').mockRejectedValue(
        new Error('generic network failure: connection reset by peer')
      )
      const b = batch({ draftId: 'd1', platform: 'devto' })

      await publishConsumer(b as never, env)

      expect(b.messages[0].retry).toHaveBeenCalled()
      expect(b.messages[0].ack).not.toHaveBeenCalled()
      expect(d1.log.get('d1:devto')).toMatchObject({
        status: 'retryable',
        error: expect.stringContaining('generic network failure'),
      })

      spy.mockRestore()
    })
  })

  describe('siteBase URL security guards', () => {
    it('rejects http:// URLs', () => {
      expect(() => siteBase('http://example.com')).toThrow('site url must be https')
    })

    it('rejects localhost', () => {
      expect(() => siteBase('https://localhost')).toThrow('site url must be public')
      expect(() => siteBase('localhost')).toThrow('site url must be public')
    })

    it('rejects 127.0.0.1', () => {
      expect(() => siteBase('https://127.0.0.1')).toThrow('site url must be public')
      expect(() => siteBase('127.0.0.1')).toThrow('site url must be public')
    })

    it('rejects 169.254.x link-local addresses', () => {
      expect(() => siteBase('https://169.254.169.254')).toThrow('site url must be public')
      expect(() => siteBase('https://169.254.0.1')).toThrow('site url must be public')
    })

    it('rejects 10.x private network addresses', () => {
      expect(() => siteBase('https://10.0.0.1')).toThrow('site url must be public')
      expect(() => siteBase('https://10.255.255.255')).toThrow('site url must be public')
    })

    it('rejects [::1] IPv6 loopback', () => {
      expect(() => siteBase('https://[::1]')).toThrow('site url must be public')
      expect(() => siteBase('[::1]')).toThrow('site url must be public')
    })

    it('rejects integer IP notation', () => {
      expect(() => siteBase('https://2130706433')).toThrow('site url must be public') // 127.0.0.1
      expect(() => siteBase('https://0')).toThrow('site url must be public')
    })

    it('rejects URL with embedded user:pass', () => {
      expect(() => siteBase('https://user:pass@example.com')).toThrow('site url must not embed credentials')
      expect(() => siteBase('https://admin@example.com/wp')).toThrow('site url must not embed credentials')
    })

    it('accepts valid public https URL', () => {
      expect(siteBase('https://myblog.example.com/')).toBe('https://myblog.example.com')
      expect(siteBase('https://myblog.example.com/blog/')).toBe('https://myblog.example.com/blog')
      expect(siteBase('myblog.example.com')).toBe('https://myblog.example.com')
    })
  })
})
