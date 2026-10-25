import type { Frontmatter, PlatformName } from './types'
import { PLATFORMS } from './types'

export interface ParsedPost {
  frontmatter: Record<string, unknown>
  raw: Record<string, unknown>
  body: string
}

const unquote = (value: string) => {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseList(value: string): string[] {
  return value.trim().slice(1, -1).split(',').map(unquote).filter(Boolean)
}

/** Parse the OpenPub frontmatter subset without Node-only imports. */
export function parsePost(markdown: string): ParsedPost {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, raw: {}, body: markdown }

  const frontmatter: Record<string, unknown> = {}
  const raw: Record<string, unknown> = {}
  const lines = match[1].split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const pair = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!pair) continue
    const [, key, rawValue] = pair
    const value = rawValue.trim()
    delete raw[key]
    if (!value) {
      const items: string[] = []
      let next = i + 1
      while (next < lines.length) {
        const item = lines[next].match(/^\s*-\s+(.*)$/)
        if (!item) break
        items.push(unquote(item[1]))
        next++
      }
      if (items.length) {
        frontmatter[key] = items
        raw[key] = items
        i = next - 1
      } else {
        frontmatter[key] = ''
        raw[key] = rawValue
      }
    } else if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = parseList(value)
      raw[key] = rawValue
    } else {
      frontmatter[key] = unquote(value)
      raw[key] = rawValue
    }
  }
  return { frontmatter, raw, body: match[2] }
}

function asPlatforms(value: unknown): PlatformName[] | undefined {
  if (!Array.isArray(value) && typeof value !== 'string') return undefined
  const values = Array.isArray(value) ? value : value.split(',')
  return values.map(item => String(item).trim().toLowerCase())
    .filter((item): item is PlatformName => (PLATFORMS as string[]).includes(item))
}

function asStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map(item => unquote(item)).filter(Boolean)
  return []
}

function headingTitle(body: string): string | undefined {
  return body.match(/^\s*#{1,6}\s+(.+)$/m)?.[1]?.trim() || undefined
}

export function parseFrontmatter(md: string): { data: Frontmatter; body: string } {
  return frontmatterFromParsed(parsePost(md))
}

function frontmatterFromParsed(parsed: ParsedPost): { data: Frontmatter; body: string } {
  const raw = parsed.frontmatter
  const tags = asStrings(raw.tags)
  const platformValues = raw.platforms
  const statusValue = typeof raw.status === 'string' ? raw.status.toLowerCase() : ''
  const primaryValue = typeof raw.primary === 'string' ? raw.primary.toLowerCase() : ''
  let cover: unknown
  let canonical: unknown
  for (const key of Object.keys(parsed.raw)) {
    if (key === 'cover_image' || key === 'image' || key === 'cover') cover = raw[key]
    if (key === 'canonical_url' || key === 'canonical') canonical = raw[key]
  }
  return {
    data: {
      title: typeof raw.title === 'string' ? raw.title : undefined,
      tags,
      platforms: asPlatforms(platformValues),
      canonical_url: typeof canonical === 'string' ? canonical : undefined,
      slug: typeof raw.slug === 'string' ? raw.slug : undefined,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      cover_image: typeof cover === 'string' ? cover : undefined,
      status: statusValue === 'draft' || statusValue === 'published' ? statusValue : undefined,
      primary: (PLATFORMS as string[]).includes(primaryValue) ? primaryValue as PlatformName : undefined,
      raw: parsed.raw,
    },
    body: parsed.body,
  }
}

export interface PostMetadataOverrides {
  title?: string | null
  coverImage?: string | null
  canonicalUrl?: string | null
  status?: 'draft' | 'published'
  fallbackTitle?: string
}

export interface ResolvedPostMetadata {
  data: Frontmatter
  title?: string
  coverImage?: string
  canonicalUrl?: string
  status?: 'draft' | 'published'
  frontmatter: Record<string, unknown>
  body: string
  tags: string[]
}

/** Resolve stored/caller metadata first, then frontmatter, then title fallbacks. */
export function resolvePostMetadata(markdown: string, overrides: PostMetadataOverrides = {}): ResolvedPostMetadata {
  const parsed = parsePost(markdown)
  const fm = parsed.frontmatter
  const { data } = frontmatterFromParsed(parsed)
  const title = overrides.title !== undefined && overrides.title !== null
    ? overrides.title.trim()
    : typeof fm.title === 'string'
      ? fm.title.trim()
      : headingTitle(parsed.body) || overrides.fallbackTitle?.trim() || undefined
  return {
    data,
    frontmatter: fm,
    body: parsed.body,
    tags: data.tags,
    title,
    coverImage: overrides.coverImage ?? data.cover_image,
    canonicalUrl: overrides.canonicalUrl ?? data.canonical_url,
    status: overrides.status ?? data.status,
  }
}
