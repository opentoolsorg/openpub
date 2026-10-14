#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { configuredPlatforms, setCreds } from '../src/core/config'
import { buildFrontmatter, parseFrontmatter, type FmFormat } from '../src/core/frontmatter'
import { publishFile, testPlatform } from '../src/core/publish'
import { loadState } from '../src/core/state'
import { PLATFORMS, type Creds, type PlatformName } from '../src/core/types'

const VERSION = '0.1.0'
const FM_FORMATS: FmFormat[] = [
  'openpub', 'hugo', 'jekyll', 'astro', 'nextjs', 'devto', 'hashnode', 'ghost',
]

const platformSchema = { type: 'string', enum: [...PLATFORMS] }
const platformsSchema = { type: 'array', items: platformSchema }
const statusSchema = { type: 'string', enum: ['draft', 'published'] }

const TOOLS = [
  {
    name: 'publish',
    description: 'Fan out a Markdown file to selected platforms. dryRun validates without publishing. force republishes unchanged content.',
    inputSchema: {
      type: 'object',
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
    description: 'Write inline title and content to a temp Markdown file, then fan out through the same publish engine.',
    inputSchema: {
      type: 'object',
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
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'setup',
    description: 'Store platform credentials in ~/.openpub/config.json, then verify them.',
    inputSchema: {
      type: 'object',
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
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'test_platform',
    description: 'Verify stored credentials against one platform API.',
    inputSchema: {
      type: 'object',
      properties: { platform: platformSchema },
      required: ['platform'],
    },
  },
  {
    name: 'content_audit',
    description: 'Score a Markdown file with the same quality checks as the OpenPub CLI audit command.',
    inputSchema: {
      type: 'object',
      properties: { file: { type: 'string' } },
      required: ['file'],
    },
  },
  {
    name: 'check_links',
    description: 'HEAD-request every HTTP(S) URL in a Markdown file and return per-link status.',
    inputSchema: {
      type: 'object',
      properties: { file: { type: 'string' } },
      required: ['file'],
    },
  },
  {
    name: 'frontmatter',
    description: 'Rewrite a file frontmatter block into a known format (openpub, hugo, jekyll, astro, nextjs, devto, hashnode, ghost).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string' },
        format: { type: 'string', enum: FM_FORMATS },
      },
      required: ['file', 'format'],
    },
  },
  {
    name: 'x_article',
    description: 'Publish a Markdown file to the x platform only.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string' },
        status: statusSchema,
      },
      required: ['file'],
    },
  },
]

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

function asCreds(v: unknown): Creds {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('credentials must be an object')
  const out: Creds = {}
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val !== 'string') throw new Error('credential "' + key + '" must be a string')
    out[key] = val
  }
  return out
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

async function callTool(name: string, raw: Record<string, unknown>): Promise<unknown> {
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
      // Temp markdown lets publishFile own hashing, state, and canonical wiring.
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
      setCreds(platform, asCreds(raw.credentials))
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
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
      const fm = buildFrontmatter(format, {
        title: data.title ?? 'Untitled',
        tags: data.tags.length ? data.tags : ['untagged'],
        description: data.description ?? '',
        canonical: data.canonical_url,
        slug: data.slug,
      })
      writeFileSync(file, fm + body)
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

const server = new Server(
  { name: 'openpub', version: VERSION },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

// Clients treat a thrown tool error as a transport failure, so every outcome stays JSON.
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const args = request.params.arguments
    const raw = args && typeof args === 'object' && !Array.isArray(args) ? args : {}
    const result = await callTool(request.params.name, raw as Record<string, unknown>)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  } catch (e) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)

