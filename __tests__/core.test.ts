import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { extractFlags } from '../src/core/argv'
import { getCreds, loadConfig, saveConfig, setCreds, storeCreds } from '../src/core/config'
import { buildFrontmatter, parseFrontmatter } from '../src/core/frontmatter'
import { devtoTag } from '../src/core/adapters/devto'
import { ghost } from '../src/core/adapters/ghost'
import { githubPages } from '../src/core/adapters/github-pages'
import { hashnode } from '../src/core/adapters/hashnode'
import { wordpress } from '../src/core/adapters/wordpress'
import { x } from '../src/core/adapters/x'
import { renderPreviewPage } from '../src/core/preview'
import { publishFile } from '../src/core/publish'
import { slugify } from '../src/core/slug'
import { hashContent, saveState, stateKey } from '../src/core/state'
import { isPublicCanonicalUrl } from '../src/core/url'
import type { PublishInput } from '../src/core/types'

const input = (over: Partial<PublishInput> = {}): PublishInput => ({
  title: 'Hello',
  markdown: 'Body text that is not empty.',
  html: '<p>Body text that is not empty.</p>',
  tags: ['alpha'],
  status: 'published',
  ...over,
})

type Call = { url: string; method: string; body?: any }
let calls: Call[]
let responder: (url: string, method: string) => Response
let home = ''
const dirs: string[] = []

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'openpub-home-'))
  dirs.push(home)
  process.env.OPENPUB_HOME = home
  calls = []
  responder = () => new Response('{}', { status: 200 })
  vi.stubGlobal('fetch', vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => {
    const method = init?.method ?? 'GET'
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    calls.push({ url: String(url), method, body })
    return responder(String(url), method)
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.OPENPUB_HOME
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function writePost(contents: string, name = 'post.md'): string {
  const dir = mkdtempSync(join(tmpdir(), 'openpub-post-'))
  dirs.push(dir)
  const file = join(dir, name)
  writeFileSync(file, contents)
  return file
}

function devtoOk(url = 'https://dev.to/u/post', id = 7) {
  responder = (urlHit, method) => {
    if (urlHit.includes('dev.to')) return new Response(JSON.stringify({ url, id }))
    if (urlHit.includes('hashnode')) {
      return new Response(JSON.stringify({ data: { publishPost: { post: { id: 'hn1', url: 'https://blog.example/p' } } } }))
    }
    if (urlHit.includes('/articles/draft') || method === 'POST' && urlHit.includes('api.x.com')) {
      return new Response(JSON.stringify({ data: { id: 'xdraft' } }))
    }
    return new Response('{}', { status: 200 })
  }
}

describe('slugs and canonical urls', () => {
  it('keeps unicode letters and gives empty slugs distinct hashes', () => {
    expect(slugify('日本語タイトル')).toBe('日本語タイトル')
    expect(slugify('Café')).toBe('cafe')
    expect(slugify('!!!')).toMatch(/^post-[0-9a-f]{8}$/)
    expect(slugify('!!!')).not.toBe(slugify('???'))
    expect([...slugify('a'.repeat(200))].length).toBeLessThanOrEqual(80)
    expect(slugify('a'.repeat(200))).not.toBe(slugify('b' + 'a'.repeat(200)))
  })

  it('rejects draft, editor, and preview urls', () => {
    expect(isPublicCanonicalUrl('https://dev.to/u/post')).toBe(true)
    expect(isPublicCanonicalUrl('https://x.com/i/articles/1')).toBe(true)
    expect(isPublicCanonicalUrl('https://x.com/compose/articles/1')).toBe(false)
    expect(isPublicCanonicalUrl('https://news.substack.com/publish/post/9')).toBe(false)
    expect(isPublicCanonicalUrl('https://hashnode.com/draft/abc')).toBe(false)
    expect(isPublicCanonicalUrl('http://example.com/post')).toBe(false)
    expect(isPublicCanonicalUrl('https://blog.example/p?preview=1')).toBe(false)
  })
})

describe('frontmatter', () => {
  it('reads yaml block lists for tags and platforms', () => {
    const { data } = parseFrontmatter(`---
title: Hello
tags:
  - alpha
  - "beta two"
platforms:
  - devto
  - hashnode
status: draft
---

Body
`)
    expect(data.tags).toEqual(['alpha', 'beta two'])
    expect(data.platforms).toEqual(['devto', 'hashnode'])
    expect(data.status).toBe('draft')
  })

  it('writes platforms and status back into the openpub block', () => {
    const fm = buildFrontmatter('openpub', {
      title: 'Hello',
      tags: ['alpha'],
      platforms: ['devto', 'hashnode'],
      status: 'draft',
      primary: 'devto',
      date: '2026-01-01T00:00:00.000Z',
    })
    const { data } = parseFrontmatter(fm + 'Body\n')
    expect(data.platforms).toEqual(['devto', 'hashnode'])
    expect(data.status).toBe('draft')
    expect(data.primary).toBe('devto')
    expect(fm).not.toContain('platforms: []')
    const hugo = buildFrontmatter('hugo', {
      title: 'Hello',
      tags: ['alpha'],
      platforms: ['devto'],
      status: 'draft',
      date: '2026-01-01T00:00:00.000Z',
    })
    expect(hugo).toContain('draft: true')
    expect(hugo).toContain('status: draft')
    expect(hugo).toContain('platforms: [devto]')
  })
})

describe('argv and credentials', () => {
  it('parses flags around the filename and rejects missing values', () => {
    expect(extractFlags(['--dry-run', 'post.md', '--to', 'devto'], [
      { name: 'dry-run', boolean: true },
      { name: 'to' },
      { name: 'status' },
    ])).toEqual({
      flags: { 'dry-run': 'true', to: 'devto' },
      rest: ['post.md'],
    })
    expect(() => extractFlags(['post.md', '--to'], [{ name: 'to' }])).toThrow('--to requires a value')
    expect(() => extractFlags(['post.md', '--status'], [{ name: 'status' }])).toThrow('--status requires a value')
    expect(() => extractFlags(['--nope', 'post.md'], [])).toThrow('unknown option --nope')
  })

  it('does not replace stored credentials with null or a string', () => {
    setCreds('devto', { api_key: 'keep' })
    expect(() => storeCreds('devto', null)).toThrow(/JSON object/)
    expect(() => storeCreds('devto', 'str')).toThrow(/JSON object/)
    expect(() => storeCreds('devto', { api_key: '' })).toThrow(/api_key/)
    expect(getCreds('devto')).toEqual({ api_key: 'keep' })
    storeCreds('devto', { api_key: 'next' })
    expect(getCreds('devto')).toEqual({ api_key: 'next' })
  })
})

describe('preview', () => {
  it('escapes the title and raw html', async () => {
    const page = await renderPreviewPage('<img src=x onerror=alert(1)>', '<script>alert(1)</script>\n\n# Hi\n')
    expect(page).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(page).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(page).not.toContain('<script>')
    expect(page).toContain('<h1>')
  })
})

describe('publishFile', () => {
  it('defaults to draft and does not copy an x compose url', async () => {
    setCreds('x', { access_token: 'tok' })
    setCreds('devto', { api_key: 'k' })
    devtoOk()
    const file = writePost(`---
title: Hello
platforms: [x, devto]
---

Body text that is not empty.
`)
    const report = await publishFile(file)
    const dev = calls.find(c => c.url.includes('dev.to'))
    expect(dev?.body.article.published).toBe(false)
    expect(dev?.body.article.canonical_url).toBeUndefined()
    expect(report.canonical).toBeUndefined()
    expect(calls.some(c => c.url.includes('/articles/') && c.url.endsWith('/publish'))).toBe(false)
  })

  it('uses a public published url as the canonical for the next platform', async () => {
    setCreds('devto', { api_key: 'k' })
    setCreds('hashnode', { token: 't', publication_id: 'pub' })
    devtoOk('https://dev.to/u/hello', 4)
    const file = writePost(`---
title: Hello
status: published
platforms: [devto, hashnode]
---

Body text that is not empty.
`)
    const report = await publishFile(file)
    const hn = calls.find(c => c.url.includes('hashnode'))
    expect(hn?.body.query).toContain('publishPost')
    expect(hn?.body.variables.input.publishAs).toBeUndefined()
    expect(hn?.body.variables.input.originalArticleURL).toBe('https://dev.to/u/hello')
    expect(report.canonical).toBe('https://dev.to/u/hello')
  })

  it('ignores a private canonical from frontmatter', async () => {
    setCreds('devto', { api_key: 'k' })
    devtoOk()
    const file = writePost(`---
title: Hello
status: published
canonical_url: https://x.com/compose/articles/abc
platforms: [devto]
---

Body text that is not empty.
`)
    const report = await publishFile(file)
    expect(calls[0].body.article.canonical_url).toBeUndefined()
    expect(report.warnings?.[0]).toMatch(/non-public/)
    expect(report.canonical).toBe('https://dev.to/u/post')
  })

  it('republishes a title change and updates dev.to in place', async () => {
    setCreds('devto', { api_key: 'k' })
    devtoOk()
    const file = writePost(`---
title: Hello
status: published
platforms: [devto]
tags: [alpha]
---

Body text that is not empty.
`)
    await publishFile(file)
    writeFileSync(file, readFileSync(file, 'utf8').replace('title: Hello', 'title: Hello again'))
    calls.length = 0
    const report = await publishFile(file)
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('PUT')
    expect(calls[0].url).toBe('https://dev.to/api/articles/7')
    expect(calls[0].body.article.title).toBe('Hello again')
    expect(report.outcomes[0].ok).toBe(true)
    expect(report.outcomes[0].skipped).toBeUndefined()
  })

  it('skips a second publish when nothing changed', async () => {
    setCreds('devto', { api_key: 'k' })
    devtoOk()
    const file = writePost(`---
title: Hello
status: published
platforms: [devto]
---

Body text that is not empty.
`)
    await publishFile(file)
    calls.length = 0
    const report = await publishFile(file)
    expect(calls).toHaveLength(0)
    expect(report.outcomes[0].skipped).toBe(true)
  })

  it('sends yaml block tags', async () => {
    setCreds('devto', { api_key: 'k' })
    devtoOk()
    const file = writePost(`---
title: Hello
status: published
tags:
  - alpha
  - beta
platforms: [devto]
---

Body text that is not empty.
`)
    await publishFile(file)
    expect(calls[0].body.article.tags).toEqual(['alpha', 'beta'])
  })

  it('honors defaults.status and refuses empty posts', async () => {
    setCreds('devto', { api_key: 'k' })
    const cfg = loadConfig()
    cfg.defaults = { status: 'published' }
    saveConfig(cfg)
    devtoOk()
    const file = writePost(`---
title: Hello
platforms: [devto]
---

Body text that is not empty.
`)
    await publishFile(file)
    expect(calls[0].body.article.published).toBe(true)
    const empty = writePost('---\ntitle: Hello\nplatforms: [devto]\n---\n\n   \n')
    await expect(publishFile(empty)).rejects.toThrow(/body is empty/)
    const untitled = writePost('---\ntitle: "   "\nplatforms: [devto]\n---\n\nBody text\n')
    await expect(publishFile(untitled)).rejects.toThrow(/title is empty/)
  })

  it('skips a legacy edit that has no remote id instead of posting again', async () => {
    setCreds('devto', { api_key: 'k' })
    devtoOk()
    const file = writePost(`---
title: Hello
status: published
platforms: [devto]
---

Body text that is not empty.
`)
    const { body } = parseFrontmatter(readFileSync(file, 'utf8'))
    saveState({
      published: {
        [stateKey(resolve(file), 'devto')]: { hash: hashContent(body), url: 'https://dev.to/old', at: 1 },
      },
    })
    const unchanged = await publishFile(file)
    expect(unchanged.outcomes[0].skipped).toBe(true)
    expect(calls).toHaveLength(0)
    writeFileSync(file, readFileSync(file, 'utf8') + '\nMore body.\n')
    const edited = await publishFile(file)
    expect(calls).toHaveLength(0)
    expect(edited.outcomes[0].warning).toMatch(/remote ids/)
  })

  it('skips medium, substack, and x edits', async () => {
    setCreds('medium', { integration_token: 'm' })
    responder = u => u.endsWith('/me')
      ? new Response(JSON.stringify({ data: { id: 'user' } }))
      : new Response(JSON.stringify({ data: { url: 'https://medium.com/p/1', id: 'post1' } }))
    const file = writePost(`---
title: Hello
status: published
platforms: [medium]
---

Body text that is not empty.
`)
    await publishFile(file)
    const before = calls.length
    writeFileSync(file, readFileSync(file, 'utf8').replace('title: Hello', 'title: Changed'))
    const report = await publishFile(file)
    expect(calls).toHaveLength(before)
    expect(report.outcomes[0].warning).toMatch(/cannot edit/)
    expect(report.outcomes[0].skipped).toBe(true)
  })

  it('rejects a dev.to title over 128 characters before the request', async () => {
    setCreds('devto', { api_key: 'k' })
    devtoOk()
    const file = writePost(`---
title: "${'a'.repeat(129)}"
status: published
platforms: [devto]
---

Body text that is not empty.
`)
    const report = await publishFile(file)
    expect(calls).toHaveLength(0)
    expect(report.outcomes[0].ok).toBe(false)
    expect(report.outcomes[0].error).toMatch(/maximum is 128/)
  })
})

describe('platform adapters', () => {
  it('maps dev.to tags without dropping letters', () => {
    expect(devtoTag('C++')).toBe('cpp')
    expect(devtoTag('c#')).toBe('csharp')
    expect(devtoTag('日本語')).toBe('日本語')
    expect(devtoTag('café')).toBe('cafe')
  })

  it('creates a hashnode draft without publishPost', async () => {
    responder = () => new Response(JSON.stringify({ data: { createDraft: { draft: { id: 'd1' } } } }))
    const result = await hashnode.publish(input({ status: 'draft' }), { token: 't', publication_id: 'pub' })
    expect(calls[0].body.query).toContain('createDraft')
    expect(calls[0].body.query).not.toContain('publishPost')
    expect(JSON.stringify(calls[0].body)).not.toContain('publishAs')
    expect(result).toEqual({ url: 'https://hashnode.com/draft/d1', id: 'd1' })
  })

  it('updates a live hashnode post in place', async () => {
    responder = () => new Response(JSON.stringify({ data: { updatePost: { post: { id: 'p1', url: 'https://blog.example/p' } } } }))
    await hashnode.publish(input({ remoteId: 'p1', remoteStatus: 'published' }), { token: 't', publication_id: 'pub' })
    expect(calls[0].body.query).toContain('updatePost')
    expect(calls[0].body.variables.input.id).toBe('p1')
    expect(calls[0].method).toBe('POST')
  })

  it('updates ghost and wordpress posts by stored id', async () => {
    const admin_key = 'kid123:' + 'ab'.repeat(32)
    responder = (url, method) => {
      if (method === 'GET') return new Response(JSON.stringify({ posts: [{ updated_at: '2020-01-01T00:00:00.000Z' }] }))
      if (url.includes('wp-json')) return new Response(JSON.stringify({ link: 'https://wp.example/p', id: 11 }))
      return new Response(JSON.stringify({ posts: [{ url: 'https://g.example/p/', id: 'g1' }] }))
    }
    await ghost.publish(input({ remoteId: 'abc123' }), { site_url: 'https://g.example', admin_key })
    const put = calls.find(c => c.method === 'PUT')
    expect(put?.url).toBe('https://g.example/ghost/api/admin/posts/abc123/?source=html')
    expect(put?.body.posts[0].updated_at).toBe('2020-01-01T00:00:00.000Z')
    await wordpress.publish(input({ remoteId: '11' }), {
      site_url: 'https://wp.example',
      username: 'u',
      app_password: 'p',
    })
    expect(calls.some(c => c.method === 'POST' && c.url === 'https://wp.example/wp-json/wp/v2/posts/11')).toBe(true)
  })

  it('keeps fenced lines literal in x articles', async () => {
    responder = () => new Response(JSON.stringify({ data: { id: 'draft1' } }))
    await x.publish(input({
      status: 'draft',
      markdown: 'Intro\n\n```\n# comment\n- x\n```\n\n- real\n',
    }), { access_token: 'tok' })
    const blocks = calls[0].body.content_state.blocks as { text: string; type: string }[]
    expect(blocks.map(b => [b.type, b.text])).toEqual([
      ['unstyled', 'Intro'],
      ['code-block', '# comment'],
      ['code-block', '- x'],
      ['unordered-list-item', 'real'],
    ])
  })

  it('rejects an x title over 250 characters', async () => {
    await expect(x.publish(input({ title: 'a'.repeat(251) }), { access_token: 'tok' })).rejects.toThrow(/maximum is 250/)
    expect(calls).toHaveLength(0)
  })

  it('writes unicode github pages filenames and caps the length', async () => {
    responder = (_u, method) => method === 'GET' ? new Response('missing', { status: 404 }) : new Response('{}', { status: 201 })
    const ja = await githubPages.publish(input({ title: '日本語' }), { token: 't', repo: 'o/r' })
    expect(ja.id).toBe('content/posts/日本語.md')
    expect(ja.url).toContain(encodeURIComponent('日本語'))
    expect(ja.url).not.toContain('/posts/.md')
    calls.length = 0
    const bang = await githubPages.publish(input({ title: '!!!' }), { token: 't', repo: 'o/r' })
    const other = await githubPages.publish(input({ title: '???' }), { token: 't', repo: 'o/r' })
    expect(bang.id).not.toBe(other.id)
    expect(bang.id).not.toBe('content/posts/.md')
    const long = await githubPages.publish(input({ title: 'a'.repeat(200), remoteId: undefined }), { token: 't', repo: 'o/r' })
    const slug = long.id!.split('/').pop()!.replace(/\.md$/, '')
    expect([...slug].length).toBeLessThanOrEqual(80)
    calls.length = 0
    await githubPages.publish(input({ title: 'Renamed', remoteId: 'content/posts/日本語.md' }), { token: 't', repo: 'o/r' })
    expect(calls[0].url).toContain(encodeURIComponent('日本語'))
  })
})
