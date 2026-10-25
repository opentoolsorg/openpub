#!/usr/bin/env node
// openpub - write once, publish everywhere.
// Local-first CLI. Credentials live in ~/.openpub/config.json (0600).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { publishFile, testPlatform } from '@openpub/core/publish'
import { parseFrontmatter, buildFrontmatter, type FmFormat } from '@openpub/core/frontmatter'
import { auditContent, frontmatterBuildOptions } from '@openpub/core/inspection'
import {
  loadConfig, removeCreds, storeCreds,
  configuredPlatforms, configPath, openpubHome,
} from '@openpub/core/config'
import { PLATFORMS, type PlatformName } from '@openpub/core/types'
import { extractFlags } from '@openpub/core/argv'
import { renderPreviewPage } from '@openpub/core/preview'

const VERSION = '0.1.0'
const CYAN = (s: string) => `[36m${s}[0m`
const DIM = (s: string) => `[2m${s}[0m`
const BOLD = (s: string) => `[1m${s}[0m`
const RED = (s: string) => `[31m${s}[0m`
const GREEN = (s: string) => `[32m${s}[0m`
const YELLOW = (s: string) => `[33m${s}[0m`

const args = process.argv.slice(2)
const cmd = args.shift()

function die(msg: string, code = 1): never {
  console.error(RED('error:'), msg)
  process.exit(code)
  throw new Error(`unreachable: ${msg}`)
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
    --status draft|published      publish state (default: draft)
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
      const home = openpubHome()
      mkdirSync(home, { recursive: true })
      const cfg = loadConfig()
      const creds = Object.keys(cfg.platforms).length
      console.log(`OpenPub home: ${CYAN(home)}`)
      console.log(`config: ${CYAN(configPath())} (${creds} platform${creds === 1 ? '' : 's'} configured)`)
      console.log(DIM('\nNext: openpub setup devto \'{"api_key": "..."}\''))
      console.log(DIM('Then:  openpub publish post.md --to devto,hashnode --dry-run'))
      break
    }

    case 'setup': {
      const [platform, credsArg] = args
      if (!platform || !credsArg) die('usage: openpub setup <platform> <json|file>')
      if (!isPlatform(platform)) die(`unknown platform "${platform}". available: ${PLATFORMS.join(', ')}`)
      let parsed: unknown
      try {
        parsed = existsSync(credsArg) ? JSON.parse(readFileSync(credsArg, 'utf8')) : JSON.parse(credsArg)
      } catch (e) {
        die(`invalid json: ${e instanceof Error ? e.message : e}`)
      }
      storeCreds(platform, parsed)
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
      const { flags, rest } = extractFlags(args, [
        { name: 'to' },
        { name: 'status' },
        { name: 'canonical' },
        { name: 'dry-run', boolean: true },
        { name: 'force', boolean: true },
      ])
      const file = rest[0]
      if (!file || rest.length !== 1) die('usage: openpub publish <file.md>')
      const to = flags.to?.split(',').map(s => s.trim()).filter(Boolean) as PlatformName[] | undefined
      if (flags.to !== undefined && !to?.length) die('--to requires a platform list')
      for (const t of to ?? []) if (!isPlatform(t)) die(`unknown platform "${t}"`)
      const status = flags.status
      if (status !== undefined && status !== 'draft' && status !== 'published') die('--status must be draft or published')

      console.log(BOLD(`publishing ${basename(file)}...`))
      const report = await publishFile(file, {
        to,
        canonical: flags.canonical,
        status: status as 'draft' | 'published' | undefined,
        dryRun: flags['dry-run'] === 'true',
        force: flags.force === 'true',
        onProgress: m => console.log('  ' + m),
      })
      console.log('')
      console.log(BOLD(report.title))
      if (report.canonical) console.log(`${DIM('canonical:')} ${report.canonical}`)
      for (const w of report.warnings ?? []) console.log(`  ${YELLOW('~')} ${w}`)
      for (const o of report.outcomes) {
        if (o.warning) console.log(`  ${YELLOW('~')} ${o.platform} ${YELLOW(o.warning)}`)
        else if (o.ok) console.log(`  ${GREEN('+')} ${o.platform}${o.skipped ? ' ' + DIM('(skipped)') : ''}${o.url ? ' ' + DIM(o.url) : ''}`)
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
      const title = data.title ?? basename(file)
      const home = openpubHome()
      mkdirSync(join(home, 'preview'), { recursive: true })
      const out = join(home, 'preview', 'index.html')
      writeFileSync(out, await renderPreviewPage(title, body))
      console.log(CYAN(out))
      break
    }

    case 'frontmatter': {
      const { flags, rest } = extractFlags(args, [{ name: 'format' }])
      const file = rest[0]
      if (!file || rest.length !== 1) die('usage: openpub frontmatter <file.md> [--format hugo|jekyll|astro|nextjs|devto|hashnode|ghost]')
      const format = (flags.format ?? 'openpub') as FmFormat
      const known: FmFormat[] = ['openpub', 'hugo', 'jekyll', 'astro', 'nextjs', 'devto', 'hashnode', 'ghost']
      if (!known.includes(format)) die(`unknown format "${format}". known: ${known.join(', ')}`)
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
      const fm = buildFrontmatter(format, frontmatterBuildOptions(data))
      writeFileSync(file, fm + body)
      console.log(`${file}: frontmatter rewritten (${format})`)
      break
    }

    case 'audit': {
      const file = args[0]
      if (!file) die('usage: openpub audit <file.md>')
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
      const { score, issues } = auditContent(body, data)
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
