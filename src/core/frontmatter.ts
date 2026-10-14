import type { Frontmatter, PlatformName } from './types'
import { PLATFORMS } from './types'

// Minimal, dependency-free frontmatter parser. Handles the shapes OpenPub emits
// plus the common Hugo/Jekyll/Astro/Next.js fields. Not a full YAML parser.

function unquote(v: string): string {
  const t = v.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1)
  }
  return t
}

function parseList(v: string): string[] {
  const t = v.trim()
  if (t.startsWith('[') && t.endsWith(']')) {
    return t.slice(1, -1).split(',').map(s => unquote(s)).filter(Boolean)
  }
  return t.split(',').map(s => unquote(s)).filter(Boolean)
}

export function parseFrontmatter(md: string): { data: Frontmatter; body: string } {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  const empty: Frontmatter = { tags: [], raw: {} }
  if (!m) return { data: empty, body: md }

  const raw: Record<string, unknown> = {}
  const tags: string[] = []
  let platforms: PlatformName[] | undefined
  let title: string | undefined
  let canonical_url: string | undefined
  let slug: string | undefined
  let description: string | undefined
  let cover_image: string | undefined
  let status: 'draft' | 'published' | undefined
  let primary: PlatformName | undefined

  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    const val = kv[2]
    raw[key] = val
    switch (key) {
      case 'title': title = unquote(val); break
      case 'tags': tags.push(...parseList(val)); break
      case 'platforms':
        platforms = parseList(val)
          .map(p => p.trim().toLowerCase())
          .filter((p): p is PlatformName => (PLATFORMS as string[]).includes(p))
        break
      case 'canonical_url': case 'canonical': canonical_url = unquote(val); break
      case 'slug': slug = unquote(val); break
      case 'description': description = unquote(val); break
      case 'cover_image': case 'image': case 'cover': cover_image = unquote(val); break
      case 'status': {
        const s = unquote(val).toLowerCase()
        if (s === 'draft' || s === 'published') status = s
        break
      }
      case 'primary': {
        const p = unquote(val).toLowerCase()
        if ((PLATFORMS as string[]).includes(p)) primary = p as PlatformName
        break
      }
    }
  }

  return {
    data: { title, tags, platforms, canonical_url, slug, description, cover_image, status, primary, raw },
    body: m[2],
  }
}

export type FmFormat = 'openpub' | 'hugo' | 'jekyll' | 'astro' | 'nextjs' | 'devto' | 'hashnode' | 'ghost'

export function buildFrontmatter(
  format: FmFormat,
  opts: { title: string; tags: string[]; description?: string; date?: string; canonical?: string; slug?: string },
): string {
  const date = opts.date ?? new Date().toISOString()
  const slug = opts.slug ?? opts.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const q = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`
  const tagList = `[${opts.tags.map(q).join(', ')}]`
  const lines: (string | null)[] = ['---', `title: ${q(opts.title)}`]

  switch (format) {
    case 'hugo':
      lines.push(`date: ${date}`, `slug: ${q(slug)}`, `tags: ${tagList}`, `draft: false`)
      if (opts.description) lines.push(`description: ${q(opts.description)}`)
      break
    case 'jekyll':
      lines.push(`date: ${date}`, `slug: ${q(slug)}`, `tags: ${tagList}`)
      if (opts.description) lines.push(`description: ${q(opts.description)}`)
      break
    case 'astro':
      lines.push(`pubDate: ${date}`, `slug: ${q(slug)}`, `tags: ${tagList}`)
      if (opts.description) lines.push(`description: ${q(opts.description)}`)
      break
    case 'nextjs':
      lines.push(`date: ${q(date)}`, `slug: ${q(slug)}`, `tags: ${tagList}`, `published: true`)
      if (opts.description) lines.push(`summary: ${q(opts.description)}`)
      break
    case 'devto':
      lines.push(`published: true`, `tags: ${opts.tags.slice(0, 4).join(', ')}`)
      if (opts.canonical) lines.push(`canonical_url: ${q(opts.canonical)}`)
      break
    case 'hashnode':
      lines.push(`slug: ${q(slug)}`, `tags: ${opts.tags.join(', ')}`)
      if (opts.canonical) lines.push(`canonical: ${q(opts.canonical)}`)
      break
    case 'ghost':
      lines.push(`slug: ${q(slug)}`, `tags: ${tagList}`, `status: published`)
      if (opts.description) lines.push(`custom_excerpt: ${q(opts.description)}`)
      break
    case 'openpub':
    default:
      lines.push(`date: ${date}`, `tags: ${tagList}`)
      if (opts.description) lines.push(`description: ${q(opts.description)}`)
      if (opts.canonical) lines.push(`canonical_url: ${q(opts.canonical)}`)
      lines.push(`platforms: []`)
      break
  }

  return lines.filter((l): l is string => l !== null).join('\n') + '\n---\n'
}
