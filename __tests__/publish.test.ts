import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { enqueuePublish, publishConsumer } from '../apps/worker/src/publish'
import { adapters } from '../apps/worker/src/platforms'
import type { Env, PlatformName } from '../apps/worker/src/types'

type Row = Record<string, unknown>

// In-memory D1 double: dispatches on SQL text, covers every statement in db.ts.
function fakeD1() {
  const drafts = new Map<string, Row>()
  const log = new Map<string, Row>()
  const cfg = new Map<string, Row>()
  const stmt = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      run: async () => {
        if (sql.startsWith('UPDATE drafts')) {
          const r = drafts.get((sql.includes('SET title =') ? args[4] : args[1]) as string)
          if (!r) return {}
          if (sql.includes('status')) r.status = args[0]
          else if (sql.includes('canonical_url') && r.canonical_url == null) r.canonical_url = args[0]
          else if (sql.includes('SET title =')) [r.title, r.content, r.platforms, r.cover_image] = args.slice(0, 4)
        } else if (sql.startsWith('INSERT OR IGNORE INTO publish_log')) {
          // claimPublish: (id, draft_id, platform)
          const k = `${args[1]}:${args[2]}`
          if (log.has(k)) return { meta: { changes: 0 } }
          log.set(k, { id: args[0], draft_id: args[1], platform: args[2], status: sql.includes("'queued'") ? 'queued' : 'publishing', attempts: 0, created_at: Math.floor(Date.now() / 1000) })
          return { meta: { changes: 1 } }
        } else if (sql.startsWith('INSERT INTO publish_log')) {
          const k = `${args[1]}:${args[2]}`
          const cur = log.get(k)
          if (!cur) log.set(k, { id: args[0], draft_id: args[1], platform: args[2], status: 'queued', attempts: 0, created_at: Math.floor(Date.now() / 1000) })
          else if (cur.status !== 'success' && cur.status !== 'publishing') log.set(k, { ...cur, status: 'queued', url: null, error: null })
        } else if (sql.startsWith('UPDATE publish_log SET status = \'queued\'')) {
          const cur = log.get(`${args[1]}:${args[2]}`)
          if (cur && cur.status !== 'success' && cur.status !== 'publishing') log.set(`${args[1]}:${args[2]}`, { ...cur, status: 'queued', url: null, error: null })
        } else if (sql.startsWith('UPDATE publish_log')) {
          if (sql.includes('unixepoch()')) {
            // claimPublish reclaim: (draft_id, platform, staleCutoff)
            const k = `${args[0]}:${args[1]}`
            const cur = log.get(k)
            const stale = (cur?.created_at as number ?? 0) < (args[2] as number)
            if (cur && (cur.status === 'queued' || cur.status === 'retryable' || (cur.status === 'publishing' && stale))) {
              log.set(k, { ...cur, status: 'publishing', created_at: Math.floor(Date.now() / 1000) })
              return { meta: { changes: 1 } }
            }
            return { meta: { changes: 0 } }
          }
          // finishPublish: (status, url, error, draft_id, platform)
          const k = `${args[3]}:${args[4]}`
          const prev = log.get(k)
          if (!prev) return { meta: { changes: 0 } }
          log.set(k, { ...prev, status: args[0], url: args[1], error: args[2], attempts: (prev.attempts as number) + 1 })
          return { meta: { changes: 1 } }
        } else if (sql.startsWith('DELETE FROM publish_log')) {
          const k = `${args[0]}:${args[1]}`
          if (sql.includes("status = 'queued'")) {
            if (log.get(k)?.status === 'queued') log.delete(k)
          } else log.delete(k)
        } else if (sql.includes('publish_log')) {
          // upsertLog: (id, draft_id, platform, status, url, error)
          const k = `${args[1]}:${args[2]}`
          const prev = log.get(k)
          log.set(k, {
            id: args[0], draft_id: args[1], platform: args[2], status: args[3],
            url: args[4], error: args[5], attempts: (prev?.attempts as number ?? 0) + 1, created_at: 0,
          })
        } else if (sql.includes('platform_config')) {
          cfg.set(args[0] as string, { platform: args[0], credentials: args[1], enabled: 1 })
        } else if (sql.startsWith('INSERT INTO drafts')) {
          drafts.set(args[0] as string, {
            id: args[0], title: args[1], content: args[2], platforms: args[3],
            cover_image: args[4], canonical_url: null, status: 'draft', created_at: 0,
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
    PUBLISH_QUEUE: { send: vi.fn(async (m: { draftId: string; platform: string }) => void sent.push(m)) },
  } as unknown as Env
  return { env, sent }
}

type Msg = { body: { draftId: string; platform: PlatformName }; ack: Mock; retry: Mock }
const batch = (...msgs: { draftId: string; platform: PlatformName }[]) =>
  ({ messages: msgs.map(body => ({ body, ack: vi.fn(), retry: vi.fn() })) } as { messages: Msg[] })

const seed = async (d1: ReturnType<typeof fakeD1>, platforms: string[], content = '# post') => {
  const { createDraft } = await import('../apps/worker/src/db')
  await createDraft(d1.db, { id: 'd1', title: 'T', content, platforms })
}

vi.stubGlobal('fetch', vi.fn())

describe('enqueuePublish', () => {
  it('sends one queue message per platform', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto', 'hashnode'])
    const { env, sent } = makeEnv(d1)
    const jobs = await enqueuePublish(env, 'd1')
    expect(jobs.sort()).toEqual(['devto', 'hashnode'])
    expect(sent).toEqual([
      { draftId: 'd1', platform: 'devto' },
      { draftId: 'd1', platform: 'hashnode' },
    ])
    expect(d1.drafts.get('d1')!.status).toBe('queued')
  })

  it('skips already-published platforms (idempotent)', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto', 'hashnode'])
    d1.log.set('d1:devto', { draft_id: 'd1', platform: 'devto', status: 'success', url: 'https://dev.to/x', attempts: 1 })
    const { env, sent } = makeEnv(d1)
    const jobs = await enqueuePublish(env, 'd1')
    expect(jobs).toEqual(['hashnode'])
    expect(sent).toEqual([{ draftId: 'd1', platform: 'hashnode' }])
  })

  it('throws when draft missing', async () => {
    const d1 = fakeD1()
    const { env } = makeEnv(d1)
    await expect(enqueuePublish(env, 'nope')).rejects.toThrow('draft not found')
  })

  it('enqueues only specified platforms when allowlist passed', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto', 'hashnode', 'x'])
    const { env, sent } = makeEnv(d1)
    const jobs = await enqueuePublish(env, 'd1', ['devto', 'hashnode'])
    expect(jobs.sort()).toEqual(['devto', 'hashnode'])
    expect(sent).toEqual([
      { draftId: 'd1', platform: 'devto' },
      { draftId: 'd1', platform: 'hashnode' },
    ])
  })

  it('rejects platforms not in draft platforms', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto'])
    const { env } = makeEnv(d1)
    await expect(enqueuePublish(env, 'd1', ['hashnode'])).rejects.toThrow('hashnode not in draft platforms')
  })

  it('ignores inherited adapter properties from stored draft targets', async () => {
    const d1 = fakeD1()
    await seed(d1, ['constructor'])
    const { env, sent } = makeEnv(d1)
    await expect(enqueuePublish(env, 'd1')).resolves.toEqual([])
    expect(sent).toEqual([])
  })
})

