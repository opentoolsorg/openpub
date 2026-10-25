import type { Frontmatter, PlatformName } from './types'

export interface AuditResult {
  score: number
  issues: string[]
}

/** Pure Markdown quality checks shared by the local CLI and stdio MCP. */
export function auditContent(body: string, data: Frontmatter): AuditResult {
  const issues: string[] = []
  const words = body.split(/\s+/).filter(Boolean).length
  if (words < 300) issues.push(`short: ${words} words (aim for 600+)`)
  const heads = (body.match(/^#{1,6}\s/gm) ?? []).length
  if (!heads) issues.push('no headings found')
  const links = body.match(/\[[^\]]*\]\([^)]+\)/g) ?? []
  if (!links.length) issues.push('no internal/external links (aim for 2-3)')
  const imgs = body.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []
  if (!imgs.length) issues.push('no images (add at least one)')
  const paras = body.split(/\n{2,}/).filter(Boolean)
  const longParas = paras.filter(p => p.split(/\s+/).length > 60).length
  if (longParas) issues.push(`${longParas} long paragraph(s) (>60 words)`)
  if (data.tags.length < 2) issues.push(`few tags: ${data.tags.length}`)
  if (!data.canonical_url) issues.push('no canonical_url set')

  return { score: Math.max(20, 100 - issues.length * 9), issues }
}

export interface FrontmatterBuildOptions {
  title: string
  tags: string[]
  description: string
  canonical?: string
  slug?: string
  platforms?: PlatformName[]
  status?: 'draft' | 'published'
  primary?: PlatformName
}

/** Preserve the CLI/MCP formatter defaults and map parsed metadata to builder inputs. */
export function frontmatterBuildOptions(data: Frontmatter): FrontmatterBuildOptions {
  return {
    title: data.title ?? 'Untitled',
    tags: data.tags.length ? data.tags : ['untagged'],
    description: data.description ?? '',
    canonical: data.canonical_url,
    slug: data.slug,
    platforms: data.platforms,
    status: data.status,
    primary: data.primary,
  }
}
