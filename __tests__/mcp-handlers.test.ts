import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/core/publish', () => ({
  publishFile: vi.fn(),
  testPlatform: vi.fn(async () => true),
}))

import { publishFile } from '../src/core/publish'
import { callTool, toolResult } from '../mcp/handlers'

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
