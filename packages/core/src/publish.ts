import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { preparePost, publishPost } from './pipeline'
import type {
  Frontmatter, PlatformName, PublishInput, PublishReport,
} from './types'
import { PLATFORMS } from './types'
import { resolvePostMetadata } from './post'
import { adapters } from './adapters'
import { configuredPlatforms, getCreds, loadConfig } from './config'
import { hashContent, loadState, saveState, stateKey } from './state'
import { isPublicCanonicalUrl } from './url'
import { UpdateUnsupportedError } from './errors'

export interface PublishOptions {
  to?: PlatformName[]
  status?: 'draft' | 'published'
  dryRun?: boolean
  canonical?: string
  force?: boolean
  onProgress?: (msg: string) => void
}

export function resolvePlatforms(data: Frontmatter, opts: PublishOptions): PlatformName[] {
  const cfg = loadConfig()
  // An explicit list, including an empty one, wins. Only a missing list falls
  // through to frontmatter, defaults, and then every configured platform.
  const requested = opts.to ?? (data.platforms?.length ? data.platforms : cfg.defaults?.platforms)
  const list = requested ?? configuredPlatforms()
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
  const resolved = resolvePostMetadata(raw, { status: opts.status, canonicalUrl: opts.canonical, fallbackTitle: basename(abs).replace(/\.mdx?$/, '') })
  const { data, body } = resolved
  const title = resolved.title?.trim() ?? ''
  if (!title) throw new Error('refusing to publish: title is empty')
  if (!body.trim()) throw new Error('refusing to publish: post body is empty')
  // Draft is the safe default. Live publishing has to be asked for.
  const status = resolved.status ?? loadConfig().defaults?.status ?? 'draft'
  const warnings: string[] = []
  const requestedCanonical = resolved.canonicalUrl
  let canonical = requestedCanonical
  if (requestedCanonical && !isPublicCanonicalUrl(requestedCanonical)) {
    warnings.push('ignoring non-public canonical URL')
    opts.onProgress?.('~ ignoring non-public canonical URL')
    canonical = undefined
  }
  const fullHash = hashContent(JSON.stringify({
    title,
    body,
    tags: resolved.tags,
    status,
    canonical: canonical ?? '',
    cover: resolved.coverImage ?? '',
    slug: data.slug ?? '',
  }))
  // Entries written before title and tags were part of the hash stored hash(body).
  const bodyHash = hashContent(body)

  const platforms = resolvePlatforms(data, opts)
  if (!platforms.length) {
    throw new Error('no platforms selected: add `platforms: [devto, hashnode]` to frontmatter, pass --to, or run `openpub setup <platform>`')
  }

  const prepared = await preparePost({ title, markdown: body, tags: resolved.tags, status, canonicalUrl: canonical, coverImage: resolved.coverImage, slug: data.slug })
  const state = loadState()
  const report: PublishReport = {
    file: abs,
    title,
    canonical,
    dryRun: !!opts.dryRun,
    outcomes: [],
    warnings: warnings.length ? warnings : undefined,
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
    if (!opts.force && prev && (prev.hash === fullHash || prev.hash === bodyHash)) {
      report.outcomes.push({ platform, ok: true, url: prev.url, skipped: true })
      opts.onProgress?.(`= ${platform}: unchanged, skipped`)
      continue
    }

    // Without a stored remote id a second POST creates a duplicate. GitHub Pages
    // addresses the file by slug, so it can still replace the same path.
    if (prev && !prev.id && platform !== 'github-pages' && !opts.force) {
      const warning = `${platform}: this file was published before remote ids were stored, so the edit was skipped to avoid a duplicate. Pass --force to create a new post.`
      report.outcomes.push({ platform, ok: true, skipped: true, url: prev.url, warning })
      opts.onProgress?.(`~ ${platform}: ${warning}`)
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
      html: prepared.html,
      tags: resolved.tags,
      canonicalUrl: report.canonical,
      coverImage: resolved.coverImage,
      status,
      remoteId: prev?.id,
      remoteStatus: prev?.remoteStatus,
      slug: data.slug,
    }

    try {
      opts.onProgress?.(`> ${platform}: publishing...`)
      const result = await publishPost(platform, input, creds)
      state.published[key] = {
        hash: fullHash,
        url: result.url,
        at: Date.now(),
        id: result.id ?? prev?.id,
        remoteStatus: status,
      }
      saveState(state)
      if (!report.canonical && status === 'published' && isPublicCanonicalUrl(result.url)) {
        report.canonical = result.url
      }
      report.outcomes.push({ platform, ok: true, url: result.url })
      opts.onProgress?.(`+ ${platform}: ${result.url}`)
    } catch (e) {
      if (e instanceof UpdateUnsupportedError) {
        report.outcomes.push({
          platform,
          ok: true,
          skipped: true,
          url: prev?.url,
          warning: e.message,
        })
        opts.onProgress?.(`~ ${platform}: ${e.message}`)
        continue
      }
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
