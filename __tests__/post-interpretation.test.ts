import { describe, expect, it } from 'vitest'
import { parseFrontmatter, parsePost, resolvePostMetadata } from '../packages/core/src/post'

describe('shared post interpretation', () => {
  it.each([
    ['canonical_url: https://first.example/post\ncanonical: https://last.example/post\ncover_image: first.png\ncover: last.png', 'https://last.example/post', 'last.png'],
    ['canonical: https://first.example/post\ncanonical_url: https://last.example/post\nimage: first.png\ncover_image: last.png', 'https://last.example/post', 'last.png'],
    ['canonical_url: https://first.example/post\ncanonical: https://second.example/post\ncanonical_url: https://last.example/post\ncover_image: first.png\ncover: second.png\ncover_image: last.png', 'https://last.example/post', 'last.png'],
  ])('keeps the last metadata alias in source order', (yaml, canonical, cover) => {
    const post = `---\n${yaml}\n---\nBody`
    const { data } = parseFrontmatter(post)
    const resolved = resolvePostMetadata(post)
    expect(data.canonical_url).toBe(canonical)
    expect(data.cover_image).toBe(cover)
    expect(resolved.canonicalUrl).toBe(canonical)
    expect(resolved.coverImage).toBe(cover)
  })
  it('preserves an explicit empty platform list instead of treating it as missing', () => {
    expect(parseFrontmatter('---\nplatforms: []\n---\nBody').data.platforms).toEqual([])
    expect(parseFrontmatter('Body').data.platforms).toBeUndefined()
  })
  it('parses CRLF frontmatter block tags and excludes frontmatter from the body', () => {
    const parsed = parsePost('---\r\ntitle: "Frontmatter title"\r\ntags:\r\n  - alpha\r\n  - "beta two"\r\n---\r\n# Heading title\r\n\r\nBody')
    expect(parsed.frontmatter).toMatchObject({ title: 'Frontmatter title', tags: ['alpha', 'beta two'] })
    expect(parsed.body).toBe('# Heading title\r\n\r\nBody')
  })

  it('keeps the core raw frontmatter field compatible with the original scalar representation', () => {
    expect(parsePost('---\ntags: [alpha, beta]\n---\nBody').raw.tags).toBe('[alpha, beta]')
  })

  it('resolves explicit stored values before frontmatter and uses heading fallback', () => {
    const markdown = '---\ntitle: Markdown title\ncover: fm.png\ncanonical: https://fm.example/post\nstatus: draft\n---\n# Heading title\n\nBody'
    expect(resolvePostMetadata(markdown, {
      title: 'Stored title', coverImage: 'stored.png', canonicalUrl: 'https://stored.example/post', status: 'published',
    })).toMatchObject({
      title: 'Stored title', coverImage: 'stored.png', canonicalUrl: 'https://stored.example/post', status: 'published',
    })
    expect(resolvePostMetadata('---\ntags: [a]\n---\n# Heading title\n\nBody').title).toBe('Heading title')
  })
})
