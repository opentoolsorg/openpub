import { slugify } from './slug'
import type { PlatformName } from './types'
export { parseFrontmatter } from './post'

export type FmFormat = 'openpub' | 'hugo' | 'jekyll' | 'astro' | 'nextjs' | 'devto' | 'hashnode' | 'ghost'

export function buildFrontmatter(
  format: FmFormat,
  opts: {
    title: string
    tags: string[]
    description?: string
    date?: string
    canonical?: string
    slug?: string
    platforms?: PlatformName[]
    status?: 'draft' | 'published'
    primary?: PlatformName
  },
): string {
  const date = opts.date ?? new Date().toISOString()
  const slug = opts.slug ?? slugify(opts.title, opts.title)
  const published = opts.status !== 'draft'
  const q = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`
  const tagList = `[${opts.tags.map(q).join(', ')}]`
  const lines: (string | null)[] = ['---', `title: ${q(opts.title)}`]

  switch (format) {
    case 'hugo':
      lines.push(`date: ${date}`, `slug: ${q(slug)}`, `tags: ${tagList}`, `draft: ${published ? 'false' : 'true'}`)
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
      lines.push(`date: ${q(date)}`, `slug: ${q(slug)}`, `tags: ${tagList}`, `published: ${published ? 'true' : 'false'}`)
      if (opts.description) lines.push(`summary: ${q(opts.description)}`)
      break
    case 'devto':
      lines.push(`published: ${published ? 'true' : 'false'}`, `tags: ${opts.tags.slice(0, 4).join(', ')}`)
      if (opts.canonical) lines.push(`canonical_url: ${q(opts.canonical)}`)
      break
    case 'hashnode':
      lines.push(`slug: ${q(slug)}`, `tags: ${opts.tags.join(', ')}`)
      if (opts.canonical) lines.push(`canonical: ${q(opts.canonical)}`)
      break
    case 'ghost':
      lines.push(`slug: ${q(slug)}`, `tags: ${tagList}`, `status: ${opts.status ?? 'published'}`)
      if (opts.description) lines.push(`custom_excerpt: ${q(opts.description)}`)
      break
    case 'openpub':
    default:
      lines.push(`date: ${date}`, `tags: ${tagList}`)
      if (opts.description) lines.push(`description: ${q(opts.description)}`)
      if (opts.canonical) lines.push(`canonical_url: ${q(opts.canonical)}`)
      if (opts.slug) lines.push(`slug: ${q(opts.slug)}`)
      lines.push(`platforms: [${(opts.platforms ?? []).join(', ')}]`)
      if (opts.status) lines.push(`status: ${opts.status}`)
      if (opts.primary) lines.push(`primary: ${opts.primary}`)
      break
  }

  if (format !== 'openpub') {
    if (opts.platforms?.length) lines.push(`platforms: [${opts.platforms.join(', ')}]`)
    if (opts.status && format !== 'ghost') lines.push(`status: ${opts.status}`)
    if (opts.primary) lines.push(`primary: ${opts.primary}`)
  }

  return lines.filter((l): l is string => l !== null).join('\n') + '\n---\n'
}
