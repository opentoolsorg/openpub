import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

vi.mock('@openpub/core/publish', () => ({
  publishFile: vi.fn(),
  testPlatform: vi.fn(async () => true),
}))

import { publishFile } from '@openpub/core/publish'
import { callTool, toolResult } from '../apps/mcp/handlers'

const report = {
  file: '/tmp/post.md',
  title: 'Hello',
  dryRun: false,
  outcomes: [{ platform: 'devto', ok: false, error: 'devto 422: no' }],
}

beforeEach(() => {
  vi.mocked(publishFile).mockReset()
  vi.mocked(publishFile).mockResolvedValue(report as never)
})

describe('mcp publish arguments', () => {
  it('rejects unknown keys before publishing', async () => {
    await expect(callTool('publish', { file: 'post.md', dry_run: true })).rejects.toThrow(/unknown argument "dry_run"/)
    expect(publishFile).not.toHaveBeenCalled()
  })

  it('passes dryRun through when the key is spelled correctly', async () => {
    await callTool('publish', { file: 'post.md', dryRun: true })
    expect(publishFile).toHaveBeenCalledWith('post.md', expect.objectContaining({ dryRun: true }))
  })

  it('marks a failed publish report as an error', async () => {
    const result = await callTool('publish', { file: 'post.md' })
    expect(toolResult(result).isError).toBe(true)
  })

  it('does not mark a successful report as an error', () => {
    expect(toolResult({
      ...report,
      outcomes: [{ platform: 'devto', ok: true, url: 'https://dev.to/u/post' }],
    }).isError).toBeUndefined()
  })
})

describe('mcp inspection behavior baseline', () => {
  const dir = mkdtempSync(join(tmpdir(), 'openpub-inspection-test-'))
  const file = join(dir, 'post.md')
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('keeps audit checks, issue strings, ordering, and scoring', async () => {
    const longParagraph = Array.from({ length: 61 }, (_, i) => `word${i}`).join(' ')
    writeFileSync(file, `---\ntags: [one]\n---\n${longParagraph}\n\nA short paragraph.`)
    await expect(callTool('content_audit', { file })).resolves.toEqual({
      score: 37,
      issues: [
        'short: 64 words (aim for 600+)',
        'no headings found',
        'no internal/external links (aim for 2-3)',
        'no images (add at least one)',
        '1 long paragraph(s) (>60 words)',
        'few tags: 1',
        'no canonical_url set',
      ],
    })
  })

  it('keeps frontmatter fallback and field mapping for every formatter input', async () => {
    writeFileSync(file, '---\ntitle: Existing\ntags: [one, two]\ndescription: Details\ncanonical_url: https://example.test\nslug: chosen\nplatforms: [devto]\nstatus: draft\nprimary: devto\n---\nBody')
    const result = await callTool('frontmatter', { file, format: 'openpub' })
    expect(result).toEqual({ file, format: 'openpub' })
    const rewritten = readFileSync(file, 'utf8')
    expect(rewritten).toContain('title: "Existing"')
    expect(rewritten).toContain('tags: ["one", "two"]')
    expect(rewritten).toContain('description: "Details"')
    expect(rewritten).toContain('canonical_url: "https://example.test"')
    expect(rewritten).toContain('slug: "chosen"')
    expect(rewritten).toContain('platforms: [devto]')
    expect(rewritten).toContain('status: draft')
    expect(rewritten).toContain('primary: devto')
    expect(rewritten.endsWith('Body')).toBe(true)
  })

  it('applies existing formatter fallbacks when optional fields are absent', async () => {
    writeFileSync(file, 'Just body')
    await callTool('frontmatter', { file, format: 'openpub' })
    const rewritten = readFileSync(file, 'utf8')
    expect(rewritten).toContain('title: "Untitled"')
    expect(rewritten).toContain('tags: ["untagged"]')
    expect(rewritten.endsWith('Just body')).toBe(true)
  })
})
