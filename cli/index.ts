#!/usr/bin/env node
// openpost-cli — thin client for a self-hosted OpenPost worker.
// Usage: openpost <command> [args] [--flags]
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { pathToFileURL, fileURLToPath, URL as NodeURL } from 'node:url'

const VERSION = (() => {
  try { return JSON.parse(readFileSync(fileURLToPath(new NodeURL('../package.json', import.meta.url)), 'utf8')).version ?? '0.0.0' }
  catch { return '0.0.0' }
})()

const CFG = join(homedir(), '.openpost', 'config.json')
const cfg: { url?: string; key?: string } = existsSync(CFG) ? JSON.parse(readFileSync(CFG, 'utf8')) : {}

function save(o: object) {
  mkdirSync(join(homedir(), '.openpost'), { recursive: true })
  writeFileSync(CFG, JSON.stringify({ ...cfg, ...o }, null, 2))
}

function die(msg: string): never {
  console.error(`error: ${msg}`)
  process.exit(1)
  throw new Error('unreachable') // ponytail: satisfies `never` under workers-types globals
}

function need() {
  if (!cfg.url || !cfg.key) die(`not logged in — configure your worker first:\n  openpost login --url <worker-url> --key <admin-key>`)
}

async function call(path: string, method = 'GET', body?: any) {
  const r = await fetch(`${cfg.url}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({})) as any
  if (!r.ok) {
    if (r.status === 401) die('unauthorized — bad key or url; re-run: openpost login --url <worker-url> --key <admin-key>')
    die(j.error ?? `HTTP ${r.status}`)
  }
  return j
}

function parseFrontmatter(md: string) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) return { data: {} as Record<string, string>, body: md }
  const data: Record<string, any> = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    let v: any = kv[2].trim().replace(/^['"]|['"]$/g, '')
    if (v.startsWith('[')) v = v.replace(/[[\]]/g, '').split(',').map((s: string) => s.trim().replace(/['"]/g, '')).filter(Boolean)
    data[kv[1]] = v
  }
  return { data, body: m[2] }
}

const htmlShell = (title: string, bodyHtml: string) =>
  `<!doctype html><html><head><meta charset="utf8"><title>${title}</title><style>body{max-width:42rem;margin:4rem auto;font-family:system-ui;line-height:1.6;padding:0 1rem}pre{background:#f5f5f5;padding:1rem;overflow:auto}img{max-width:100%}</style></head><body>${bodyHtml}</body></html>`

type Args = { _: string[]; flag: (n: string) => string | undefined; has: (n: string) => boolean }

function parseArgs(argv: string[]): Args {
  const _: string[] = []
  const flags: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const eq = a.indexOf('=')
      if (eq >= 0) flags[a.slice(2, eq)] = a.slice(eq + 1)
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) flags[a.slice(2)] = argv[++i]
      else flags[a.slice(2)] = 'true'
    } else _.push(a)
  }
  return { _, flag: n => flags[n], has: n => n in flags }
}

const readMd = (file: string) => {
  if (!file) die('missing file argument')
  if (!existsSync(file)) die(`no such file: ${file}`)
  return parseFrontmatter(readFileSync(file, 'utf8'))
}

type Cmd = { usage: string; desc: string; auth?: boolean; run: (a: Args) => Promise<void> | void }

