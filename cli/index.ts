#!/usr/bin/env node
// openpub - write once, publish everywhere.
// Local-first CLI. Credentials live in ~/.openpub/config.json (0600).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { marked } from 'marked'
import { publishFile, testPlatform } from '../src/core/publish'
import { parseFrontmatter, buildFrontmatter, type FmFormat } from '../src/core/frontmatter'
import {
  loadConfig, saveConfig, setCreds, removeCreds, getCreds,
  configuredPlatforms, CONFIG_PATH, HOME,
} from '../src/core/config'
import { PLATFORMS, type PlatformName } from '../src/core/types'

const VERSION = '0.1.0'
const CYAN = (s: string) => `[36m${s}[0m`
const DIM = (s: string) => `[2m${s}[0m`
const BOLD = (s: string) => `[1m${s}[0m`
const RED = (s: string) => `[31m${s}[0m`
const GREEN = (s: string) => `[32m${s}[0m`
const YELLOW = (s: string) => `[33m${s}[0m`

const args = process.argv.slice(2)
const cmd = args.shift()

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`)
  if (i < 0) return undefined
  const v = args[i + 1]
  if (v === undefined || v.startsWith('--')) return ''
  args.splice(i, 2)
  return v
}

function listFlag(name: string): string[] {
  const v = flag(name)
  if (!v) return []
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

function die(msg: string, code = 1): never {
  console.error(RED('error:'), msg)
  process.exit(code)
}

function isPlatform(p: string): p is PlatformName {
  return (PLATFORMS as string[]).includes(p)
}

function usage(): void {
  console.log(`${BOLD('openpub')} ${DIM(`v${VERSION}`)} - write once, publish everywhere
${BOLD('usage:')}  openpub <command> [args]

${BOLD('setup')}
  init                            create ~/.openpub and show the next step
  setup <platform> <json|file>    store credentials for a platform
  test <platform>                 verify stored credentials
  forget <platform>               remove stored credentials
  status                          show configured platforms and defaults

${BOLD('publishing')}
  publish <file.md>               fan out to all selected platforms
    --to a,b,c                    target platforms (overrides frontmatter)
    --status draft|published      publish state
    --canonical <url>             explicit canonical URL
    --dry-run                     validate without publishing
    --force                       republish unchanged files
  preview <file.md>               render to HTML in ~/.openpub/preview/

${BOLD('content')}
  frontmatter <file.md> [--format f]   regenerate frontmatter
  audit <file.md>                     report quality issues
  check-links <file.md>               validate every URL

${BOLD('platforms')}
  ${PLATFORMS.join(', ')}`)
}

try {
  switch (cmd) {
    case 'init': {
      mkdirSync(HOME, { recursive: true })
      const cfg = loadConfig()
      const creds = Object.keys(cfg.platforms).length
      console.log(`OpenPub home: ${CYAN(HOME)}`)
      console.log(`config: ${CYAN(CONFIG_PATH)} (${creds} platform${creds === 1 ? '' : 's'} configured)`)
      console.log(DIM('\nNext: openpub setup devto \'{"api_key": "..."}\''))
      console.log(DIM('Then:  openpub publish post.md --to devto,hashnode --dry-run'))
      break
    }

    case 'setup': {
      const [platform, credsArg] = args
      if (!platform || !credsArg) die('usage: openpub setup <platform> <json|file>')
      if (!isPlatform(platform)) die(`unknown platform "${platform}". available: ${PLATFORMS.join(', ')}`)
      let creds: Record<string, string>
      try {
        creds = existsSync(credsArg) ? JSON.parse(readFileSync(credsArg, 'utf8')) : JSON.parse(credsArg)
      } catch (e) {
        die(`invalid json: ${e instanceof Error ? e.message : e}`)
      }
      setCreds(platform, creds)
      const ok = await testPlatform(platform)
      console.log(ok
        ? GREEN('+') + ` ${platform}: credentials stored and verified`
        : YELLOW('~') + ` ${platform}: stored, but verification failed (check the credentials)`)
      if (!ok) process.exitCode = 1
      break
    }

    case 'test': {
      const platform = args[0]
      if (!platform || !isPlatform(platform)) die('usage: openpub test <platform>')
      const ok = await testPlatform(platform)
      console.log(ok ? GREEN('+') + ` ${platform}: ok` : RED('x') + ` ${platform}: failed`)
      if (!ok) process.exitCode = 1
      break
    }

    case 'forget': {
      const platform = args[0]
      if (!platform || !isPlatform(platform)) die('usage: openpub forget <platform>')
      removeCreds(platform)
      console.log(`${platform}: credentials removed`)
      break
    }

    case 'status': {
      const cfg = loadConfig()
      const configured = configuredPlatforms()
      if (!configured.length) {
        console.log('no platforms configured. run: openpub init')
        break
      }
      for (const p of configured) {
        const ok = await testPlatform(p)
        console.log(`  ${ok ? GREEN('+') : RED('x')} ${p}`)
      }
      if (cfg.defaults?.platforms) console.log(`${DIM('defaults:')} platforms=${cfg.defaults.platforms.join(',')}`)
      break
    }

    case 'publish': {
      const file = args[0]
      if (!file) die('usage: openpub publish <file.md>')
      const to = listFlag('to') as PlatformName[]
      for (const t of to) if (!isPlatform(t)) die(`unknown platform "${t}"`)
      const canonical = flag('canonical')
      const status = flag('status')
      if (status && status !== 'draft' && status !== 'published') die('--status must be draft or published')

      console.log(BOLD(`publishing ${basename(file)}...`))
      const report = await publishFile(file, {
        to,
        canonical,
        status: status as 'draft' | 'published' | undefined,
        dryRun: flag('dry-run') !== undefined || flag('dry-run') === '',
        force: flag('force') !== undefined || flag('force') === '',
        onProgress: m => console.log('  ' + m),
      })
      console.log('')
      console.log(BOLD(report.title))
      if (report.canonical) console.log(`${DIM('canonical:')} ${report.canonical}`)
      for (const o of report.outcomes) {
        if (o.ok) console.log(`  ${GREEN('+')} ${o.platform}${o.skipped ? ' ' + DIM('(skipped)') : ''}${o.url ? ' ' + DIM(o.url) : ''}`)
        else console.log(`  ${RED('x')} ${o.platform} ${DIM(o.error ?? '')}`)
      }
      const failed = report.outcomes.filter(o => !o.ok && !o.skipped).length
      if (failed) die(`${failed} platform(s) failed`)
      break
    }

    case 'preview': {
      const file = args[0]
      if (!file) die('usage: openpub preview <file.md>')
      const raw = readFileSync(file, 'utf8')
      const { data, body } = parseFrontmatter(raw)
      const html = await marked.parse(body)
      const title = data.title ?? basename(file)
      mkdirSync(join(HOME, 'preview'), { recursive: true })
      const out = join(HOME, 'preview', 'index.html')
      writeFileSync(out, `<!doctype html><html><head><meta charset="utf8"><title>${title}</title>
