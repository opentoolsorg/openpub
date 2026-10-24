import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adapters } from '../src/platforms'
import type { PublishInput } from '../src/types'

const input = (over: Partial<PublishInput> = {}): PublishInput => ({
  title: 'Hello World',
  markdown: '# hi\n\nbody',
  html: '<h1>hi</h1>\n<p>body</p>',
  tags: ['alpha', 'beta'],
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

describe('devto', () => {
  it('posts to dev.to/api/articles with api-key header', async () => {
    responder = () => new Response(JSON.stringify({ url: 'https://dev.to/u/x', id: 7 }))
    const r = await adapters.devto.publish(input(), { api_key: 'DEVKEY' })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://dev.to/api/articles')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].headers['api-key']).toBe('DEVKEY')
    expect(calls[0].body.article.published).toBe(true)
    expect(calls[0].body.article.canonical_url).toBe('https://canon.example/post')
    expect(r).toEqual({ url: 'https://dev.to/u/x', id: '7' })
  })

  it('throws on non-ok response', async () => {
    responder = () => new Response('bad request', { status: 422 })
    await expect(adapters.devto.publish(input(), { api_key: 'k' })).rejects.toThrow('devto 422')
  })
})

describe('devto tag normalization', () => {
  const tagsSent = async (tags: string[]) => {
    responder = () => new Response(JSON.stringify({ url: 'u', id: 1 }))
    await adapters.devto.publish(input({ tags }), { api_key: 'k' })
    return calls[0].body.article.tags as string[]
  }

  it('lowercases, maps symbols, and keeps letters', async () => {
    expect(await tagsSent(['Hello World!', 'TS', 'C++'])).toEqual(['helloworld', 'ts', 'cpp'])
  })

  it('caps at 4 tags (slice before normalize)', async () => {
    expect(await tagsSent(['One', 'Two', 'Three', 'Four', 'Five', 'Six'])).toEqual(['one', 'two', 'three', 'four'])
  })

  it('filters tags that normalize to empty — 5th tag does not backfill', async () => {
    expect(await tagsSent(['!!!', 'a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c'])
  })
})

describe('hashnode', () => {
  it('posts to gql.hashnode.com with raw token auth', async () => {
    responder = () =>
      new Response(JSON.stringify({ data: { publishPost: { post: { id: 'p1', url: 'https://hn.dev/p1' } } } }))
    const r = await adapters.hashnode.publish(input(), { token: 'HNTOK', publication_id: 'pub1' })
    expect(calls).toHaveLength(1) // publication_id skips the me{} lookup
    expect(calls[0].url).toBe('https://gql.hashnode.com')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].headers.Authorization).toBe('HNTOK')
    const vars = calls[0].body.variables.input
    expect(vars.publicationId).toBe('pub1')
    expect(vars.contentMarkdown).toBe(input().markdown)
    expect(vars.originalArticleURL).toBe('https://canon.example/post')
    expect(vars.publishAs).toBeUndefined()
    expect(calls[0].body.query).toContain('publishPost')
    expect(r).toEqual({ url: 'https://hn.dev/p1', id: 'p1' })
  })
})

describe('medium', () => {
  it('gets /v1/me then posts with Bearer token', async () => {
    responder = u =>
      u.endsWith('/me')
        ? new Response(JSON.stringify({ data: { id: 'u9' } }))
        : new Response(JSON.stringify({ data: { url: 'https://medium.com/p/1', id: 'p1' } }))
    const r = await adapters.medium.publish(input(), { integration_token: 'MTOK' })
    expect(calls[0].url).toBe('https://api.medium.com/v1/me')
    expect(calls[0].headers.Authorization).toBe('Bearer MTOK')
    expect(calls[1].url).toBe('https://api.medium.com/v1/users/u9/posts')
    expect(calls[1].method).toBe('POST')
    expect(calls[1].headers.Authorization).toBe('Bearer MTOK')
    expect(calls[1].body.contentFormat).toBe('markdown')
    expect(calls[1].body.publishStatus).toBe('public')
    expect(calls[1].body.canonicalUrl).toBe('https://canon.example/post')
    expect(r).toEqual({ url: 'https://medium.com/p/1', id: 'p1' })
  })
})

describe('wordpress', () => {
  it('posts to wp-json with Basic auth', async () => {
    responder = () => new Response(JSON.stringify({ link: 'https://wp.example.com/p/', id: 11 }))
    const r = await adapters.wordpress.publish(input(), {
      site_url: 'https://wp.example.com/', // trailing slash stripped
      username: 'u',
      app_password: 'p',
    })
    expect(calls[0].url).toBe('https://wp.example.com/wp-json/wp/v2/posts')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].headers.Authorization).toBe('Basic ' + btoa('u:p'))
    expect(calls[0].body.status).toBe('publish')
    expect(calls[0].body.meta).toEqual({ canonical_url: 'https://canon.example/post' })
    expect(r).toEqual({ url: 'https://wp.example.com/p/', id: '11' })
  })
})