describe('publishConsumer', () => {
  const credsFor = (p: string) => (p === 'devto' ? { api_key: 'k' } : { token: 't' })

  it('does not publish a queued platform removed from the draft', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto'])
    const { env } = makeEnv(d1)
    d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify(credsFor('devto')), enabled: 1 })
    await enqueuePublish(env, 'd1')
    const { updateDraft } = await import('../apps/worker/src/db')
    await updateDraft(d1.db, 'd1', { platforms: [] })
    const pub = vi.spyOn(adapters.devto, 'publish').mockResolvedValue({ url: 'https://dev.to/a' })
    const b = batch({ draftId: 'd1', platform: 'devto' })
    await publishConsumer(b as never, env)
    expect(pub).not.toHaveBeenCalled()
    expect(d1.log.get('d1:devto')).toMatchObject({ status: 'failed', error: 'platform no longer selected' })
    expect(b.messages[0].ack).toHaveBeenCalled()
    pub.mockRestore()
  })

  it('publishes, logs success, acks; skips already-published', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto'])
    const { env } = makeEnv(d1)
    d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify(credsFor('devto')), enabled: 1 })
    const pub = vi.spyOn(adapters.devto, 'publish').mockResolvedValue({ url: 'https://dev.to/a' })
    const b = batch({ draftId: 'd1', platform: 'devto' })
    await publishConsumer(b as never, env)
    expect(pub).toHaveBeenCalledOnce()
    expect(d1.log.get('d1:devto')).toMatchObject({ status: 'success', url: 'https://dev.to/a' })
    expect(b.messages[0].ack).toHaveBeenCalled()
    // second delivery: already-published → ack, no publish call
    const b2 = batch({ draftId: 'd1', platform: 'devto' })
    await publishConsumer(b2 as never, env)
    expect(pub).toHaveBeenCalledOnce()
    expect(b2.messages[0].ack).toHaveBeenCalled()
    pub.mockRestore()
  })

  it('finishes subset publishing as partial without waiting for unselected platforms', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto', 'hashnode', 'x'])
    const { env } = makeEnv(d1)
    d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify(credsFor('devto')), enabled: 1 })
    const spy = vi.spyOn(adapters.devto, 'publish').mockResolvedValue({ url: 'https://dev.to/a' })
    await enqueuePublish(env, 'd1', ['devto'])
    await publishConsumer(batch({ draftId: 'd1', platform: 'devto' }) as never, env)
    expect(d1.drafts.get('d1')!.status).toBe('partial')
    spy.mockRestore()
  })

  it('keeps full publish queued until every queued platform finishes', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto', 'hashnode'])
    const { env } = makeEnv(d1)
    d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify(credsFor('devto')), enabled: 1 })
    d1.cfg.set('hashnode', { platform: 'hashnode', credentials: JSON.stringify(credsFor('hashnode')), enabled: 1 })
    const devto = vi.spyOn(adapters.devto, 'publish').mockResolvedValue({ url: 'https://dev.to/a' })
    const hashnode = vi.spyOn(adapters.hashnode, 'publish').mockResolvedValue({ url: 'https://hashnode.com/a' })
    await enqueuePublish(env, 'd1')
    await publishConsumer(batch({ draftId: 'd1', platform: 'devto' }) as never, env)
    expect(d1.drafts.get('d1')!.status).toBe('queued')
    await publishConsumer(batch({ draftId: 'd1', platform: 'hashnode' }) as never, env)
    expect(d1.drafts.get('d1')!.status).toBe('published')
    devto.mockRestore(); hashnode.mockRestore()
  })

  it('first success url becomes canonical_url for subsequent platforms', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto', 'hashnode'])
    const { env } = makeEnv(d1)
    for (const p of ['devto', 'hashnode'])
      d1.cfg.set(p, { platform: p, credentials: JSON.stringify(credsFor(p)), enabled: 1 })
    const devSpy = vi.spyOn(adapters.devto, 'publish').mockResolvedValue({ url: 'https://dev.to/first' })
    const hnSpy = vi.spyOn(adapters.hashnode, 'publish').mockResolvedValue({ url: 'https://hn.dev/second' })
    await publishConsumer(batch({ draftId: 'd1', platform: 'devto' }) as never, env)
    expect(d1.drafts.get('d1')!.canonical_url).toBe('https://dev.to/first')
    await publishConsumer(batch({ draftId: 'd1', platform: 'hashnode' }) as never, env)
    // hashnode adapter received canonicalUrl from first success
    expect(hnSpy.mock.calls[0][0].canonicalUrl).toBe('https://dev.to/first')
    expect(d1.drafts.get('d1')!.canonical_url).toBe('https://dev.to/first')
    devSpy.mockRestore(); hnSpy.mockRestore()
  })

  it('does not overwrite an existing canonical_url', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto'])
    d1.drafts.get('d1')!.canonical_url = 'https://own.blog/orig'
    const { env } = makeEnv(d1)
    d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify(credsFor('devto')), enabled: 1 })
    const spy = vi.spyOn(adapters.devto, 'publish').mockResolvedValue({ url: 'https://dev.to/x' })
    await publishConsumer(batch({ draftId: 'd1', platform: 'devto' }) as never, env)
    expect(spy.mock.calls[0][0].canonicalUrl).toBe('https://own.blog/orig')
    expect(d1.drafts.get('d1')!.canonical_url).toBe('https://own.blog/orig')
    spy.mockRestore()
  })

  it('logs failure and retries when adapter throws', async () => {
    const d1 = fakeD1()
    await seed(d1, ['devto'])
    const { env } = makeEnv(d1)
    d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify(credsFor('devto')), enabled: 1 })
    const spy = vi.spyOn(adapters.devto, 'publish').mockRejectedValue(new Error('boom'))
    const b = batch({ draftId: 'd1', platform: 'devto' })
    await publishConsumer(b as never, env)
    expect(d1.log.get('d1:devto')).toMatchObject({ status: 'retryable', error: 'boom' })
    expect(b.messages[0].retry).toHaveBeenCalled()
    expect(b.messages[0].ack).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('extractTags (via publishConsumer input)', () => {
  const tagsFor = async (content: string) => {
    const d1 = fakeD1()
    await seed(d1, ['devto'], content)
    const { env } = makeEnv(d1)
    d1.cfg.set('devto', { platform: 'devto', credentials: JSON.stringify({ api_key: 'k' }), enabled: 1 })
    const spy = vi.spyOn(adapters.devto, 'publish').mockResolvedValue({ url: 'u' })
    await publishConsumer(batch({ draftId: 'd1', platform: 'devto' }) as never, env)
    const tags = spy.mock.calls[0][0].tags
    spy.mockRestore()
    return tags
  }

  it('parses frontmatter tags array', async () => {
    expect(await tagsFor('---\ntitle: x\ntags: [alpha, "beta two", \'gamma\']\n---\n\nbody'))
      .toEqual(['alpha', 'beta two', 'gamma'])
  })

  it('returns [] without frontmatter', async () => {
    expect(await tagsFor('just a body')).toEqual([])
  })

  it('caps at 6 tags', async () => {
    expect(await tagsFor('---\ntags: [a, b, c, d, e, f, g, h]\n---\nbody'))
      .toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })
})