<style>body{max-width:42rem;margin:4rem auto;font-family:system-ui;line-height:1.7;padding:0 1rem}
pre{background:#f5f5f5;padding:1rem;overflow:auto}img{max-width:100%}</style></head><body>${html}</body></html>`)
      console.log(CYAN(out))
      break
    }

    case 'frontmatter': {
      const file = args[0]
      if (!file) die('usage: openpub frontmatter <file.md> [--format hugo|jekyll|astro|nextjs|devto|hashnode|ghost]')
      const format = (flag('format') ?? 'openpub') as FmFormat
      const known: FmFormat[] = ['openpub', 'hugo', 'jekyll', 'astro', 'nextjs', 'devto', 'hashnode', 'ghost']
      if (!known.includes(format)) die(`unknown format "${format}". known: ${known.join(', ')}`)
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
      const fm = buildFrontmatter(format, {
        title: data.title ?? 'Untitled',
        tags: data.tags.length ? data.tags : ['untagged'],
        description: data.description ?? '',
        canonical: data.canonical_url,
        slug: data.slug,
      })
      writeFileSync(file, fm + body)
      console.log(`${file}: frontmatter rewritten (${format})`)
      break
    }

    case 'audit': {
      const file = args[0]
      if (!file) die('usage: openpub audit <file.md>')
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
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

      const score = Math.max(20, 100 - issues.length * 9)
      console.log(`${BOLD('audit')} ${basename(file)}: ${score}/100`)
      for (const i of issues) console.log('  - ' + i)
      if (!issues.length) console.log('  ' + GREEN('looks good'))
      break
    }

    case 'check-links': {
      const file = args[0]
      if (!file) die('usage: openpub check-links <file.md>')
      const { body } = parseFrontmatter(readFileSync(file, 'utf8'))
      const urls = [...new Set([...body.matchAll(/https?:\/\/\S+/g)].map(m => m[0].replace(/[)\]"',.;]+$/, '')))]
      if (!urls.length) {
        console.log('no urls found')
        break
      }
      let bad = 0
      for (const u of urls) {
        try {
          const r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) })
          const flag = r.ok ? GREEN('+') : r.status < 500 ? YELLOW('~') : RED('x')
          if (!r.ok) bad++
          console.log(`  ${flag} ${r.status} ${DIM(u.slice(0, 90))}`)
        } catch (e) {
          bad++
          console.log(`  ${RED('x')} err ${DIM(u.slice(0, 90))}`)
        }
      }
      if (bad) die(`${bad} link(s) failed`)
      break
    }

    case 'help':
    case '--help':
    case undefined:
      usage()
      break

    default:
      die(`unknown command "${cmd}". run: openpub help`)
  }
} catch (e) {
  die(e instanceof Error ? e.message : String(e))
}
