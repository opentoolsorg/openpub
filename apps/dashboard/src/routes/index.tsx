import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Logo } from '~/components/Logo'
import { ThemeToggle } from '~/components/ThemeToggle'

export const Route = createFileRoute('/')({
  component: Landing,
})

const GITHUB = 'https://github.com/princepal9120/openpub'
const DOCS = '/docs'

interface PlatformInfo {
  slug: string
  label: string
  logo: string
  hex: string
  limitType: 'update' | 'create-only' | 'draft-only'
}

const PLATFORMS: PlatformInfo[] = [
  { slug: 'devdotto', label: 'dev.to', logo: 'devto', hex: '#0A0A0A', limitType: 'update' },
  { slug: 'hashnode', label: 'Hashnode', logo: 'hashnode', hex: '#2962FF', limitType: 'update' },
  { slug: 'wordpress', label: 'WordPress', logo: 'wordpress', hex: '#21759B', limitType: 'update' },
  { slug: 'ghost', label: 'Ghost', logo: 'ghost', hex: '#15171A', limitType: 'update' },
  { slug: 'medium', label: 'Medium', logo: 'medium', hex: '#000000', limitType: 'create-only' },
  { slug: 'substack', label: 'Substack', logo: 'substack', hex: '#FF6719', limitType: 'draft-only' },
  { slug: 'github', label: 'GitHub Pages', logo: 'github', hex: '#181717', limitType: 'update' },
  { slug: 'x', label: 'X Articles', logo: 'x', hex: '#000000', limitType: 'create-only' },
]

// Grok Bot setup is unverified, so it stays out of the headline; 8 slots keep both rotators in sync.
const HERO_SOURCES = [
  ['Claude Code', 'claude-code'],
  ['Codex', 'codex'],
  ['Cursor', 'cursor'],
  ['Copilot', 'copilot'],
  ['OpenCode', 'opencode'],
  ['Hermes Agent', 'hermes'],
  ['OpenClaw', 'openclaw'],
  ['your terminal', 'terminal'],
]

// Offsets each word's blur-fade into its 3s slot of the 24s rotation; slot 8 repeats slot 0.
const rotSlot = (i: number) => ({ animationDelay: `${i % 8 ? (i % 8) * 3 - 24 : 0}s` })

const AGENT_LOGOS: Record<string, string> = {
  claude: 'claude-code',
  codex: 'codex',
  cursor: 'cursor',
  copilot: 'copilot',
  hermes: 'hermes',
  opencode: 'opencode',
  openclaw: 'openclaw',
  grokbot: 'grok',
}

interface AgentTab {
  id: string
  name: string
  slug?: string
  customIcon?: 'C' | 'H' | 'OC' | 'CL' | 'G' | 'CLI'
  transport?: string
  blocked?: boolean
  blockedTitle?: string
  blockedBody?: string
  blockedLink?: string
  steps?: {
    n: string
    title: string
    lead: string
    monoLead?: string
    tail?: string
    code: string
    isProse?: boolean
    status?: string
  }[]
}

const BUILD_SERVER_STEP = {
  n: '01',
  title: 'Build the server',
  lead: 'OpenPub is not on npm yet, so build it once from the repository:',
  code: 'git clone https://github.com/princepal9120/openpub\ncd openpub/apps/mcp\nnpm install && npm run build',
}

const MCP_PATH = '/path/to/openpub/apps/mcp/dist/index.js'
const ASK_PROMPT = 'Check the links in post.md, then do a dry run to dev.to and Hashnode.'

