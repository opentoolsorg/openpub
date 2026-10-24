import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Logo, Mark } from '~/components/Logo'
import { ThemeToggle } from '~/components/ThemeToggle'

export const Route = createFileRoute('/')({
  component: Landing,
})

const GITHUB = 'https://github.com/princepal9120/openpub'
const DOCS = '/docs'

interface PlatformInfo {
  slug: string
  label: string
  limitType: 'update' | 'create-only' | 'draft-only'
}

const PLATFORMS: PlatformInfo[] = [
  { slug: 'devdotto', label: 'dev.to', limitType: 'update' },
  { slug: 'hashnode', label: 'Hashnode', limitType: 'update' },
  { slug: 'wordpress', label: 'WordPress', limitType: 'update' },
  { slug: 'ghost', label: 'Ghost', limitType: 'update' },
  { slug: 'medium', label: 'Medium', limitType: 'create-only' },
  { slug: 'substack', label: 'Substack', limitType: 'draft-only' },
  { slug: 'github', label: 'GitHub Pages', limitType: 'update' },
  { slug: 'x', label: 'X Articles', limitType: 'create-only' },
]

const HERO_AGENTS = ['Claude Code', 'Codex', 'Cursor', 'Copilot', 'Hermes', 'OpenCode', 'OpenClaw', 'CLI']

const ROTATING_PLATFORMS = [
  'dev.to',
  'Hashnode',
  'WordPress',
  'Ghost',
  'Medium',
  'Substack',
  'GitHub Pages',
  'X Articles',
  'dev.to', // repeats first item for seamless loop wrap
]

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
  code: 'git clone https://github.com/princepal9120/openpub\ncd openpub/mcp\nnpm install && npm run build',
}

const MCP_PATH = '/path/to/openpub/mcp/dist/index.js'
const ASK_PROMPT = 'Check the links in post.md, then do a dry run to dev.to and Hashnode.'