const commands: Record<string, Cmd> = {
  login: {
    usage: 'login --url <worker-url> --key <admin-key>',
    desc: 'Save worker URL and admin key to ~/.openpost/config.json',
    async run(a) {
      const url = a.flag('url'), key = a.flag('key')
      if (!url || !key) die('login requires --url <worker-url> and --key <admin-key>')
      if (!/^https?:\/\//.test(url)) die('--url must start with http:// or https://')
      save({ url: url.replace(/\/+$/, ''), key })
      console.log('saved to', CFG)
    },
  },
  status: {
    usage: 'status', desc: 'Show configured platforms', auth: true,
    async run() { console.log(JSON.stringify(await call('/api/status'), null, 2)) },
  },
  drafts: {
    usage: 'drafts', desc: 'List drafts', auth: true,
    async run() { console.log(JSON.stringify(await call('/api/drafts'), null, 2)) },
  },
  setup: {
    usage: "setup <platform> '<creds-json-or-file.json>'",
    desc: 'Store credentials for a platform (json string or path to json file)', auth: true,
    async run(a) {
      const [platform, credsJson] = a._
      if (!platform || !credsJson) die('usage: openpost setup <platform> <creds-json-or-file.json>')
      const creds = existsSync(credsJson) ? JSON.parse(readFileSync(credsJson, 'utf8')) : JSON.parse(credsJson)
      console.log(await call(`/api/platforms/${platform}`, 'POST', creds))
    },
  },
  test: {
    usage: 'test <platform>', desc: 'Verify stored credentials for a platform', auth: true,
    async run(a) {
      if (!a._[0]) die('usage: openpost test <platform>')
      console.log(await call(`/api/platforms/${a._[0]}/test`, 'POST'))
    },
  },
  draft: {
    usage: 'draft <file.md> [--to devto,hashnode] [--title "..."]',
    desc: 'Create a draft from a markdown file (frontmatter: title, platforms, cover_image)', auth: true,
    async run(a) { await draftOrPublish(a, false) },
  },
  publish: {
    usage: 'publish <file.md> [--to devto,hashnode] [--title "..."]',
    desc: 'Create a draft and enqueue publish jobs', auth: true,
    async run(a) { await draftOrPublish(a, true) },
  },
  retry: {
    usage: 'retry <draftId> <platform>',
    desc: 'Re-enqueue a failed publish job for one platform', auth: true,
    async run(a) {
      const [draftId, platform] = a._
      if (!draftId || !platform) die('usage: openpost retry <draftId> <platform>')
      console.log(await call(`/api/history/${draftId}/${platform}/retry`, 'POST'))
    },
  },
  history: {
    usage: 'history', desc: 'Show publish log', auth: true,
    async run() { console.log(JSON.stringify(await call('/api/history'), null, 2)) },
  },
  cover: {
    usage: 'cover <prompt words...> [--prompt "..."]',
    desc: 'Generate a cover image on the worker', auth: true,
    async run(a) {
      const prompt = a.flag('prompt') ?? (a._.length ? a._.join(' ') : die('cover needs a prompt: openpost cover <words...>'))
      console.log(await call('/api/images/generate', 'POST', { prompt }))
    },
  },
  preview: {
    usage: 'preview <file.md> [--no-open]',
    desc: 'Render markdown to HTML in ~/.openpost/preview/ and print a file:// URL',
    async run(a) {
      const file = a._[0]
      const { data, body } = readMd(file)
      const { marked } = await import('marked')
      const title = data.title ?? basename(file, '.md')
      const dir = join(homedir(), '.openpost', 'preview')
      mkdirSync(dir, { recursive: true })
      const out = join(dir, `${basename(file, '.md')}.html`)
      writeFileSync(out, htmlShell(title, marked.parse(body) as string))
      const url = pathToFileURL(out).href
      console.log(url)
      if (!a.has('no-open')) openUrl(out)
    },
  },
  docs: {
    usage: 'docs <dir>',
    desc: 'Render every .md file in <dir> to a static site in <dir>/site',
    async run(a) {
      const dir = a._[0] ?? '.'
      if (!existsSync(dir)) die(`no such directory: ${dir}`)
      const out = join(dir, 'site')
      mkdirSync(out, { recursive: true })
      const { marked } = await import('marked')
      const links: string[] = []
      for (const f of readdirSync(dir).filter((f: string) => f.endsWith('.md'))) {
        const { data, body } = parseFrontmatter(readFileSync(join(dir, f), 'utf8'))
        const name = f.replace(/\.md$/, '.html')
        writeFileSync(join(out, name), htmlShell(String(data.title ?? f), `<a href="index.html">&larr; index</a>${marked.parse(body)}`))
        links.push(`<li><a href="${name}">${data.title ?? name}</a></li>`)
      }
      writeFileSync(join(out, 'index.html'), htmlShell('Posts', `<h1>Posts</h1><ul>${links.join('')}</ul>`))
      console.log('site written to', out)
    },
  },
}

async function draftOrPublish(a: Args, publish: boolean) {
  const file = a._[0]
  const { data, body } = readMd(file)
  const platforms = a.flag('to')?.split(',') ?? data.platforms
  if (!platforms?.length) die('no platforms: add `platforms: [...]` to frontmatter or use --to')
  const title = a.flag('title') ?? data.title ?? basename(file, '.md')
  const j = await call('/api/drafts', 'POST', { title, content: body, platforms, cover_image: data.cover_image })
  console.log('draft:', j.id)
  if (publish) {
    const p = await call('/api/publish', 'POST', { draftId: j.id })
    console.log('published jobs:', JSON.stringify(p))
  }
}

function openUrl(path: string) {
  try {
    if (process.platform === 'darwin') execFileSync('open', [path], { stdio: 'ignore' })
    else if (process.platform === 'win32') execFileSync('cmd', ['/c', 'start', '', path], { stdio: 'ignore' })
    else execFileSync('xdg-open', [path], { stdio: 'ignore' })
  } catch { /* opening browser is best-effort; URL already printed */ }
}

function globalHelp() {
  console.log(`openpost ${VERSION} — CLI for a self-hosted OpenPost worker

usage: openpost <command> [args]  |  openpost <command> --help

commands:`)
  for (const c of Object.values(commands)) console.log(`  ${c.usage.padEnd(52)} ${c.desc}`)
  console.log(`
global flags:
  --version   print version
  --help      show this help (or per-command help)`)
}

function help(cmd?: string) {
  if (!cmd) return globalHelp()
  const c = commands[cmd]
  if (!c) die(`unknown command: ${cmd}\nrun 'openpost --help' for the command list`)
  console.log(`usage: openpost ${c.usage}\n\n${c.desc}`)
}

const a = parseArgs(process.argv.slice(2))
const cmd = a._[0]

try {
  if (a.has('version')) console.log(VERSION)
  else if (!cmd || a.has('help') && !commands[cmd]) help(cmd === 'help' ? a._[1] : undefined)
  else if (cmd === 'help') help(a._[1])
  else if (a.has('help')) help(cmd)
  else {
    const c = commands[cmd]
    if (!c) { console.error(`error: unknown command: ${cmd}\n`); globalHelp(); process.exit(1) }
    a._.shift() // consume command name
    if (c.auth) need()
    await c.run(a)
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
}
