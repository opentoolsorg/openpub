import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { configuredPlatforms, storeCreds } from '@openpub/core/config'
import { buildFrontmatter, parseFrontmatter, type FmFormat } from '@openpub/core/frontmatter'
import { publishFile, testPlatform } from '@openpub/core/publish'
import { loadState } from '@openpub/core/state'
import { PLATFORMS, type PlatformName } from '@openpub/core/types'

const FM_FORMATS: FmFormat[] = [
  'openpub', 'hugo', 'jekyll', 'astro', 'nextjs', 'devto', 'hashnode', 'ghost',
]

const platformSchema = { type: 'string', enum: [...PLATFORMS] }
const platformsSchema = { type: 'array', items: platformSchema }
const statusSchema = { type: 'string', enum: ['draft', 'published'] }

export const TOOLS = [
  {
    name: 'publish',
    description: 'Fan out a Markdown file to selected platforms. dryRun validates without publishing. force republishes unchanged content. Unknown arguments are rejected. The default status is draft.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        file: { type: 'string', description: 'Path to a Markdown file' },
        platforms: platformsSchema,
        status: statusSchema,
        canonical: { type: 'string', description: 'Explicit canonical URL' },
        dryRun: { type: 'boolean' },
        force: { type: 'boolean' },
      },
      required: ['file'],
    },
  },
  {
    name: 'cross_publish',
    description: 'Write inline title and content to a temp Markdown file, then fan out through the same publish engine. The default status is draft.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        platforms: platformsSchema,
        status: statusSchema,
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'list_published',
    description: 'Return entries from the local idempotency ledger (~/.openpub/state.json).',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'setup',
    description: 'Store platform credentials in ~/.openpub/config.json, then verify them. Invalid credential shapes are rejected before anything is saved.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        platform: platformSchema,
        credentials: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['platform', 'credentials'],
    },
  },
  {
    name: 'status',
    description: 'List configured platforms and whether stored credentials currently verify.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'test_platform',
    description: 'Verify stored credentials against one platform API.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: { platform: platformSchema },
      required: ['platform'],
    },
  },
  {
    name: 'content_audit',
    description: 'Score a Markdown file with the same quality checks as the OpenPub CLI audit command.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: { file: { type: 'string' } },
      required: ['file'],
    },
  },
  {
    name: 'check_links',
    description: 'HEAD-request every HTTP(S) URL in a Markdown file and return per-link status.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: { file: { type: 'string' } },
      required: ['file'],
    },
  },
  {
    name: 'frontmatter',
    description: 'Rewrite a file frontmatter block into a known format (openpub, hugo, jekyll, astro, nextjs, devto, hashnode, ghost). platforms and status are preserved.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        file: { type: 'string' },
        format: { type: 'string', enum: FM_FORMATS },
      },
      required: ['file', 'format'],
    },
  },
  {
    name: 'x_article',
    description: 'Publish a Markdown file to the x platform only. The default status is draft.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        file: { type: 'string' },
        status: statusSchema,
      },
      required: ['file'],
    },
  },
]

const ALLOWED: Record<string, string[]> = {
  publish: ['file', 'platforms', 'status', 'canonical', 'dryRun', 'force'],
  cross_publish: ['title', 'content', 'platforms', 'status'],
  list_published: [],
  setup: ['platform', 'credentials'],
  status: [],
  test_platform: ['platform'],
  content_audit: ['file'],
  check_links: ['file'],
  frontmatter: ['file', 'format'],
  x_article: ['file', 'status'],
}

function assertKnown(name: string, raw: Record<string, unknown>): void {
  const allowed = ALLOWED[name] ?? []
  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) {
      throw new Error(`unknown argument "${key}". allowed: ${allowed.join(', ') || '(none)'}`)
    }
  }
}

function requiredString(v: unknown, name: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new Error(name + ' is required')
  return v
}

function optionalBool(v: unknown, name: string): boolean | undefined {
  if (v === undefined) return undefined
  if (typeof v !== 'boolean') throw new Error(name + ' must be a boolean')
  return v
}

function asPlatform(v: unknown): PlatformName {
  if (typeof v !== 'string' || !(PLATFORMS as string[]).includes(v)) {
    throw new Error('unknown platform "' + String(v) + '". available: ' + PLATFORMS.join(', '))
  }
  return v as PlatformName
}

function optionalPlatforms(v: unknown): PlatformName[] | undefined {
  if (v === undefined) return undefined
  if (!Array.isArray(v)) throw new Error('platforms must be an array')
  return v.map(asPlatform)
}

function optionalStatus(v: unknown): 'draft' | 'published' | undefined {
  if (v === undefined) return undefined
  if (v !== 'draft' && v !== 'published') throw new Error('status must be draft or published')
  return v
}