const AGENT_CLIENTS: AgentTab[] = [
  {
    id: 'cli',
    name: 'CLI',
    customIcon: 'CLI',
    transport: 'Terminal · Node 20+',
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
        tail: 'on your local machine:',
        code: "node cli/dist/index.js setup devto '{\"api_key\": \"YOUR_DEVTO_KEY\"}'\nnode cli/dist/index.js status",
      },
      {
        n: '03',
        title: 'Dry-run a post',
        lead: 'Test the plan before shipping. Drafts stay default:',
        code: 'node cli/dist/index.js publish --dry-run post.md --to devto',
      },
    ],
  },
  {
    id: 'claude',
    name: 'Claude Code',
    slug: 'claude',
    transport: 'Local stdio server · Node 20+',
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
    a: 'No. The CLI and local MCP server run on your machine using Node 20+. The web console and API are optional, and you host them on your own Cloudflare account. Build from the repository; the npm package is not released yet.',
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
    <div
      className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
        open
          ? 'border-(--accent-strong)/40 bg-(--surface)'
          : 'border-(--border) bg-(--surface)/60 hover:border-(--surface4)'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-(--accent)"
      >
        <span
          className={`text-sm font-medium transition-colors ${
            open ? 'text-(--fg)' : 'text-(--fg3) group-hover:text-(--fg)'
          }`}
        >
          {q}
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
            open
              ? 'rotate-45 border-(--accent-strong)/40 bg-(--accent-strong)/10 text-(--accent)'
              : 'border-(--border) bg-(--surface2)/60 text-(--dim3) group-hover:text-(--dim)'
          }`}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="border-t border-(--border)/60 px-5 pt-3.5 pb-5 text-sm leading-relaxed text-(--dim)">
            {a}
          </p>
        </div>
      </div>
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
          animation: lpRot 24s cubic-bezier(.76, 0, .24, 1) infinite;
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
        .lp-ed-list .lp-ed-item { display: flex; }
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
            href="#agents"
            className="hidden md:inline transition-colors duration-200 hover:text-(--fg)"
          >
            Agents
          </a>
          <a
            href="#platforms"
            className="hidden md:inline transition-colors duration-200 hover:text-(--fg)"
          >
            Platforms
          </a>
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
          <a href="/app" className="transition-colors duration-200 hover:text-(--fg)">App</a>
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

        <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-(--fg) sm:text-5xl md:text-6xl md:leading-[1.08]">
          Write once.{' '}
          <span className="text-(--dim2)">Let your agent publish.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-(--dim) sm:text-lg">
          OpenPub is an open-source MCP server and CLI that publishes one Markdown
          file to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, GitHub
          Pages and X Articles. Credentials stay in a config file on your machine
          or in your own self-hosted instance.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href={DOCS}
            className="inline-flex items-center justify-center rounded-lg bg-(--accent-strong) px-5 py-2.5 text-sm font-semibold text-(--on-accent) shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)] transition-all duration-200 hover:bg-(--accent) hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.5)] active:scale-[0.98]"
          >
            Read the docs
          </a>
          <a
            href="#self-host"
            className="inline-flex items-center justify-center rounded-lg border border-(--border) bg-(--surface2)/50 px-5 py-2.5 text-sm font-semibold text-(--fg3) transition-all duration-200 hover:border-(--surface4) hover:bg-(--surface2) hover:text-(--fg) active:scale-[0.98]"
          >
            Self-host on Cloudflare
          </a>
        </div>

        <p className="mt-4 text-xs text-(--dim2) font-mono">
          Drafts by default. Nothing goes live until you say so.
        </p>

        {/* Visual Pipeline Band */}
        <div className="lp-ecosystem relative w-full overflow-hidden rounded-2xl border border-(--border) bg-(--surface)/60">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: AI Agents */}
            <div className="lp-agent-flow flex-1 w-full text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-(--dim2)">
                  AI agents
                </span>
                <span className="h-px flex-1 bg-(--border)" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[...HERO_AGENTS, ...HERO_AGENTS].map((name, index) => (
                  <span
                    key={`${name}-${index}`}
                    aria-hidden={index >= HERO_AGENTS.length ? true : undefined}
                    className="inline-flex items-center gap-1.5 rounded-md border border-(--border) bg-(--surface2)/60 px-2.5 py-1 text-xs font-medium text-(--fg3)"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-(--accent)/80" />
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Core Bridge Indicator */}
            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-(--accent)/40 bg-(--surface2) text-(--accent) shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <Mark className="h-7 w-7 text-(--accent)" />
              </div>
              <span className="mt-2 font-mono text-[11px] text-(--accent)">
                OpenPub MCP
              </span>
            </div>

            {/* Right: Platforms */}
            <div className="lp-platform-flow flex-1 w-full text-right">
              <div className="flex items-center gap-2 mb-3 justify-end">
                <span className="h-px flex-1 bg-(--border)" />
                <span className="font-mono text-xs uppercase tracking-wider text-(--dim2)">
                  Publishing platforms
                </span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {[...PLATFORMS, ...PLATFORMS].map((p, index) => (
                  <span
                    key={`${p.slug}-${index}`}
                    aria-hidden={index >= PLATFORMS.length ? true : undefined}
                    className="inline-flex items-center gap-1.5 rounded-md border border-(--border) bg-(--surface2)/60 px-2.5 py-1 text-xs font-medium text-(--fg3)"
                  >
                    <img
                      src={`https://cdn.simpleicons.org/${p.slug}/e9eaec`}
                      alt=""
                      className="brand-icon h-3 w-3 object-contain opacity-70"
                      loading="lazy"
                      width={12}
                      height={12}
                    />
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
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
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-(--accent) ${
                      isSelected
                        ? 'bg-(--surface) text-(--fg) border border-(--border) shadow-xs'
                        : 'text-(--dim) hover:text-(--fg2) hover:bg-(--surface2)/50'
                    }`}
                  >
                    {client.customIcon ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-(--surface3) font-mono text-[9px] font-bold text-(--accent)">
                        {client.customIcon}
                      </span>
                    ) : client.slug ? (
                      <img
                        src={`https://cdn.simpleicons.org/${client.slug}/e9eaec`}
                        alt=""
                        className="brand-icon h-3.5 w-3.5 object-contain opacity-75"
                        loading="lazy"
                        width={14}
                        height={14}
                      />
                    ) : null}
                    <span>{client.name}</span>
                    {client.blocked && (
                      <span className="rounded bg-(--surface3) px-1.5 py-0.2 font-mono text-[10px] text-(--dim2)">
                        unverified
                      </span>
                    )}
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

      <section id="platforms" className="lp-publishes mx-auto max-w-6xl px-6" aria-labelledby="publishes-heading">
        <h2 id="publishes-heading">Publishes to</h2>
        <div>{PLATFORMS.map((platform) => <span key={platform.slug}><img src={`https://cdn.simpleicons.org/${platform.slug}/e9eaec`} className="brand-icon" width={28} height={28} alt="" loading="lazy" />{platform.label}</span>)}</div>
        <p>Product names and logos belong to their owners and show where OpenPub can publish. No affiliation or endorsement is implied.</p>
      </section>

      {/* Dry Run Product Preview Section */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
          {/* Header bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border) bg-(--surface2)/60 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-(--fg2)">
                posts/markdown-pipeline.md
              </span>
              <span className="rounded bg-(--surface3) px-2 py-0.5 font-mono text-[11px] text-(--dim)">
                openpub publish --dry-run
              </span>
            </div>
            <span className="rounded-full border border-(--surface4) px-2.5 py-0.5 font-mono text-[10px] text-(--dim)">
              Dry-run preview · Nothing is sent
            </span>
          </div>

          {/* Split Content */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-(--border)">
            {/* Left: Markdown */}
            <div className="p-6 font-mono text-xs">
              <div className="text-(--dim2) mb-2 font-mono text-[11px]">
                // Input Markdown file
              </div>
              <div className="space-y-1 text-(--fg3) leading-relaxed">
                <p className="text-(--dim3)">---</p>
                <p>
                  <span className="text-(--accent)">title:</span> Shipping a
                  Markdown pipeline
                </p>
                <p>
                  <span className="text-(--accent)">tags:</span> [markdown,
                  publishing, tooling]
                </p>
                <p>
                  <span className="text-(--accent)">platforms:</span> [devto,
                  hashnode, ghost, wordpress, substack]
                </p>
                <p>
                  <span className="text-(--accent)">status:</span> draft
                </p>
                <p className="text-(--dim3)">---</p>
                <div className="pt-2 text-(--dim)">
                  <p className="text-(--fg) font-semibold">
                    # Shipping a Markdown pipeline
                  </p>
                  <p className="mt-2">
                    Every post starts as a markdown file in my git repository.
                    OpenPub fans it out across platforms while keeping my site as
                    the canonical source.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Execution Plan */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[11px] text-(--dim2) mb-3">
                  // Platform Plan Preview
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'dev.to', action: 'Create draft' },
                    {
                      name: 'Hashnode',
                      action: 'Create draft',
                      note: 'Requires Pro publication',
                    },
                    { name: 'Ghost', action: 'Create draft' },
                    { name: 'WordPress', action: 'Create draft' },
                    {
                      name: 'Substack',
                      action: 'Create draft',
                      note: 'Publish via Substack web editor',
                    },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between border-b border-(--border)/60 pb-2 text-xs"
                    >
                      <span className="font-medium text-(--fg2)">{row.name}</span>
                      <div className="text-right">
                        <span className="text-(--accent) font-mono">
                          {row.action}
                        </span>
                        {row.note && (
                          <span className="block text-[10px] text-(--dim3)">
                            {row.note}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-(--accent-strong)/30 bg-(--accent-strong)/10 p-3 text-xs text-(--fg3)">
                <span className="font-semibold text-(--accent)">
                  Status is draft:
                </span>{' '}
                Nothing goes live until you set{' '}
                <code className="font-mono text-(--fg)">status: published</code>.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (3-Step overview) */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-(--accent)">
            How it works
          </span>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-(--fg) sm:text-3xl">
            One Markdown file. Check the plan before you publish.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {HOW_STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-(--border) bg-(--surface)/70 p-6"
            >
              <span className="font-mono text-sm font-semibold text-(--accent)">
                {step.n}
              </span>
              <h3 className="mt-2 text-base font-semibold text-(--fg)">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms & Platform Limits Section */}
      <section id="platform-capabilities" className="mx-auto max-w-6xl px-6 py-14">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-(--accent)">
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

      {/* EDITORIAL FEATURES SECTION (Image #7 Reference with Animated Platform Word) */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="mx-auto max-w-6xl px-6 py-18"
      >
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold text-(--accent)">
            Features
          </span>

          {/* Large Editorial Headline with Single SR Accessible Sentence & Animated Platform Word */}
          <h2
            id="features-heading"
            className="lp-ed"
          >
            {/* Single accessible sentence for screen readers */}
            <span className="lp-sr">
              Publish to eight platforms from one Markdown file.
            </span>

            {/* Visual presentation */}
            <span aria-hidden="true" style={{ display: 'block' }}>
              Publish to
            </span>
            <span aria-hidden="true" className="lp-ed-rot">
              {/* Static text fallback for reduced-motion */}
              <span className="lp-ed-static lp-ed-item text-(--accent)">
                eight platforms
              </span>
              {/* Animated rotating words container */}
              <span className="lp-ed-list">
                {ROTATING_PLATFORMS.map((platformName, idx) => (
                  <span key={idx} className="lp-ed-item">
                    {platformName}
                  </span>
                ))}
              </span>
            </span>
            <span aria-hidden="true" className="lp-ed-fade">
              from one Markdown file.
            </span>
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-(--border) bg-(--surface) p-6 transition-colors hover:border-(--surface4)">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-(--fg)">MCP Server</h3>
                <span className="rounded bg-(--accent-strong)/10 px-2 py-0.5 font-mono text-[10px] text-(--accent)">10 tools</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                The local stdio server gives your agent 10 tools to audit content,
                check links, run dry runs, and cross-publish with per-platform results.
              </p>
              <p className="mt-4 rounded-lg border border-(--border) bg-(--surface2)/50 p-3 font-mono text-[11px] leading-relaxed text-(--fg3)">
                publish · cross_publish · list_published · setup · status · test_platform · content_audit · check_links · frontmatter · x_article
              </p>
            </div>
            <a href="#agents" className="mt-6 inline-flex items-center text-xs font-medium text-(--accent) underline-offset-4 hover:underline">Setup instructions for each agent &rarr;</a>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-(--border) bg-(--surface) p-6 transition-colors hover:border-(--surface4)">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-(--fg)">CLI</h3>
                <span className="rounded bg-(--surface2) px-2 py-0.5 font-mono text-[10px] text-(--dim)">Node 20+</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                Built from the repo. Platform credentials stay local in
                ~/.openpub/config.json. Scriptable for shell scripts and cron jobs.
              </p>
              <div className="mt-4 rounded-lg border border-(--border) bg-(--surface2)/50 p-3 font-mono text-[11px] leading-relaxed text-(--fg3) space-y-1 break-words">
                <p className="text-(--dim2)"># Dry-run before publishing</p>
                <p>node apps/cli/dist/index.js publish post.md --to devto --dry-run</p>
                <p className="text-(--dim2) pt-1"># Create draft</p>
                <p>node apps/cli/dist/index.js publish post.md --to devto --status draft</p>
              </div>
            </div>
            <a href="/docs#cli" className="mt-6 inline-flex items-center text-xs font-medium text-(--accent) underline-offset-4 hover:underline">Full CLI setup &rarr;</a>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-(--border) bg-(--surface) p-6 transition-colors hover:border-(--surface4)">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-(--fg)">GitHub Action</h3>
                <span className="rounded-full border border-(--warn)/50 bg-(--warn)/10 px-2 py-0.5 font-mono text-[10px] font-medium text-(--warn)">Not released yet</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                Automated publishing on push is not available as a released Action.
                The CLI npm package and a tagged Action release are not published yet.
                Build the CLI from source for now.
              </p>
            </div>
            <a href="/docs#github-action" className="mt-6 inline-flex items-center text-xs font-medium text-(--accent) underline-offset-4 hover:underline">Release status &rarr;</a>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-(--border)">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_PRINCIPLES.map((principle) => (
              <div
                key={principle.title}
                className="group rounded-xl border border-(--border) bg-(--surface)/60 p-5 transition-all duration-150 hover:border-(--surface4) hover:bg-(--surface2)/40"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
                  <h4 className="text-sm font-semibold text-(--fg2)">
                    {principle.title}
                  </h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                  {principle.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frontmatter In, Article Out (Markdown Rendering Preview) */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6">
          <span className="font-mono text-xs uppercase tracking-wider text-(--accent)">
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

      {/* FAQ Accordion Section */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="text-center mb-8">
          <span className="font-mono text-xs uppercase tracking-wider text-(--accent)">
            Questions
          </span>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-(--fg) sm:text-3xl">
            Before you try it.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Self-Host CTA Section */}
      <section id="self-host" className="mx-auto max-w-6xl px-6 py-14">
        <div className="relative overflow-hidden rounded-3xl border border-(--border) bg-(--surface) p-8 md:p-14 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center">
            <span className="rounded-full border border-(--accent-strong)/40 bg-(--accent-strong)/10 px-3 py-1 font-mono text-xs text-(--accent)">
              Self-host
            </span>

            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-(--fg) sm:text-3xl md:text-4xl">
              Run it on your own Cloudflare account.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-(--dim)">
              The local CLI and MCP server need no external infrastructure.
              When you want an API or web console, deploy a Worker backed by
              your own D1, KV, R2, and Queue resources.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href={DOCS}
                className="inline-flex items-center justify-center rounded-lg bg-(--accent-strong) px-5 py-2.5 text-sm font-semibold text-(--on-accent) shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)] transition-all duration-200 hover:bg-(--accent) hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.5)] active:scale-[0.98]"
              >
                Read the self-host docs
              </a>
              <a
                href={GITHUB}
                className="inline-flex items-center justify-center rounded-lg border border-(--border) bg-(--surface2)/50 px-5 py-2.5 text-sm font-semibold text-(--fg3) transition-all duration-200 hover:border-(--surface4) hover:bg-(--surface2) hover:text-(--fg) active:scale-[0.98]"
              >
                View source on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-(--border) bg-(--surface)/40">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6 text-xs text-(--dim2)">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="opacity-80" />
              <span className="text-(--dim3)">·</span>
              <span>MIT Licensed</span>
            </div>
            <nav aria-label="Footer" className="flex items-center gap-5">
              <a
                href={DOCS}
                className="hover:text-(--fg3) transition-colors duration-150"
              >
                Docs
              </a>
              <a
                href={GITHUB}
                className="hover:text-(--fg3) transition-colors duration-150"
              >
                GitHub
              </a>
            </nav>
          </div>

          <p className="text-[11px] leading-relaxed text-(--dim3)">
            Codex is a trademark of OpenAI. Cursor is a trademark of Anysphere.
            GitHub and GitHub Copilot are trademarks of GitHub. Grok is a
            trademark of xAI. OpenCode is a trademark of OpenCode. Other product
            names belong to their respective owners. OpenPub is an independent
            open-source project.
          </p>
        </div>
      </footer>
    </div>
  )
}
