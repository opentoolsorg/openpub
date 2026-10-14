import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { marked } from 'marked'
import type {
  PlatformName, PublishInput, PublishOutcome, PublishReport,
} from './types'
import { PLATFORMS } from './types'
import { parseFrontmatter } from './frontmatter'
import { adapters } from './adapters'
import { configuredPlatforms, getCreds, loadConfig } from './config'
import { hashContent, loadState, saveState, stateKey } from './state'

export interface PublishOptions {
  to?: PlatformName[]
  status?: 'draft' | 'published'
  dryRun?: boolean
  canonical?: string
  force?: boolean
  onProgress?: (msg: string) => void
}

function firstHeading(body: string): string | undefined {
  const m = body.match(/^\s*#{1,6}\s+(.+)$/m)
  return m?.[1]?.trim()
}

export function resolvePlatforms(file: string, opts: PublishOptions): PlatformName[] {
  const { data } = parseFrontmatter(readFileSync(file, 'utf8'))
  const cfg = loadConfig()
  const requested = opts.to?.length ? opts.to : data.platforms?.length ? data.platforms : cfg.defaults?.platforms
  const list = requested?.length ? requested : configuredPlatforms()
  const seen = new Set<PlatformName>()
  return list.filter((p): p is PlatformName => {
    if (!(PLATFORMS as string[]).includes(p)) return false
    if (seen.has(p)) return false
    seen.add(p)
    return true
  })
}

export async function publishFile(file: string, opts: PublishOptions = {}): Promise<PublishReport> {
  const abs = resolve(file)
  const raw = readFileSync(abs, 'utf8')
  const { data, body } = parseFrontmatter(raw)
  const title = data.title ?? firstHeading(body) ?? basename(abs).replace(/\.mdx?$/, '')
  const status = opts.status ?? data.status ?? loadConfig().defaults?.status ?? 'published'
  const hash = hashContent(body)

  const platforms = resolvePlatforms(abs, opts)
  if (!platforms.length) {
    throw new Error('no platforms selected: add `platforms: [devto, hashnode]` to frontmatter, pass --to, or run `openpub setup <platform>`')
  }

  const html = await marked.parse(body)
  const state = loadState()
  const report: PublishReport = {
    file: abs,
    title,
    canonical: opts.canonical ?? data.canonical_url,
    dryRun: !!opts.dryRun,
    outcomes: [],
  }

  // Publish the primary platform first so its URL can seed the canonical for the rest.
  const primary = data.primary && platforms.includes(data.primary) ? data.primary : undefined
  const ordered = primary ? [primary, ...platforms.filter(p => p !== primary)] : platforms

  for (const platform of ordered) {
    const adapter = adapters[platform]
    const creds = getCreds(platform)

    if (!adapter) {
      report.outcomes.push({ platform, ok: false, error: 'unknown platform' })
      continue
    }
    if (!creds) {
      report.outcomes.push({ platform, ok: false, error: 'not configured (run: openpub setup ' + platform + ')' })
      continue
    }

    const key = stateKey(abs, platform)
    const prev = state.published[key]
    if (!opts.force && prev && prev.hash === hash) {
      report.outcomes.push({ platform, ok: true, url: prev.url, skipped: true })
      opts.onProgress?.(`= ${platform}: unchanged, skipped`)
      continue
    }

    if (opts.dryRun) {
      report.outcomes.push({ platform, ok: true, skipped: true })
      opts.onProgress?.(`~ ${platform}: dry-run, credentials present`)
      continue
    }

    const input: PublishInput = {
      title,
      markdown: body,
      html,
      tags: data.tags,
      canonicalUrl: report.canonical,
      coverImage: data.cover_image,
      status,
    }

    try {
      opts.onProgress?.(`> ${platform}: publishing...`)
      const result = await adapter.publish(input, creds)
      state.published[key] = { hash, url: result.url, at: Date.now() }
      saveState(state)
      if (!report.canonical) report.canonical = result.url
      report.outcomes.push({ platform, ok: true, url: result.url })
      opts.onProgress?.(`+ ${platform}: ${result.url}`)
    } catch (e) {
      report.outcomes.push({
        platform,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      })
      opts.onProgress?.(`x ${platform}: ${e instanceof Error ? e.message : e}`)
    }
  }

  return report
}

export async function testPlatform(platform: PlatformName): Promise<boolean> {
  const adapter = adapters[platform]
  const creds = getCreds(platform)
  if (!adapter || !creds) return false
  try {
    return await adapter.test(creds)
  } catch {
    return false
  }
}