function asFormat(v: unknown): FmFormat {
  if (typeof v !== 'string' || !(FM_FORMATS as string[]).includes(v)) {
    throw new Error('unknown format "' + String(v) + '". known: ' + FM_FORMATS.join(', '))
  }
  return v as FmFormat
}

function auditFile(file: string): { score: number; issues: string[] } {
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
  const issues: string[] = []
  const words = body.split(/\s+/).filter(Boolean).length
  if (words < 300) issues.push('short: ' + words + ' words (aim for 600+)')
  const heads = (body.match(/^#{1,6}\s/gm) ?? []).length
  if (!heads) issues.push('no headings found')
  const links = body.match(/\[[^\]]*\]\([^)]+\)/g) ?? []
  if (!links.length) issues.push('no internal/external links (aim for 2-3)')
  const imgs = body.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []
  if (!imgs.length) issues.push('no images (add at least one)')
  const paras = body.split(/\n{2,}/).filter(Boolean)
  const longParas = paras.filter(p => p.split(/\s+/).length > 60).length
  if (longParas) issues.push(longParas + ' long paragraph(s) (>60 words)')
  if (data.tags.length < 2) issues.push('few tags: ' + data.tags.length)
  if (!data.canonical_url) issues.push('no canonical_url set')
  return { score: Math.max(20, 100 - issues.length * 9), issues }
}

async function checkLinks(file: string): Promise<{ results: { url: string; status: number; ok: boolean }[] }> {
  const { body } = parseFrontmatter(readFileSync(file, 'utf8'))
  const urls = [...new Set([...body.matchAll(/https?:\/\/\S+/g)].map(m => m[0].replace(/[)\]"',.;]+$/, '')))]
  const results: { url: string; status: number; ok: boolean }[] = []
  for (const url of urls) {
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) })
      results.push({ url, status: r.status, ok: r.ok })
    } catch {
      results.push({ url, status: 0, ok: false })
    }
  }
  return { results }
}

function frontmatterFields(file: string) {
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
  return {
    body,
    fields: {
      title: data.title ?? 'Untitled',
      tags: data.tags.length ? data.tags : ['untagged'],
      description: data.description ?? '',
      canonical: data.canonical_url,
      slug: data.slug,
      platforms: data.platforms,
      status: data.status,
      primary: data.primary,
    },
  }
}

export async function callTool(name: string, raw: Record<string, unknown>): Promise<unknown> {
  assertKnown(name, raw)
  switch (name) {
    case 'publish':
      return publishFile(requiredString(raw.file, 'file'), {
        to: optionalPlatforms(raw.platforms),
        status: optionalStatus(raw.status),
        canonical: typeof raw.canonical === 'string' ? raw.canonical : undefined,
        dryRun: optionalBool(raw.dryRun, 'dryRun'),
        force: optionalBool(raw.force, 'force'),
      })

    case 'cross_publish': {
      const title = requiredString(raw.title, 'title')
      const content = requiredString(raw.content, 'content')
      const dir = mkdtempSync(join(tmpdir(), 'openpub-'))
      const file = join(dir, 'post.md')
      writeFileSync(file, buildFrontmatter('openpub', { title, tags: [] }) + content)
      try {
        return await publishFile(file, {
          to: optionalPlatforms(raw.platforms),
          status: optionalStatus(raw.status),
        })
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }

    case 'list_published':
      return { entries: loadState().published }

    case 'setup': {
      const platform = asPlatform(raw.platform)
      storeCreds(platform, raw.credentials)
      return { ok: await testPlatform(platform) }
    }

    case 'status': {
      const platforms = []
      for (const platform of configuredPlatforms()) {
        platforms.push({ platform, ok: await testPlatform(platform) })
      }
      return { platforms }
    }

    case 'test_platform':
      return { ok: await testPlatform(asPlatform(raw.platform)) }

    case 'content_audit':
      return auditFile(requiredString(raw.file, 'file'))

    case 'check_links':
      return checkLinks(requiredString(raw.file, 'file'))

    case 'frontmatter': {
      const file = requiredString(raw.file, 'file')
      const format = asFormat(raw.format)
      const { body, fields } = frontmatterFields(file)
      writeFileSync(file, buildFrontmatter(format, fields) + body)
      return { file, format }
    }

    case 'x_article':
      return publishFile(requiredString(raw.file, 'file'), {
        to: ['x'],
        status: optionalStatus(raw.status),
      })

    default:
      throw new Error('unknown tool "' + name + '"')
  }
}

export function toolResult(result: unknown): {
  content: { type: 'text'; text: string }[]
  isError?: boolean
} {
  const outcomes = result && typeof result === 'object' ? (result as { outcomes?: unknown }).outcomes : undefined
  const failed = Array.isArray(outcomes) && outcomes.some(item => {
    return !!item && typeof item === 'object' && (item as { ok?: boolean }).ok === false
  })
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
    ...(failed ? { isError: true } : {}),
  }
}