const AGENT_CLIENTS: AgentTab[] = [
  {
    id: 'cli',
    name: 'CLI',
    customIcon: 'CLI',
    transport: 'Terminal · Node 22+',
    steps: [
      {
        n: '01',
        title: 'Build the CLI',
        lead: 'OpenPub is not on npm yet. Clone and compile the CLI locally:',
        code: 'git clone https://github.com/princepal9120/openpub\ncd openpub\nnpm install\nnpm run cli:build',
      },
      {
        n: '02',
        title: 'Store a platform key',
        lead: 'Credentials save directly to',
        monoLead: '~/.openpub/config.json',
        tail: 'from a private file outside the repo:',
        code: 'node apps/cli/dist/index.js setup devto /absolute/private/path/devto.json\nnode apps/cli/dist/index.js status',
      },
      {
        n: '03',
        title: 'Dry-run a post',
        lead: 'Test the plan before shipping. Drafts stay default:',
        code: 'node apps/cli/dist/index.js publish post.md --to devto --status draft --dry-run',
      },
    ],
  },
  {
    id: 'claude',
    name: 'Claude Code',
    slug: 'claude',
    transport: 'Local stdio server · Node 22+',
    steps: [
      BUILD_SERVER_STEP,
      {
        n: '02',
        title: 'Add to .mcp.json',
        lead: 'Point your Claude Code configuration at the built server:',
        code: `{\n  "mcpServers": {\n    "openpub": {\n      "command": "node",\n      "args": ["${MCP_PATH}"]\n    }\n  }\n}`,
      },
      {
        n: '03',
        title: 'Restart and prompt',
        lead: 'Restart Claude Code. 10 tools load instantly with drafts by default:',
        code: ASK_PROMPT,
        isProse: true,
      },
    ],
  },
  {
    id: 'codex',
    name: 'Codex',
    customIcon: 'C',
    transport: 'Local stdio server · Node 20+',
    steps: [
      BUILD_SERVER_STEP,
      {
        n: '02',
        title: 'Add to config.toml',
        lead: 'Register OpenPub in ~/.codex/config.toml:',
        code: `[mcp_servers.openpub]\ncommand = "node"\nargs = ["${MCP_PATH}"]`,
      },
      {
        n: '03',
        title: 'Restart and prompt',
        lead: 'Restart Codex and request publishing actions:',
        code: ASK_PROMPT,
        isProse: true,
      },
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    slug: 'cursor',
    transport: 'Local stdio server · Node 20+',
    steps: [
      BUILD_SERVER_STEP,
      {
        n: '02',
        title: 'Add to .cursor/mcp.json',
        lead: 'Configure OpenPub as a stdio MCP server:',
        code: `{\n  "mcpServers": {\n    "openpub": {\n      "type": "stdio",\n      "command": "node",\n      "args": ["${MCP_PATH}"]\n    }\n  }\n}`,
      },
      {
        n: '03',
        title: 'Restart and prompt',
        lead: 'Restart Cursor and prompt Composer or Chat:',
        code: ASK_PROMPT,
        isProse: true,
      },
    ],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    slug: 'githubcopilot',
    transport: 'Local stdio server · VS Code',
    steps: [
      BUILD_SERVER_STEP,
      {
        n: '02',
        title: 'Add to .vscode/mcp.json',
        lead: 'Configure the server in your workspace .vscode/mcp.json:',
        code: `{\n  "servers": {\n    "openpub": {\n      "type": "stdio",\n      "command": "node",\n      "args": ["${MCP_PATH}"]\n    }\n  }\n}`,
      },
      {
        n: '03',
        title: 'Start server & prompt',
        lead: 'Start the server from VS Code and use Copilot agent mode:',
        code: ASK_PROMPT,
        isProse: true,
      },
    ],
  },
  {
    id: 'hermes',
    name: 'Hermes Agent',
    customIcon: 'H',
    transport: 'Local stdio server · YAML config',
    steps: [
      BUILD_SERVER_STEP,
      {
        n: '02',
        title: 'Add to config.yaml',
        lead: 'Register the server in ~/.hermes/config.yaml:',
        code: `mcp_servers:\n  openpub:\n    command: "node"\n    args: ["${MCP_PATH}"]`,
      },
      {
        n: '03',
        title: 'Restart and prompt',
        lead: 'Restart Hermes Agent so it re-reads its MCP server catalog:',
        code: ASK_PROMPT,
        isProse: true,
      },
    ],
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    customIcon: 'OC',
    transport: 'Local stdio server · OpenCode V2',
    steps: [
      BUILD_SERVER_STEP,
      {
        n: '02',
        title: 'Add to opencode.json',
        lead: 'Register OpenPub under mcp.servers in opencode.json:',
        code: `{\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    "servers": {\n      "openpub": {\n        "type": "local",\n        "command": ["node", "${MCP_PATH}"]\n      }\n    }\n  }\n}`,
      },
      {
        n: '03',
        title: 'Restart and prompt',
        lead: 'Restart OpenCode and ask to draft or inspect:',
        code: ASK_PROMPT,
        isProse: true,
      },
    ],
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    customIcon: 'CL',
    transport: 'CLI registry · OpenClaw gateway',
    steps: [
      BUILD_SERVER_STEP,
      {
        n: '02',
        title: 'Register and probe',
        lead: 'Register the OpenPub executable with OpenClaw and probe it:',
        code: `openclaw mcp add openpub --command node --arg ${MCP_PATH}\nopenclaw mcp probe openpub`,
      },
      {
        n: '03',
        title: 'Prompt your agent',
        lead: 'Once probed successfully, OpenPub tools are active:',
        code: ASK_PROMPT,
        isProse: true,
      },
    ],
  },
  {
    id: 'grokbot',
    name: 'Grok Bot',
    customIcon: 'G',
    blocked: true,
    transport: 'Setup not verified',
    blockedTitle: 'OpenPub setup for Grok Bot has not been verified',
    blockedBody:
      'Grok Bot connects supported apps through Connect apps: you search for an app, add it, then authorize it. We have not verified an OpenPub connection in Connect apps yet, so there is no verified config snippet here.',
    blockedLink: 'https://docs.x.ai/grok-bot/computer-and-apps',
  },
]

const HOW_STEPS = [
  {
    n: '01',
    title: 'Write in Markdown',
    desc: 'Frontmatter picks the platforms, tags and status. The file stays in your repo.',
  },
  {
    n: '02',
    title: 'Check the plan',
    desc: 'A dry run, from you or your agent, shows what each platform will do before anything is sent.',
  },
  {
    n: '03',
    title: 'Publish and keep the record',
    desc: 'Canonical URLs are wired, and every result lands in a ledger you own.',
  },
]

const CORE_PRINCIPLES = [
  {
    title: '8 platforms',
    desc: 'dev.to, Hashnode, WordPress, Ghost, Medium, Substack, GitHub Pages, and X Articles, each handled by its dedicated adapter.',
  },
  {
    title: 'Canonical URLs wired',
    desc: 'The first public URL becomes the canonical reference for every subsequent platform, or pin a custom canonical_url.',
  },
  {
    title: 'Drafts by default',
    desc: 'The CLI and MCP server create drafts first. A post goes live only when you explicitly set status to published.',
  },
  {
    title: 'Publish log and retries',
    desc: 'Every attempt is logged. Network and 5xx errors can retry safely; 4xx failures are flagged. One failure never halts others.',
  },
  {
    title: 'Idempotent republish',
    desc: 'Unchanged articles are skipped. Edits update the existing post in place where supported, never creating unwanted duplicates.',
  },
  {
    title: 'Self-host on Cloudflare',
    desc: 'Optional Worker backed by D1, KV, R2, and Queues on your Cloudflare account. Complete control, zero third-party proxy.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'Which agents can use it?',
    a: 'Any MCP client that runs a local stdio server, including Claude Code, Codex, Cursor, GitHub Copilot in VS Code, OpenCode, Hermes Agent and OpenClaw. Your agent gets the same publishing engine as the CLI, and drafts stay the default. Grok Bot setup has not been verified yet.',
  },
  {
    q: 'Do I need to host anything?',
    a: 'No. The CLI and local MCP server run on your machine using Node 22+. The web console and API are optional, and you host them on your own Cloudflare account. Build from the repository; the npm package is not released yet.',
  },
  {
    q: 'Where do my credentials go?',
    a: 'With the CLI and local MCP server, into ~/.openpub/config.json on your machine. They are sent to the platform you publish to. With the optional console, they are stored as JSON in your instance’s D1 database, behind your ADMIN_KEY.',
  },
  {
    q: 'Can it publish something by accident?',
    a: 'The CLI and MCP default to draft. A post goes live with --status published, status: published in frontmatter, or defaults.status in your config. The web console publishes live after confirmation; Substack creates a draft instead.',
  },
  {
    q: 'Is the Cloudflare deploy one click?',
    a: 'No. You create D1, KV, R2 and a Queue, put your own IDs in wrangler.toml, run the migration, set ADMIN_KEY, then deploy. R2 and Queues may need enabling on your account.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className={`overflow-hidden rounded-xl border transition-colors duration-200 ${open ? 'border-(--accent-strong)/40 bg-(--surface)' : 'border-(--border) bg-(--surface)/60 hover:border-(--surface4)'}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-(--accent)">
        <span className={`text-sm font-medium transition-colors ${open ? 'text-(--fg)' : 'text-(--fg3) group-hover:text-(--fg)'}`}>{q}</span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${open ? 'rotate-45 border-(--accent-strong)/40 bg-(--accent-strong)/10 text-(--accent)' : 'border-(--border) bg-(--surface2)/60 text-(--dim3) group-hover:text-(--dim)'}`} aria-hidden="true">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      {open && <p className="border-t border-(--border)/60 px-5 pt-3.5 pb-5 text-sm leading-relaxed text-(--dim)">{a}</p>}
    </div>
  )
}


function Landing() {
  const [activeTabId, setActiveTabId] = React.useState('cli')
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [copyFailedKey, setCopyFailedKey] = React.useState<string | null>(null)
  const [panelAnimKey, setPanelAnimKey] = React.useState(0)

  // Motion refs: permanently stop auto-advance on user click/copy; pause on hover/focus/hidden
  const manualInteractedRef = React.useRef(false)
  const isHoveredRef = React.useRef(false)
  const isFocusedRef = React.useRef(false)

  // Auto-advance setup tabs at 6s; pause on hover/focus/hidden, permanently stop on user interaction; listen to reduced-motion preference changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let isReduced = mediaQuery.matches

    const ids = AGENT_CLIENTS.filter((client) => !client.blocked).map((c) => c.id)
    let timer: number | undefined

    const clearTimer = () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
        timer = undefined
      }
    }

    const advance = () => {
      clearTimer()
      if (isReduced || manualInteractedRef.current) return

      timer = window.setTimeout(() => {
        if (
          isReduced ||
          manualInteractedRef.current ||
          isHoveredRef.current ||
          isFocusedRef.current ||
          document.hidden
        ) {
          advance()
          return
        }
        setActiveTabId((currentId) => {
          const idx = ids.indexOf(currentId)
          return ids[(idx + 1) % ids.length]
        })
        setPanelAnimKey((prev) => prev + 1)
        advance()
      }, 6000)
    }

    const onMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
      isReduced = e.matches
      if (isReduced) {
        clearTimer()
      } else {
        advance()
      }
    }

    if (!isReduced) {
      advance()
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onMotionChange)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(onMotionChange)
    }

    return () => {
      clearTimer()
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', onMotionChange)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(onMotionChange)
      }
    }
  }, [])

  const selectTabManually = (tabId: string) => {
    manualInteractedRef.current = true
    if (tabId !== activeTabId) {
      setActiveTabId(tabId)
      setPanelAnimKey((prev) => prev + 1)
    }
  }

  const activeClient =
    AGENT_CLIENTS.find((c) => c.id === activeTabId) || AGENT_CLIENTS[0]

  const handleCopy = (code: string, key: string) => {
    manualInteractedRef.current = true
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setCopiedKey(key)
          setCopyFailedKey(null)
          setTimeout(() => {
            setCopiedKey((prev) => (prev === key ? null : prev))
          }, 2200)
        })
        .catch(() => {
          setCopyFailedKey(key)
          setCopiedKey(null)
          setTimeout(() => {
            setCopyFailedKey((prev) => (prev === key ? null : prev))
          }, 2200)
        })
    } else {
      setCopyFailedKey(key)
      setCopiedKey(null)
      setTimeout(() => {
        setCopyFailedKey((prev) => (prev === key ? null : prev))
      }, 2200)
    }
  }

  return (
    <div className="landing relative min-h-screen bg-(--bg) font-sans text-(--fg3) antialiased selection:bg-(--accent-strong)/30 overflow-x-hidden">
      {/* Canvas Scoped Styles for Editorial Motion, Tab Transitions, and Reduced-Motion */}
      <style>{`
        .lp-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }
        .lp-ed {
          margin: 0;
          font-size: clamp(38px, 6vw, 76px);
          line-height: 1.05;
          font-weight: 600;
          letter-spacing: -0.04em;
          color: var(--fg);
        }
        .lp-ed-rot {
          display: block;
          height: 1.1em;
          overflow: hidden;
        }
        .lp-ed-list {
          display: flex;
          flex-direction: column;
          animation: lpRot 24s cubic-bezier(0.77, 0, 0.175, 1) infinite;
        }
        .lp-ed:hover .lp-ed-list,
        .lp-ed:focus-within .lp-ed-list { animation-play-state: paused; }
        .lp-ed-item {
          height: 1.1em;
          flex: none;
          align-items: center;
          color: var(--accent);
          white-space: nowrap;
        }
        .lp-ed-list .lp-ed-item { display: flex; gap: .18em; }
        .lp-ed-logo { display: inline-flex; align-items: center; justify-content: center; flex: none; width: .8em; height: .8em; border-radius: .22em; transform: rotate(-6deg); box-shadow: inset 0 0 0 .02em rgba(255, 255, 255, .18); }
        .lp-ed-logo > span { width: .48em; height: .48em; background: #fff; }
        .lp-hero-ed { font-size: clamp(40px, 6.6vw, 88px); line-height: 1.02; letter-spacing: -0.045em; text-align: center; }
        .lp-hero-ed .lp-ed-item { justify-content: center; color: var(--fg); }
        .lp-hero-ed .lp-ed-list .lp-ed-item { gap: .22em; }
        .lp-hero-ed .lp-from-item { color: var(--dim2); }
        .lp-hero-ed .lp-ed-list .lp-ed-item { animation: lpItem 24s cubic-bezier(0.77, 0, 0.175, 1) infinite; }
        .lp-ed:hover .lp-ed-list .lp-ed-item { animation-play-state: paused; }
        @keyframes lpItem {
          0%, 10% { opacity: 1; filter: blur(0); }
          12.5%, 97.5% { opacity: 0; filter: blur(8px); }
          100% { opacity: 1; filter: blur(0); }
        }
        .lp-hero > * { animation: lpHeroIn .5s cubic-bezier(0.23, 1, 0.32, 1) both; }
        .lp-hero > :nth-child(2) { animation-delay: 60ms; }
        .lp-hero > :nth-child(3) { animation-delay: 120ms; }
        .lp-hero > :nth-child(4) { animation-delay: 180ms; }
        @keyframes lpHeroIn { from { opacity: 0; transform: translateY(12px); filter: blur(4px); } }
        @media (prefers-reduced-motion: reduce) {
          .lp-hero > * { animation: none; }
        }
        .lp-from-item .lp-ed-fade { display: inline; padding-right: .04em; }
        .lp-src-mark { width: .62em; height: .62em; flex: none; background: currentColor; }
        .lp-ed-static { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .lp-ed-static { display: flex; }
          .lp-ed-list { display: none; }
        }
        .lp-ed-fade {
          display: block;
          padding-bottom: 0.08em;
          background: linear-gradient(180deg, var(--fg) 10%, var(--dim2) 62%, var(--surface4) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        @media (forced-colors: active) {
          .lp-ed-fade {
            background: none;
            color: CanvasText;
            -webkit-background-clip: unset;
            background-clip: unset;
          }
        }
        @keyframes lpRot {
          0%, 10% { transform: translateY(0); }
          12.5%, 22.5% { transform: translateY(-1.1em); }
          25%, 35% { transform: translateY(-2.2em); }
          37.5%, 47.5% { transform: translateY(-3.3em); }
          50%, 60% { transform: translateY(-4.4em); }
          62.5%, 72.5% { transform: translateY(-5.5em); }
          75%, 85% { transform: translateY(-6.6em); }
          87.5%, 97.5% { transform: translateY(-7.7em); }
          100% { transform: translateY(-8.8em); }
        }
        @keyframes lpInA {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes lpInB {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
        .lp-in-a { animation: lpInA 200ms ease-out; }
        .lp-in-b { animation: lpInB 200ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .lp-ed-list,
          .lp-ed-fade,
          .lp-in-a,
          .lp-in-b {
            animation: none !important;
            transition: none !important;
          }
          .lp-ed-fade {
            background: none !important;
            -webkit-background-clip: unset !important;
            color: var(--dim) !important;
          }
        }
      `}</style>

      {/* Subtle emerald radial background glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[560px] w-full max-w-6xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)]"
        aria-hidden="true"
      />

      {/* Navigation */}
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
      >
        <a href="/" className="transition-opacity hover:opacity-90">
          <Logo />
        </a>
        <div className="flex items-center gap-3 sm:gap-6 text-[15px] font-medium text-(--dim)">


          <a
            href="#features"
            className="hidden sm:inline transition-colors duration-200 hover:text-(--fg)"
          >
            Features
          </a>
          <a
            href="#self-host"
            className="hidden md:inline transition-colors duration-200 hover:text-(--fg)"
          >
            Self-host
          </a>
          <a
            href={GITHUB}
            className="hidden sm:inline transition-colors duration-200 hover:text-(--fg)"
          >
            GitHub
          </a>
          <ThemeToggle />
          <a
            href={DOCS}
            className="inline-flex items-center justify-center min-h-[44px] px-4.5 rounded-xl border border-(--surface4) bg-(--surface2) text-[15px] font-medium text-(--fg) transition-all duration-200 hover:bg-(--surface3)"
          >
            Read the docs
          </a>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="lp-hero mx-auto max-w-6xl px-6 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-(--accent-strong)/30 bg-(--accent-strong)/10 px-3.5 py-1 font-mono text-xs font-medium text-(--accent)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
          <span>Open source · MIT · MCP server included</span>
        </div>

        <h1 className="lp-ed lp-hero-ed mt-8">
          <span className="lp-sr">Publish articles to eight platforms from Claude Code, Codex, Cursor or your terminal.</span>
          <span aria-hidden="true" style={{ display: 'block', color: 'var(--fg)' }}>
            Publish articles to
          </span>
          <span aria-hidden="true" className="lp-ed-rot">
            <span className="lp-ed-static lp-ed-item">eight platforms</span>
            <span className="lp-ed-list">
              {[...PLATFORMS, PLATFORMS[0]].map((p, idx) => (
                <span key={idx} className="lp-ed-item" style={rotSlot(idx)}>
                  <span className="lp-ed-logo" style={{ background: p.hex }}>
                    <span
                      style={{
                        mask: `url(/logos/${p.logo}.svg) center/contain no-repeat`,
                        WebkitMask: `url(/logos/${p.logo}.svg) center/contain no-repeat`,
                      }}
                    />
                  </span>
                  {p.label}
                </span>
              ))}
            </span>
          </span>
          <span aria-hidden="true" className="lp-ed-fade">from</span>
          <span aria-hidden="true" className="lp-ed-rot">
            <span className="lp-ed-static lp-ed-item lp-from-item"><span className="lp-ed-fade">your agent.</span></span>
            <span className="lp-ed-list">
              {[...HERO_SOURCES, HERO_SOURCES[0]].map(([name, logo], idx) => (
                <span key={idx} className="lp-ed-item lp-from-item" style={rotSlot(idx)}>
                  <span
                    className="lp-src-mark"
                    style={{
                      mask: `url(/logos/${logo}.svg) center/contain no-repeat`,
                      WebkitMask: `url(/logos/${logo}.svg) center/contain no-repeat`,
                    }}
                  />
                  <span className="lp-ed-fade">{name}.</span>
                </span>
              ))}
            </span>
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-(--dim) sm:text-lg">
          Write in Markdown once. OpenPub sends it everywhere as a draft,
          and nothing goes live until you say so.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href={DOCS}
            className="inline-flex items-center justify-center rounded-lg bg-(--accent-strong) px-5 py-2.5 text-sm font-semibold text-(--on-accent) shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)] transition-all duration-200 hover:bg-(--accent) hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.5)] active:scale-[0.98]"
          >
            Read the docs
          </a>
          <a
            href="https://openpub.princepal.dev/llms.txt"
            className="inline-flex items-center justify-center rounded-lg border border-(--border) bg-(--surface2)/50 px-5 py-2.5 text-sm font-semibold text-(--fg3) transition-all duration-200 hover:border-(--surface4) hover:bg-(--surface2) hover:text-(--fg) active:scale-[0.98]"
          >
            Agent guide (llms.txt)
          </a>
          <a
            href="#self-host"
            className="inline-flex items-center justify-center rounded-lg border border-(--border) bg-(--surface2)/50 px-5 py-2.5 text-sm font-semibold text-(--fg3) transition-all duration-200 hover:border-(--surface4) hover:bg-(--surface2) hover:text-(--fg) active:scale-[0.98]"
          >
            Self-host on Cloudflare
          </a>
        </div>

      </header>

      {/* Agents & Setup Rail Section with Auto-Advance */}
      <section
        id="agents"
        className="lp-setup mx-auto max-w-6xl px-6 py-12"
        onMouseEnter={() => {
          isHoveredRef.current = true
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false
        }}
        onFocusCapture={() => {
          isFocusedRef.current = true
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            isFocusedRef.current = false
          }
        }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-(--accent)">
              Where you run OpenPub
            </span>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-(--fg) sm:text-3xl">
              Connect your agent in three steps.
            </h2>
          </div>
          <span className="font-mono text-xs text-(--dim)">
            {activeClient.transport}
          </span>
        </div>

        {/* Tab Selection Rail */}
        <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
          <div className="overflow-x-auto border-b border-(--border) bg-(--surface2)/40 p-2">
            <div
              role="tablist"
              aria-label="Supported Agents and Tools"
              className="flex items-center gap-1.5 min-w-max"
            >
              {AGENT_CLIENTS.map((client) => {
                const isSelected = client.id === activeTabId
                return (
                  <button
                    key={client.id}
                    type="button"
                    role="tab"
                    id={`tab-${client.id}`}
                    aria-selected={isSelected}
                    aria-controls={isSelected ? `panel-${client.id}` : undefined}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => selectTabManually(client.id)}
                    onKeyDown={(event) => {
                      const index = AGENT_CLIENTS.findIndex((item) => item.id === client.id)
                      const nextIndex =
                        event.key === 'ArrowRight'
                          ? (index + 1) % AGENT_CLIENTS.length
                          : event.key === 'ArrowLeft'
                            ? (index - 1 + AGENT_CLIENTS.length) % AGENT_CLIENTS.length
                            : event.key === 'Home'
                              ? 0
                              : event.key === 'End'
                                ? AGENT_CLIENTS.length - 1
                                : -1
                      if (nextIndex < 0) return
                      event.preventDefault()
                      const nextId = AGENT_CLIENTS[nextIndex].id
                      selectTabManually(nextId)
                      document.getElementById(`tab-${nextId}`)?.focus()
                    }}
                    className={`lp-tab inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-(--accent) ${
                      isSelected
                        ? 'bg-(--fg) text-(--bg) shadow-xs'
                        : 'text-(--dim) hover:text-(--fg2) hover:bg-(--surface2)/50'
                    }`}
                  >
                    {client.id === 'cli' ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-(--surface3) font-mono text-[10px] font-bold text-(--accent)">
                        &gt;_
                      </span>
                    ) : (
                      // Local SVG as a mask so the logo follows the tab's text color.
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 bg-current"
                        style={{
                          mask: `url(/logos/${AGENT_LOGOS[client.id]}.svg) center/contain no-repeat`,
                          WebkitMask: `url(/logos/${AGENT_LOGOS[client.id]}.svg) center/contain no-repeat`,
                        }}
                      />
                    )}
                    <span>{client.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Panel Content with Key-Based Fade-In */}
          <div
            key={panelAnimKey}
            id={`panel-${activeClient.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeClient.id}`}
            className={`${panelAnimKey % 2 === 0 ? 'lp-in-a' : 'lp-in-b'} p-6 md:p-8`}
          >
            {activeClient.blocked ? (
              <div className="max-w-2xl py-6">
                <h3 className="text-lg font-semibold text-(--fg)">
                  {activeClient.blockedTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-(--dim)">
                  {activeClient.blockedBody}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <a
                    href={activeClient.blockedLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-(--accent) underline-offset-4 hover:underline"
                  >
                    How Connect apps works in Grok Bot (xAI docs) &rarr;
                  </a>
                  <button
                    type="button"
                    onClick={() => selectTabManually('cli')}
                    className="text-xs font-medium text-(--dim) hover:text-(--fg)"
                  >
                    Switch to CLI tab
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {activeClient.steps?.map((step, idx) => {
                  const key = `${activeClient.id}-${idx}`
                  const isCopied = copiedKey === key
                  const isFailed = copyFailedKey === key
                  return (
                    <div
                      key={step.n}
                      className="flex flex-col justify-between rounded-xl border border-(--border) bg-(--surface2)/30 p-5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-(--accent)/50 font-mono text-xs font-medium text-(--accent)">
                            {step.n}
                          </span>
                          <h3 className="text-sm font-semibold text-(--fg)">
                            {step.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                          {step.lead}
                          {step.monoLead && (
                            <code className="mx-1 rounded bg-(--surface3)/60 px-1 py-0.5 font-mono text-[11px] text-(--fg3)">
                              {step.monoLead}
                            </code>
                          )}
                          {step.tail}
                        </p>
                      </div>

                      <div className="relative mt-4 rounded-lg border border-(--border) bg-(--surface) p-3 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopy(step.code, key)}
                          aria-label={
                            isCopied
                              ? `Copied step ${step.n} code`
                              : isFailed
                                ? `Copy failed for step ${step.n}. Select text to copy manually`
                                : `Copy step ${step.n} code`
                          }
                          className="absolute top-2 right-2 flex items-center gap-1 rounded border border-(--border) bg-(--surface2) px-1.5 py-0.5 font-mono text-[10px] text-(--dim) transition-colors hover:border-(--surface4) hover:text-(--fg)"
                        >
                          {isCopied ? (
                            <>
                              <svg
                                className="h-3 w-3 text-(--accent)"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span className="text-(--accent)">copied</span>
                            </>
                          ) : isFailed ? (
                            <>
                              <svg
                                className="h-3 w-3 text-amber-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
                              <span className="text-amber-400">failed</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-3 w-3 text-(--dim)"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
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
                        <pre
                          className={`overflow-x-auto pr-12 text-[11px] leading-relaxed whitespace-pre-wrap break-words ${
                            step.isProse
                              ? 'font-sans text-xs text-(--fg3)'
                              : 'font-mono text-(--fg4)'
                          }`}
                        >
                          {step.code}
                        </pre>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live region for accessible copy status announcements */}
        <span role="status" aria-live="polite" className="lp-sr">
          {copiedKey
            ? 'Copied to clipboard.'
            : copyFailedKey
              ? 'Copy failed. Select the text and copy it manually.'
              : ''}
        </span>

        <div className="mt-4 text-center">
          <a
            href={DOCS}
            className="text-xs font-medium text-(--accent) underline-offset-4 hover:underline"
          >
            Full setup instructions, CLI commands, and environment variables in
            the docs &rarr;
          </a>
        </div>
      </section>

      {/* Feature overview follows agent setup so visitors see what the MCP flow enables. */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="mx-auto max-w-6xl px-6 py-18"
      >
        <div className="flex flex-col gap-4">
          <span className="lp-eyebrow">Features</span>
          <h2 id="features-heading" className="text-3xl font-semibold tracking-tight text-(--fg) sm:text-4xl">
            What happens after you publish.
          </h2>
        </div>

        <div className="feature-bento">
          {CORE_PRINCIPLES.map((principle, idx) => {
            const isFeatured = idx === 0 || idx === 5
            return (
              <div
                key={principle.title}
                className={`bento-card ${isFeatured ? 'bento-card-featured' : ''}`}
              >
                <div className="bento-badge">
                  <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
                  0{idx + 1}
                </div>
                <h3>{principle.title}</h3>
                <p>
                  {principle.desc}
                  {principle.title === 'Self-host on Cloudflare' && (
                    <> <a href="#self-host" className="text-(--accent) hover:underline">How to deploy &rarr;</a></>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works (3-Step overview) */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-14">
        <div>
          <span className="lp-eyebrow">
            How it works
          </span>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-(--fg) sm:text-3xl">
            One Markdown file. Check the plan before you publish.
          </h2>
        </div>

        <div className="mt-8 steps-card">
          {HOW_STEPS.map((step) => (
            <div key={step.n}>
              <span className="lp-eyebrow font-mono text-sm">
                {step.n}
              </span>
              <h3 className="text-base font-semibold text-(--fg)">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-(--dim)">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms & Platform Limits Section */}
      <section id="platform-capabilities" className="mx-auto max-w-6xl px-6 py-14">
        <div>
          <span className="lp-eyebrow">
            Platform Capabilities
          </span>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-(--fg) sm:text-3xl">
            Every platform, with its real limits.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--dim)">
            Not every external publishing API behaves the same. OpenPub exposes
            exact capabilities beforehand and never duplicates an article to hide
            a limitation.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {/* Card 1: Create & update in place */}
          <div className="flex flex-col justify-between rounded-xl border border-(--border) bg-(--surface)/70 p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-(--accent)" />
                <h3 className="text-base font-semibold text-(--fg)">
                  Create and update in place
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                Subsequent edits update the existing post once OpenPub has stored
                its remote ID, or its git path for GitHub Pages.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['dev.to', 'Ghost', 'WordPress', 'GitHub Pages', 'Hashnode'].map(
                  (name) => (
                    <span
                      key={name}
                      className="rounded-md border border-(--border) bg-(--surface2)/70 px-2.5 py-1 text-xs font-medium text-(--fg3)"
                    >
                      {name}
                    </span>
                  )
                )}
              </div>
            </div>
            <p className="mt-6 border-t border-(--border)/80 pt-3 text-[11px] leading-relaxed text-(--dim2)">
              Hashnode drafts require a Pro publication; live Hashnode articles
              cannot be reverted to drafts.
            </p>
          </div>

          {/* Card 2: Create only */}
          <div className="flex flex-col justify-between rounded-xl border border-(--border) bg-(--surface)/70 p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <h3 className="text-base font-semibold text-(--fg)">
                  Create only
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                These APIs do not allow programmatic editing. Later updates are
                safely skipped with a warning so you never get a second copy.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['Medium', 'X Articles'].map((name) => (
                  <span
                    key={name}
                    className="rounded-md border border-(--border) bg-(--surface2)/70 px-2.5 py-1 text-xs font-medium text-(--fg3)"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-6 border-t border-(--border)/80 pt-3 text-[11px] leading-relaxed text-(--dim2)">
              Medium’s API is legacy and works with existing tokens. X Articles
              requires an X Premium subscription.
            </p>
          </div>

          {/* Card 3: Draft only */}
          <div className="flex flex-col justify-between rounded-xl border border-(--border) bg-(--surface)/70 p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <h3 className="text-base font-semibold text-(--fg)">
                  Draft only
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                Substack does not have a public API. OpenPub creates the draft
                via authenticated session JSON; you review and publish from
                Substack.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md border border-(--border) bg-(--surface2)/70 px-2.5 py-1 text-xs font-medium text-(--fg3)">
                  Substack
                </span>
              </div>
            </div>
            <p className="mt-6 border-t border-(--border)/80 pt-3 text-[11px] leading-relaxed text-(--dim2)">
              Re-publishing an existing Substack draft is skipped with a clear
              notice to avoid duplicate drafts.
            </p>
          </div>
        </div>
      </section>

      {/* Frontmatter In, Article Out (Markdown Rendering Preview) */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6">
          <span className="lp-eyebrow">
            Markdown Preview
          </span>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-(--fg) sm:text-3xl">
            Frontmatter in, article out.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-(--dim)">
            Frontmatter sets the title, tags, platforms and status. The body is
            rendered once and sent to each platform, which applies its own styles.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-(--border)">
            {/* Raw Markdown */}
            <div className="p-6 font-mono text-xs text-(--fg3) leading-relaxed">
              <span className="font-mono text-[11px] text-(--dim2) block mb-2">
                // Source Markdown
              </span>
              <p className="text-(--dim3)">---</p>
              <p>
                <span className="text-(--accent)">title:</span> "Shipping a
                Markdown pipeline"
              </p>
              <p>
                <span className="text-(--accent)">tags:</span> [markdown,
                publishing, tooling]
              </p>
              <p>
                <span className="text-(--accent)">platforms:</span> [devto,
                hashnode, github-pages]
              </p>
              <p>
                <span className="text-(--accent)">primary:</span> github-pages
              </p>
              <p>
                <span className="text-(--accent)">status:</span> draft
              </p>
              <p className="text-(--dim3)">---</p>
              <p className="mt-3 text-(--fg) font-semibold">
                ## What the pipeline does
              </p>
              <p className="mt-1 text-(--dim)">
                - Parses frontmatter for title and tags
                <br />
                - Renders the body once
                <br />
                - Wires the canonical URL back to my site
              </p>
              <blockquote className="mt-3 border-l-2 border-(--accent) pl-3 text-(--dim2) italic">
                Write once, then stop copying and pasting.
              </blockquote>
            </div>

            {/* Rendered Preview */}
            <div className="p-6 flex flex-col justify-between bg-(--surface2)/20">
              <div>
                <span className="font-mono text-[11px] text-(--dim2) block mb-2">
                  // Rendered Output Preview
                </span>
                <article className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-bold tracking-tight text-(--fg)">
                    Shipping a Markdown pipeline
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['markdown', 'publishing', 'tooling'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-(--surface2) px-2 py-0.5 text-[10px] font-mono text-(--dim)"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="mt-4 text-sm font-semibold text-(--fg2)">
                    What the pipeline does
                  </h4>
                  <ul className="mt-2 list-disc pl-4 text-xs text-(--dim) space-y-1">
                    <li>Parses frontmatter for title and tags</li>
                    <li>Renders the body once</li>
                    <li>Wires canonical URLs to the primary origin</li>
                  </ul>
                  <blockquote className="mt-3 border-l-2 border-(--accent) pl-3 text-xs italic text-(--fg3)">
                    Write once, then stop copying and pasting.
                  </blockquote>
                </article>
              </div>
              <div className="mt-4 pt-3 border-t border-(--border) text-[11px] text-(--dim2)">
                Canonical URL automatically points to your primary platform.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Two-Column Section with First Open */}
      <section id="faq" className="mx-auto max-w-6xl px-6 py-14">
        <div className="faq-two-col">
          <div className="flex flex-col gap-3">
            <span className="lp-eyebrow">
              Questions
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-(--fg) sm:text-4xl">
              Before you try it.
            </h2>
          </div>

          <div className="questions">
            {FAQ_ITEMS.map((item, index) => (
              <details key={item.q} open={index === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Host CTA Section */}
      <section id="self-host" className="mx-auto max-w-6xl px-6 py-14">
        <div className="self-host-cta">
          <span className="lp-eyebrow">
            Self-host
          </span>

          <h2>
            Run it on your own Cloudflare account.
          </h2>

          <p>
            The CLI and local MCP server need no external infrastructure.
            When you want an API or web console, deploy a Worker backed by
            your own D1, KV, R2, and Queue resources.
          </p>

          <div className="actions">
            <a
              href={DOCS}
              className="lp-btn lp-btn-primary"
            >
              Read the self-host docs
            </a>
            <a
              href={GITHUB}
              className="lp-btn lp-btn-secondary"
            >
              View source on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-(--border)">
        <div className="mx-auto max-w-6xl px-8 py-14 flex flex-wrap items-baseline justify-between gap-5 text-[13px] text-(--dim)">
          <div className="flex flex-wrap items-center gap-5">
            <span className="font-semibold text-(--fg)">OpenPub</span>
            <span>MIT licensed</span>
            <a href={GITHUB} className="hover:text-(--fg3) transition-colors duration-150">GitHub</a>
            <a href={DOCS} className="hover:text-(--fg3) transition-colors duration-150">Docs</a>
            <a href="https://openpub.princepal.dev/llms.txt" className="hover:text-(--fg3) transition-colors duration-150">llms.txt</a>
          </div>
          <div>Write once. Publish everywhere. Kept on your own machine.</div>
        </div>
      </footer>
    </div>
  )
}