describe('ghost', () => {
  it('posts to /ghost/api/admin/posts/?source=html with Ghost JWT', async () => {
    responder = () => new Response(JSON.stringify({ posts: [{ url: 'https://g.example.com/p/', id: 'g1' }] }))
    const admin_key = 'kid123:' + 'ab'.repeat(32) // id:hexsecret
    const r = await adapters.ghost.publish(input(), { site_url: 'https://g.example.com', admin_key })
    expect(calls[0].url).toBe('https://g.example.com/ghost/api/admin/posts/?source=html')
    expect(calls[0].method).toBe('POST')
    const auth = calls[0].headers.Authorization
    expect(auth.startsWith('Ghost ')).toBe(true)
    const [header] = auth.slice(6).split('.')
    expect(JSON.parse(atob(header)).kid).toBe('kid123')
    expect(calls[0].body.posts[0].canonical_url).toBe('https://canon.example/post')
    expect(r).toEqual({ url: 'https://g.example.com/p/', id: 'g1' })
  })
})

describe('substack', () => {
  it('auths via connect.sid cookie then creates draft', async () => {
    responder = u =>
      u.includes('/user/profile/self')
        ? new Response(JSON.stringify({ id: 42 }))
        : new Response(JSON.stringify({ id: 99, slug: 'x' }))
    const r = await adapters.substack.publish(input(), {
      publication_url: 'https://ss.example.com',
      connect_sid: 'SID',
    })
    expect(calls[0].url).toBe('https://ss.example.com/api/v1/user/profile/self')
    expect(calls[0].headers.Cookie).toBe('connect.sid=SID')
    expect(calls[1].url).toBe('https://ss.example.com/api/v1/drafts')
    expect(calls[1].method).toBe('POST')
    expect(calls[1].headers.Cookie).toBe('connect.sid=SID')
    expect(calls[1].body.user_id).toBe(42)
    expect(calls[1].body.draft_title).toBe('Hello World')
    expect(r).toEqual({ url: 'https://ss.example.com/publish/post/99', id: '99' })
  })
})

describe('github-pages', () => {
  it('puts file to repos contents API with Bearer token', async () => {
    responder = (_u, m) => (m === 'GET' ? new Response('x', { status: 404 }) : new Response('{}', { status: 201 }))
    const r = await adapters['github-pages'].publish(input(), { repo: 'o/r', token: 'GHTOK' })
    expect(calls[0].url).toBe('https://api.github.com/repos/o/r/contents/content/posts/hello-world.md?ref=main')
    expect(calls[0].headers.Authorization).toBe('Bearer GHTOK')
    expect(calls[1].method).toBe('PUT')
    expect(calls[1].headers.Authorization).toBe('Bearer GHTOK')
    const md = decodeURIComponent(escape(atob(calls[1].body.content)))
    expect(md).toContain('title: "Hello World"')
    expect(md).toContain('canonical: "https://canon.example/post"')
    expect(r.url).toBe('https://github.com/o/r/blob/main/content/posts/hello-world.md')
  })
})
