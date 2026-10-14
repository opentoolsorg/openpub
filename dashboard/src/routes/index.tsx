import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Logo, Mark } from '~/components/Logo'

export const Route = createFileRoute('/')({
  component: Landing,
})

const GITHUB = 'https://github.com/princepal9120/openpub'
const DEPLOY =
  'https://deploy.workers.cloudflare.com/?url=https://github.com/princepal9120/openpub'

const PLATFORMS = [
  { slug: 'devdotto', label: 'dev.to' },
  { slug: 'hashnode', label: 'Hashnode' },
  { slug: 'medium', label: 'Medium' },
  { slug: 'ghost', label: 'Ghost' },
  { slug: 'wordpress', label: 'WordPress' },
  { slug: 'substack', label: 'Substack' },
  { slug: 'x', label: 'X Articles' },
  { slug: 'github', label: 'GitHub Pages' },
]

const AGENTS = [
  { slug: 'claude', label: 'Claude Code' },
  { slug: 'cursor', label: 'Cursor' },
  { slug: 'windsurf', label: 'Windsurf' },
  { slug: 'githubcopilot', label: 'Copilot' },
  { slug: 'zed', label: 'Zed' },
  { slug: 'openai', label: 'Codex' },
]

const MCP_SNIPPET = `claude mcp add --transport http openpub \\
  https://openpub.your-sub.workers.dev/mcp \\
  --header "Authorization: Bearer ADMIN_KEY"`

const MCP_JSON = `// .cursor/mcp.json (any MCP client)
{
  "mcpServers": {
    "openpub": {
      "url": "https://openpub.your-sub.workers.dev/mcp",
      "headers": { "Authorization": "Bearer ADMIN_KEY" }
    }
  }
}`

const CLI_DEMO = `npm i -g openpub-cli
openpub login --url https://openpub.your-sub.workers.dev
openpub publish post.md --to devto,hashnode,x

# from your agent, same thing
openpub docs ./posts          # static site
openpub status                # platforms wired`

const STEPS = [
  {
    n: '01',
    title: 'Clone and install',
    code: 'git clone https://github.com/princepal9120/openpub\ncd openpub && npm install',
  },
  {
    n: '02',
    title: 'Provision the free tier',
    code: 'npx wrangler d1 create openpub-db\nnpx wrangler kv namespace create KEYS\nnpx wrangler r2 bucket create openpub-media\nnpx wrangler queues create openpub-publish\nnpx wrangler secret put ADMIN_KEY',
  },
  {
    n: '03',
    title: 'Migrate and deploy',
    code: 'npx wrangler d1 execute openpub-db --file=migrations/init.sql\nnpm run deploy',
  },
]

const WIRE_PLATFORM = `openpub setup devto '{"api_key": "..."}'
openpub test devto        # verifies creds live
openpub publish post.md --to devto,hashnode,x`

const FEATURES = [
  {
    t: 'Any agent via MCP',
    d: 'One remote MCP server. Claude Code, Cursor, Windsurf, Codex, Zed, Copilot publish without local setup.',
  },
  {
    t: 'openpub-cli',
    d: 'Ship posts from your terminal or your agent shell. Drafts, platforms, publish history, all scriptable.',
  },
  {
    t: 'Canonical wiring',
    d: 'First success becomes the canonical URL. Every other platform links back to it.',
  },
  {
    t: 'Idempotent',
    d: 'Atomic claim rows mean retries and redeploys never double-post.',
  },
  {
    t: 'Your site too',
    d: 'The github-pages adapter commits markdown into your own repo. Your blog stays source of truth.',
  },
  {
    t: 'Zero cost',
    d: 'Workers + D1 + KV + R2 + Queues. Static SPA served free. Everything runs on the Cloudflare free tier.',
  },
]

// pipepost-style agent transcript: one prompt, full pipeline
const TRANSCRIPT: { t: 'user' | 'tool' | 'ok' | 'plain'; x: string }[] = [
  { t: 'user', x: '"Publish my-mcp-post.md to devto, hashnode and my ghost site, then show me the links."' },
  { t: 'tool', x: 'create_draft' },
  { t: 'plain', x: 'draft b31c9e · 2,140 words · tags mcp, cloudflare' },
  { t: 'tool', x: 'cover_image' },
  { t: 'plain', x: 'generated /covers/a91f… og:image wired' },
  { t: 'tool', x: 'publish → devto, hashnode, ghost' },
  { t: 'ok', x: 'published → dev.to/you/my-mcp-post' },
  { t: 'ok', x: 'published → hashnode.dev/@you/my-mcp-post' },
  { t: 'ok', x: 'published → you.ghost.io/my-mcp-post' },
  { t: 'plain', x: 'canonical → you.ghost.io/my-mcp-post' },
  { t: 'ok', x: 'done. 3/3 live. history saved.' },
]

