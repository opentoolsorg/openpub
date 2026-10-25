import { describe, expect, it } from 'vitest'
import { auditContent, frontmatterBuildOptions } from '../packages/core/src/inspection'
import { parseFrontmatter } from '../packages/core/src/post'

describe('shared post inspection', () => {
  it.each([299, 300])('preserves the short-post boundary at %i words', words => {
    const { data } = parseFrontmatter('---\ntags: [one, two]\ncanonical: https://example.com/post\n---\n')
    const body = Array.from({ length: words }, () => 'word').join(' ')
    const result = auditContent(body, data)
    expect(result.issues.some(issue => issue.startsWith('short:'))).toBe(words < 300)
    expect(result.score).toBe(words < 300 ? 55 : 64)
  })

  it('maps canonical aliases without changing formatter defaults', () => {
    const { data } = parseFrontmatter('---\ncanonical: https://example.com/post\nplatforms: [devto]\nstatus: draft\n---\nBody')
    expect(frontmatterBuildOptions(data)).toEqual({
      title: 'Untitled', tags: ['untagged'], description: '',
      canonical: 'https://example.com/post', platforms: ['devto'],
      status: 'draft', slug: undefined, primary: undefined,
    })
  })
})