const TOOL_GROUPS = [
  {
    n: '01',
    t: 'Draft',
    code: 'create_draft + get_draft + list_drafts',
    d: 'One markdown file in. Drafts, metadata, tags and canonical URL handled server-side.',
  },
  {
    n: '02',
    t: 'Publish',
    code: 'publish + retry + history',
    d: 'Fan out to 8 platforms with atomic claim rows. Retries never double-post.',
  },
  {
    n: '03',
    t: 'Platforms',
    code: 'setup + test + status',
    d: 'Wire credentials per platform, verify them live, see what is connected.',
  },
  {
    n: '04',
    t: 'Media',
    code: 'cover_image + upload_image',
    d: 'Generate covers, upload images to R2, wire og:image on every copy.',
  },
  {
    n: '05',
    t: 'Inspect',
    code: 'check_links + analytics',
    d: 'Validate outbound links pre-publish. Pull per-platform results after.',
  },
]

const FAQ = [
  {
    q: 'What is OpenPub?',
    a: 'A self-hosted cross-posting worker. One markdown file goes in; OpenPub ships it to every platform you wire, sets canonical URLs back to your site, and keeps an atomic publish log so retries never double-post.',
  },
  {
    q: 'How do agents use it?',
    a: 'OpenPub exposes a remote MCP server over streamable HTTP at /mcp. Add one header in Claude Code, Cursor, Windsurf, Codex or any MCP client and the agent gets 13 tools: drafts, publish, covers, setup, link checks.',
  },
  {
    q: 'Where do my keys live?',
    a: 'In your Cloudflare account. Platform credentials sit in your own D1 behind your ADMIN_KEY. Nothing is proxied through a third party. No telemetry, no external relay.',
  },
  {
    q: 'What does it cost?',
    a: 'Zero. It runs entirely on the Cloudflare free tier: Workers, D1, KV, R2, Queues, and static assets for this site. MIT-licensed, so fork it, rebrand it, ship it.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'dev.to, Hashnode, Medium, Ghost, WordPress, Substack, X Articles, and your own site via GitHub Pages. Each adapter handles tags, canonical URLs, and cover images where the platform allows.',
  },
  {
    q: 'Why not Buffer, Zapier, or Pipepost?',
    a: 'Those are SaaS relays or per-run credit meters. OpenPub is yours: self-hosted, MIT, no credits, no relay, no subscription. The agent calls your worker directly.',
  },
]

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function Landing() {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const handleCopy = (code: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedIndex(index)
        setTimeout(() => {
          setCopiedIndex((prev) => (prev === index ? null : prev))
        }, 2000)
      })
    }
  }

  return (
    <div className="landing relative min-h-screen bg-[#0a0c0b] font-sans text-zinc-200 antialiased selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Subtle radial emerald gradient backdrop */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-full max-w-5xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.07),transparent_70%)]"
        aria-hidden="true"
      />

      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <a href="/" className="transition-opacity hover:opacity-90">
          <Logo />
        </a>
        <div className="flex items-center gap-6 font-mono text-xs text-zinc-400">
          <a
            href="/docs"
            className="transition-colors duration-200 hover:text-zinc-100"
          >
            Docs
          </a>
          <a
            href={GITHUB}
            className="transition-colors duration-200 hover:text-zinc-100"
          >
            GitHub
          </a>
          <a
            href="/app"
            className="rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-1.5 text-zinc-200 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-950/20 hover:text-emerald-300 active:scale-[0.98]"
          >
            App
          </a>
        </div>
      </nav>

      <header className="mx-auto max-w-5xl px-6 pt-20 pb-16 md:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 font-mono text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          // Self-hosted on Cloudflare free tier
        </div>

        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl md:text-6xl md:leading-[1.1]">
          Write once. Your agent ships it{' '}
          <span className="text-emerald-400">everywhere</span>.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          One markdown file to dev.to, Hashnode, WordPress, Ghost, Medium,
          Substack, X Articles, and your own site. No subscription.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href={DEPLOY}
            className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-emerald-950 shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)] transition-all duration-200 hover:bg-emerald-400 hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.5)] active:scale-[0.98]"
          >
            Deploy to Cloudflare
          </a>
          <a
            href="/docs"
            className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/40 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-50 active:scale-[0.98]"
          >
            Read the docs
          </a>
        </div>
      </header>

      <Reveal>
        <section className="border-y border-zinc-900 bg-zinc-950/40">
          <div className="group/strip mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-4 px-6 py-6">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-600">
              publishes to
            </span>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
              {PLATFORMS.map((p) => (
                <span
                  key={p.slug}
                  className="group/item flex items-center gap-2 text-zinc-500 transition-all duration-200 hover:text-zinc-200 group-hover/strip:opacity-40 hover:!opacity-100"
                >
                  <img
                    src={`https://cdn.simpleicons.org/${p.slug}/e9eaec`}
                    alt={p.label}
                    className="h-[20px] w-[20px] object-contain opacity-50 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:scale-105"
                    loading="lazy"
                    width={20}
                    height={20}
                  />
                  <span className="text-xs tracking-tight transition-colors">
                    {p.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-wider text-emerald-500/80">
            setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Live in three steps.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Everything runs in your Cloudflare account. Provision, migrate,
            deploy. Then wire each platform with your keys and publish. Full
            detail in{' '}
            <a
              href="/docs"
              className="text-emerald-400 underline-offset-4 hover:underline"
            >
              the docs
            </a>
            .
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, idx) => (
            <Reveal key={s.n} delay={idx * 100}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/70 shadow-lg shadow-black/40 transition-all duration-200 hover:border-zinc-700 hover:shadow-emerald-950/20">
                {/* Terminal Window Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80 transition-opacity group-hover:opacity-100" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80 transition-opacity group-hover:opacity-100" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="font-mono text-[11px] text-zinc-400">
                    <span className="text-emerald-400/90">{s.n}</span>
                    <span className="mx-1.5 text-zinc-600">/</span>
                    <span>{s.title.toLowerCase().replace(/[\s,]+/g, '-')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(s.code, idx)}
                    aria-label="Copy snippet"
                    className="!m-0 !inline-flex !h-6 !items-center !gap-1 !rounded !border !border-zinc-800 !bg-zinc-900/90 !px-2 !py-0 !text-[11px] !font-mono !text-zinc-400 !transition-colors hover:!border-zinc-700 hover:!bg-zinc-800 hover:!text-zinc-100 active:!scale-95"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <svg
                          className="h-3 w-3 text-emerald-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-emerald-400">copied</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3 w-3 text-zinc-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Terminal Body */}
                <div className="flex-1 p-4 font-mono text-xs">
                  <div className="mb-2 text-[11px] text-zinc-500">
                    # {s.title}
                  </div>
                  <div className="space-y-1.5">
                    {s.code.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="flex items-start text-zinc-300">
                        <span className="mr-2 select-none font-mono text-emerald-400/70">
                          $
                        </span>
                        <span className="break-all font-mono leading-relaxed">
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-wider text-emerald-500/80">
            agent-native
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Drive it from any agent.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            One remote MCP server over streamable HTTP. Point your agent at it,
            paste the key, publish. 13 tools: drafts, platforms, publish,
            covers, link checks.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
            {AGENTS.map((a) => (
              <span
                key={a.slug}
                className="group/item flex items-center gap-2 text-zinc-500 transition-all duration-200 hover:text-zinc-200"
              >
                <img
                  src={`https://cdn.simpleicons.org/${a.slug}/e9eaec`}
                  alt={a.label}
                  className="h-[18px] w-[18px] object-contain opacity-50 transition-all duration-200 group-hover/item:opacity-100"
                  loading="lazy"
                  width={18}
                  height={18}
                />
                <span className="text-xs tracking-tight">{a.label}</span>
              </span>
            ))}
            <span className="font-mono text-xs text-zinc-600">
              + any MCP client
            </span>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[MCP_SNIPPET, MCP_JSON].map((code, idx) => (
            <Reveal key={idx} delay={idx * 100}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/70 shadow-lg shadow-black/40 transition-all duration-200 hover:border-zinc-700">
                <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
                  </div>
                  <div className="font-mono text-[11px] text-zinc-400">
                    <span className="text-emerald-400/90">mcp</span>
                    <span className="mx-1.5 text-zinc-600">/</span>
                    <span>{idx === 0 ? 'claude-code' : 'mcp.json'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(code, 10 + idx)}
                    aria-label="Copy snippet"
                    className="!m-0 !inline-flex !h-6 !items-center !gap-1 !rounded !border !border-zinc-800 !bg-zinc-900/90 !px-2 !py-0 !text-[11px] !font-mono !text-zinc-400 !transition-colors hover:!border-zinc-700 hover:!bg-zinc-800 hover:!text-zinc-100 active:!scale-95"
                  >
                    {copiedIndex === 10 + idx ? (
                      <span className="text-emerald-400">copied</span>
                    ) : (
                      <span>copy</span>
                    )}
                  </button>
                </div>
                <pre className="flex-1 overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre">
                  {code}
                </pre>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="group relative mt-5 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/70 shadow-lg shadow-black/40 transition-all duration-200 hover:border-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
              </div>
              <div className="font-mono text-[11px] text-zinc-400">
                <span className="text-emerald-400/90">cli</span>
                <span className="mx-1.5 text-zinc-600">/</span>
                <span>openpub-cli</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(CLI_DEMO, 20)}
                aria-label="Copy snippet"
                className="!m-0 !inline-flex !h-6 !items-center !gap-1 !rounded !border !border-zinc-800 !bg-zinc-900/90 !px-2 !py-0 !text-[11px] !font-mono !text-zinc-400 !transition-colors hover:!border-zinc-700 hover:!bg-zinc-800 hover:!text-zinc-100 active:!scale-95"
              >
                {copiedIndex === 20 ? (
                  <span className="text-emerald-400">copied</span>
                ) : (
                  <span>copy</span>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre">
              {CLI_DEMO}
            </pre>
          </div>
        </Reveal>

        {/* agent transcript — pipepost-style "one prompt, full pipeline" */}
        <Reveal delay={100}>
          <div className="mt-10">
            <p className="font-mono text-xs uppercase tracking-wider text-emerald-500/80">
              one prompt. full pipeline.
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              Tell your agent what to ship. OpenPub does the rest.
            </h3>
          </div>
          <div className="mt-5 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/70 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
              </div>
              <div className="font-mono text-[11px] text-zinc-400">
                <span className="text-emerald-400/90">mcp</span>
                <span className="mx-1.5 text-zinc-600">/</span>
                <span>agent transcript</span>
              </div>
            </div>
            <div className="space-y-2.5 p-5 font-mono text-xs leading-relaxed">
              {TRANSCRIPT.map((l, i) =>
                l.t === 'user' ? (
                  <p key={i} className="text-zinc-100">
                    <span className="mr-2 text-zinc-600">you:</span>
                    {l.x}
                  </p>
                ) : l.t === 'tool' ? (
                  <p key={i} className="text-zinc-500">
                    <span className="mr-2 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      tool
                    </span>
                    {l.x}
                  </p>
                ) : l.t === 'ok' ? (
                  <p key={i} className="text-emerald-400">
                    <span className="mr-1.5">✓</span>
                    {l.x}
                  </p>
                ) : (
                  <p key={i} className="pl-3 text-zinc-500">
                    {l.x}
                  </p>
                )
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* tool groups — numbered like pipepost */}
      <section className="border-t border-zinc-900 bg-zinc-950/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-wider text-emerald-500/80">
              13 tools
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              One pipeline. Every tool does one thing.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
              Chain them in natural language or call them direct. Same surface
              over MCP, REST, and the CLI.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-800/60 sm:grid-cols-2 lg:grid-cols-3">
            {TOOL_GROUPS.map((g, idx) => (
              <Reveal key={g.n} delay={idx * 60}>
                <div className="group h-full bg-[#0a0c0b] p-6 transition-colors duration-200 hover:bg-zinc-900/40">
                  <p className="font-mono text-xs text-emerald-500/80">{g.n}</p>
                  <h3 className="mt-2 text-sm font-semibold tracking-tight text-zinc-100">
                    {g.t}
                  </h3>
                  <p className="mt-1.5 font-mono text-[11px] text-zinc-500">
                    {g.code}
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
                    {g.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-wider text-emerald-500/80">
            features
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Write once. Publish everywhere.
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-800/60 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.t}
                className="group relative bg-[#0a0c0b] p-6 transition-all duration-200 hover:bg-zinc-900/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 transition-all duration-200 group-hover:scale-125 group-hover:bg-emerald-300 group-hover:shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-100 transition-colors duration-200 group-hover:text-zinc-50">
                    {f.t}
                  </h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 transition-colors duration-200 group-hover:text-zinc-300">
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* faq */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Questions.
            </h2>
          </Reveal>
          <div className="mt-8 divide-y divide-zinc-900">
            {FAQ.map((f, idx) => (
              <Reveal key={f.q} delay={idx * 40}>
                <div className="py-5">
                  <h3 className="text-sm font-semibold text-zinc-100">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {f.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900">
        <Reveal>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8">
            <Logo className="opacity-70" />
            <div className="flex items-center gap-6 font-mono text-xs text-zinc-500">
              <a
                href="/docs"
                className="transition-colors duration-200 hover:text-zinc-200"
              >
                Docs
              </a>
              <a
                href={GITHUB}
                className="transition-colors duration-200 hover:text-zinc-200"
              >
                GitHub
              </a>
              <a
                href="/app"
                className="transition-colors duration-200 hover:text-zinc-200"
              >
                App
              </a>
            </div>
          </div>
        </Reveal>
      </footer>
    </div>
  )
}
