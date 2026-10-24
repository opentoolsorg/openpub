import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { ThemeToggle } from '~/components/ThemeToggle'
import { Logo } from '~/components/Logo'

export const Route = createFileRoute('/docs')({
  head: () => ({
    meta: [
      { title: 'Documentation - OpenPub' },
      {
        name: 'description',
        content:
          'OpenPub self-hosting deployment guide, platform setup matrix, CLI reference and MCP documentation.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600&display=swap',
      },
    ],
  }),
  component: DocsPage,
})

const GITHUB = 'https://github.com/princepal9120/openpub'

interface NavItem {
  id: string
  label: string
}

interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'two-modes', label: 'Two Ways to Run' },
      { id: 'quickstart', label: 'CLI Quickstart' },
      { id: 'deploy-guide', label: 'Self-host / Deploy' },
      { id: 'console-onboarding', label: 'Console Onboarding' },
      { id: 'prerequisites', label: 'Prerequisites' },
      { id: 'step-1-install', label: '1. Clone & Install' },
      { id: 'step-2-resources', label: '2. Cloudflare Resources' },
      { id: 'step-3-schema', label: '3. Database Schema' },
      { id: 'step-4-secret', label: '4. Admin Secret' },
      { id: 'step-5-url', label: '5. Set BASE_URL' },
      { id: 'step-6-deploy', label: '6. Deploy Worker' },
      { id: 'step-7-verify', label: '7. Verify Deployment' },
      { id: 'custom-domain', label: 'Custom Domain' },
      { id: 'free-tier', label: 'Free Tier Limits' },
      { id: 'updating', label: 'Updating' },
      { id: 'next-steps', label: 'Next Steps' },
    ],
  },
  {
    id: 'interfaces',
    title: 'Interfaces',
    items: [
      { id: 'cli', label: 'CLI Reference' },
      { id: 'cli-install', label: 'Installation & Setup' },
      { id: 'cli-matrix', label: 'Command Matrix' },
      { id: 'cli-commands', label: 'Command Details' },
      { id: 'cli-frontmatter', label: 'Markdown Frontmatter' },
      { id: 'mcp', label: 'MCP Server' },
      { id: 'mcp-overview', label: 'Local stdio & Streamable HTTP' },
      { id: 'mcp-build', label: 'Build Server from Repo' },
      { id: 'mcp-tools', label: 'Available MCP Tools' },
      { id: 'mcp-claude-code', label: 'Claude Code Setup' },
      { id: 'mcp-cursor', label: 'Cursor & VS Code' },
      { id: 'mcp-windsurf', label: 'Windsurf & Codex' },
      { id: 'mcp-curl', label: 'Generic HTTP / curl' },
      { id: 'mcp-first-session', label: 'Typical First Session' },
      { id: 'mcp-troubleshooting', label: 'Troubleshooting' },
    ],
  },
  {
    id: 'github-action',
    title: 'GitHub Action',
    items: [
      { id: 'action-setup', label: 'Release Status' },
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    items: [
      { id: 'platforms', label: '8 Supported Platforms' },
      { id: 'platforms-overview', label: 'Storing & Testing' },
      { id: 'platforms-matrix', label: 'Credentials Matrix' },
      { id: 'platform-devto', label: 'dev.to' },
      { id: 'platform-hashnode', label: 'Hashnode' },
      { id: 'platform-wordpress', label: 'WordPress' },
      { id: 'platform-ghost', label: 'Ghost' },
      { id: 'platform-medium', label: 'Medium' },
      { id: 'platform-substack', label: 'Substack' },
      { id: 'platform-github-pages', label: 'GitHub Pages' },
      { id: 'platform-x', label: 'X Articles' },
      { id: 'architecture', label: 'Architecture & Storage' },
      { id: 'arch-diagram', label: 'System Diagram' },
      { id: 'arch-components', label: 'Core Components' },
      { id: 'arch-lifecycle', label: 'Publish Lifecycle' },
      { id: 'arch-idempotency', label: 'Idempotency & Canonical' },
      { id: 'arch-api-matrix', label: 'REST API Reference' },
    ],
  },
]

type CopyStatus = 'idle' | 'copied' | 'error'

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [status, setStatus] = React.useState<CopyStatus>('idle')

  const copy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
      return
    }
    try {
      await navigator.clipboard.writeText(code)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  const ariaLabel =
    status === 'copied'
      ? 'Copied to clipboard'
      : status === 'error'
      ? 'Failed to copy to clipboard'
      : 'Copy code to clipboard'

  const buttonText =
    status === 'copied' ? 'Copied' : status === 'error' ? 'Failed' : 'Copy'

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-(--border)/85 bg-(--surface) shadow-sm">
      <span className="sr-only" role="status" aria-live="polite">
        {status === 'copied'
          ? 'Code copied to clipboard'
          : status === 'error'
          ? 'Failed to copy code to clipboard'
          : ''}
      </span>
      {title && (
        <div className="flex items-center justify-between border-b border-(--border)/80 bg-(--surface2)/60 px-4 py-2 font-mono text-xs text-(--dim)">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-(--accent)" aria-hidden="true" />
            <span className="font-semibold text-(--fg3)">{title}</span>
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label={ariaLabel}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-(--accent) ${
              status === 'copied'
                ? 'border-(--accent) bg-(--accent)/15 text-(--accent)'
                : status === 'error'
                ? 'border-(--danger) bg-(--danger)/15 text-(--danger)'
                : 'border-(--border) bg-(--surface2) text-(--fg3) hover:border-(--surface4) hover:text-(--accent)'
            }`}
          >
            {status === 'copied' ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>{buttonText}</span>
              </>
            ) : status === 'error' ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{buttonText}</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      )}
      <div className="relative">
        {!title && (
          <button
            type="button"
            onClick={copy}
            aria-label={ariaLabel}
            className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-(--accent) ${
              status === 'copied'
                ? 'border-(--accent) bg-(--accent)/15 text-(--accent)'
                : status === 'error'
                ? 'border-(--danger) bg-(--danger)/15 text-(--danger)'
                : 'border-(--border) bg-(--surface2)/90 text-(--fg3) hover:border-(--surface4) hover:text-(--accent)'
            }`}
          >
            {status === 'copied' ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>{buttonText}</span>
              </>
            ) : status === 'error' ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{buttonText}</span>
              </>
            ) : (
              <span>{buttonText}</span>
            )}
          </button>
        )}
        <pre className="overflow-x-auto p-4 font-mono text-[0.8125rem] leading-[1.65] text-(--fg3) selection:bg-(--accent)/20">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

function SectionHeading({
  id,
  badge,
  title,
  subtitle,
  isH1,
}: {
  id: string
  badge: string
  title: string
  subtitle?: string
  isH1?: boolean
}) {
  return (
    <div id={id} className="scroll-mt-24 pt-14 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-(--accent)" aria-hidden="true" />
        <span className="font-['IBM_Plex_Sans',sans-serif] text-xs font-semibold uppercase tracking-wider text-(--accent)">
          {badge}
        </span>
      </div>
      {isH1 ? (
        <h1 className="docs-heading mt-2.5 font-['IBM_Plex_Sans',sans-serif] text-2xl font-bold tracking-tight text-(--fg) sm:text-3xl">
          {title}
        </h1>
      ) : (
        <h2 className="docs-heading mt-2.5 font-['IBM_Plex_Sans',sans-serif] text-2xl font-bold tracking-tight text-(--fg) sm:text-3xl">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="docs-prose mt-3 max-w-[70ch] text-[1.0625rem] leading-[1.65] text-(--dim)">
          {subtitle}
        </p>
      )}
      <div className="mt-6 border-b border-(--surface3)" />
    </div>
  )
}

function SubHeading({ id, title }: { id: string; title: string }) {
  return (
    <h3
      id={id}
      className="docs-heading scroll-mt-24 mt-10 mb-3.5 flex items-center gap-2 font-['IBM_Plex_Sans',sans-serif] text-lg font-semibold tracking-tight text-(--fg2) sm:text-xl"
    >
      <a
        href={`#${id}`}
        aria-label={`Link to ${title}`}
        className="font-mono text-sm text-(--dim3) hover:text-(--accent) transition-colors"
      >
        #
      </a>
      <span>{title}</span>
    </h3>
  )
}

function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode
  type?: 'info' | 'tip' | 'warning'
}) {
  const isTip = type === 'tip'
  const isWarn = type === 'warning'
  return (
    <div
      role="note"
      className={`my-5 rounded-xl border p-4.5 text-sm leading-[1.6] transition-colors ${
        isTip
          ? 'border-(--accent)/35 bg-(--accent)/8 text-(--fg2)'
          : isWarn
          ? 'border-(--danger)/40 bg-(--danger)/10 text-(--fg2)'
          : 'border-(--border) bg-(--surface2)/50 text-(--fg3)'
      }`}
    >
      <div className="flex gap-3 items-start">
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          {isTip ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--accent)">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          ) : isWarn ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--danger)">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--accent)">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </span>
        <div className="flex-1 space-y-1">{children}</div>
      </div>
    </div>
  )
}

function DocsPage() {
  const resolveSectionFromHash = () => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.slice(1)
      if (hash === 'deploy-guide') return 'getting-started'
      const section = NAV_SECTIONS.find((item) => item.id === hash || item.items.some((link) => link.id === hash))
      if (section) return section.id
    }
    return 'getting-started'
  }

  const [activeSection, setActiveSection] = React.useState(resolveSectionFromHash)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      const headings = NAV_SECTIONS.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      }))

      const scrollPos = window.scrollY + 140
      for (let i = headings.length - 1; i >= 0; i--) {
        const item = headings[i]
        if (item.el && item.el.offsetTop <= scrollPos) {
          setActiveSection(item.id)
          break
        }
      }
    }

    const handleHash = () => setActiveSection(resolveSectionFromHash())

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('docs-filter-input')
        if (input) input.focus()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('hashchange', handleHash)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', handleHash)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const currentSectionData = NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0]

  const filteredSections = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return NAV_SECTIONS
    return NAV_SECTIONS.map((sec) => {
      const matchTitle = sec.title.toLowerCase().includes(q)
      const matchingItems = sec.items.filter((item) => item.label.toLowerCase().includes(q))
      if (matchTitle || matchingItems.length > 0) {
        return {
          ...sec,
          items: matchTitle ? sec.items : matchingItems,
        }
      }
      return null
    }).filter(Boolean) as NavSection[]
  }, [searchQuery])

  return (
    <div className="docs-page min-h-screen bg-(--bg) text-(--fg3) antialiased selection:bg-(--accent)/25">
      <style>{`
        .docs-page {
          font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
        }
        .docs-heading {
          font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
          letter-spacing: -0.015em;
          line-height: 1.25;
          text-wrap: balance;
        }
        .docs-prose {
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 1.0625rem;
          line-height: 1.65;
          letter-spacing: normal;
          text-wrap: pretty;
        }
        .docs-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
      `}</style>

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-(--surface3) bg-(--bg)/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border) bg-(--surface2) text-(--dim) hover:text-(--fg) lg:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-docs-nav"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
              </svg>
            </button>
            <a href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <Logo />
            </a>
            <span className="hidden sm:inline-flex items-center rounded-md border border-(--border) bg-(--surface2) px-2 py-0.5 font-mono text-[11px] font-medium text-(--dim)">
              docs
            </span>
          </div>

          {/* Quick filter input */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <input
                id="docs-filter-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation or quick jump..."
                aria-label="Search documentation topics or quick jump"
                className="w-full rounded-lg border border-(--border) bg-(--surface) px-3 py-1.5 pl-8 pr-12 text-xs text-(--fg2) placeholder:text-(--dim2) focus:border-(--accent) focus:outline-none transition-colors"
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-2.5 text-(--dim2)"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-(--dim2) hover:text-(--fg)"
                  aria-label="Clear filter"
                >
                  ×
                </button>
              ) : (
                <kbd
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 top-2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border border-(--surface3) bg-(--surface2) text-(--dim)"
                >
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="/"
              className="hidden font-medium text-(--dim) transition-colors hover:text-(--fg) sm:inline"
            >
              Home
            </a>
            <ThemeToggle />
            <a
              href="/app"
              className="rounded-lg border border-(--border) bg-(--surface2) px-3 py-1.5 font-medium text-(--fg2) transition-colors hover:border-(--accent) hover:text-(--accent)"
            >
              Open Dashboard
            </a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="hidden font-medium text-(--dim) transition-colors hover:text-(--fg) sm:inline"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div
            id="mobile-docs-nav"
            className="border-t border-(--surface3) bg-(--surface) px-4 py-4 lg:hidden max-h-[70vh] overflow-y-auto"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics..."
              aria-label="Filter documentation topics"
              className="mb-4 w-full rounded-lg border border-(--border) bg-(--surface2) px-3 py-2 text-xs text-(--fg2) placeholder:text-(--dim2) focus:border-(--accent) focus:outline-none"
            />
            {filteredSections.length === 0 && (
              <div className="py-2 text-xs text-(--dim2)" role="status" aria-live="polite">
                No topics matching &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
            <nav className="space-y-4">
              {filteredSections.map((sec) => (
                <div key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block font-['IBM_Plex_Sans',sans-serif] text-xs font-semibold uppercase tracking-wider text-(--accent)"
                  >
                    {sec.title}
                  </a>
                  <ul className="mt-2 space-y-1 border-l border-(--surface3) pl-3">
                    {sec.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-xs text-(--dim) hover:text-(--fg)"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="docs-layout mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-10">
          {/* Left Sidebar */}
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto py-8 pr-4 lg:block border-r border-(--surface3)">
            {searchQuery && (
              <div className="mb-4 text-xs text-(--dim2)" role="status" aria-live="polite">
                {filteredSections.length === 0
                  ? `No topics matching "${searchQuery}"`
                  : `Showing matches for "${searchQuery}"`}
              </div>
            )}
            <nav className="space-y-6">
              {filteredSections.map((sec) => {
                const isActive = activeSection === sec.id
                return (
                  <div key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className={`block font-['IBM_Plex_Sans',sans-serif] text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive ? 'text-(--accent)' : 'text-(--dim) hover:text-(--fg)'
                      }`}
                    >
                      {sec.title}
                    </a>
                    <ul className="mt-2.5 space-y-1.5 border-l border-(--surface3) pl-3">
                      {sec.items.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="block text-xs leading-relaxed text-(--dim) transition-colors hover:text-(--fg2)"
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-(--surface3) flex flex-col gap-2.5 text-xs text-(--dim)">
              <a
                href="#deploy-guide"
                className="flex items-center gap-2 hover:text-(--accent) transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Deploy Guide</span>
              </a>
              <a
                href="/app"
                className="flex items-center gap-2 hover:text-(--accent) transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                <span>Dashboard Console</span>
              </a>
            </div>
          </aside>

          {/* Middle Content Column */}
          <main className="min-w-0 max-w-3xl flex-1 py-8 lg:py-10">
            {/* Quick jump for small screens */}
            <div className="mb-8 rounded-xl border border-(--border) bg-(--surface)/70 p-4 lg:hidden">
              <span className="font-['IBM_Plex_Sans',sans-serif] text-xs font-semibold uppercase tracking-wider text-(--accent)">
                Documentation Sections
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                {NAV_SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="rounded-md border border-(--border) bg-(--surface2) px-2.5 py-1 text-(--fg3) hover:border-(--accent) hover:text-(--accent) transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </div>
            </div>

            {/* SECTION 1: GETTING STARTED */}
            <section className="space-y-6">
              <SectionHeading
                id="getting-started"
                badge="Documentation · Getting Started"
                title="Getting started with OpenPub"
                subtitle="Publish a Markdown file to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, GitHub Pages, and X Articles. OpenPub sets canonical URLs from your first public post and records each result. Update support varies by platform, so check the platform limits before you republish."
                isH1
              />

              <SubHeading id="overview" title="Architecture Overview" />
              <p className="docs-prose text-(--dim)">
                Cross-posting tools typically keep your sensitive platform credentials on third-party servers, charge recurring monthly subscriptions, or quietly break when APIs update. OpenPub inverts this model: your drafts, credentials, and publish logs reside directly in your own local files or Cloudflare D1 SQLite database.
              </p>

              <SubHeading id="two-modes" title="Two Ways to Run OpenPub" />
              <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-(--border) bg-(--surface2)/50 p-5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-(--accent)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                    <span>1. Local CLI &amp; MCP (No Server)</span>
                  </div>
                  <p className="text-xs leading-relaxed text-(--dim)">
                    Zero infrastructure required. Credentials live in <code className="docs-code text-(--fg2)">~/.openpub/config.json</code> on your laptop. Run commands directly or let Claude Code / Cursor publish over MCP.
                  </p>
                  <div className="mt-auto pt-2 text-xs font-semibold text-(--accent)">
                    Best for writers who work from a terminal or an agent.
                  </div>
                </div>

                <div className="rounded-xl border border-(--border) bg-(--surface2)/50 p-5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-(--accent)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                      <line x1="6" y1="6" x2="6.01" y2="6" />
                      <line x1="6" y1="18" x2="6.01" y2="18" />
                    </svg>
                    <span>2. Self-Hosted Cloudflare Worker</span>
                  </div>
                  <p className="text-xs leading-relaxed text-(--dim)">
                    Deploy OpenPub to your Cloudflare account. Backed by D1 SQLite, R2 media storage, Queues with automatic retries, and a live web dashboard. KV binding is currently unused.
                  </p>
                  <div className="mt-auto pt-2 text-xs font-semibold text-(--accent)">
                    Best when you want a web console, queued retries and MCP over HTTP.
                  </div>
                </div>
              </div>

              <SubHeading id="quickstart" title="Quickstart with the CLI" />
              <p className="docs-prose text-(--dim)">
                The CLI isn&apos;t on npm yet. In a clone of the repo, build it once with <code className="docs-code rounded bg-(--surface2) px-1.5 py-0.5 text-xs text-(--accent) border border-(--border)">npm install &amp;&amp; npm run cli:build</code>, then store credentials, check them, and publish:
              </p>

              <CodeBlock
                code={`# Stored locally; publishing sends them only to that platform\nnode apps/cli/dist/index.js setup devto '{"api_key": "dv1_your_api_key"}'`}
                title="Store credentials (dev.to example)"
              />

              <CodeBlock
                code="node apps/cli/dist/index.js status"
                title="Verify reachability"
              />

              <CodeBlock
                code={`# Draft by default. Pass --status published to make it live\nnode apps/cli/dist/index.js publish post.md --to devto,hashnode,github-pages`}
                title="Publish markdown to platforms"
              />

              <Callout type="tip">
                <strong className="text-(--fg)">CLI and local stdio MCP default to drafts.</strong> A post goes public only with <code className="docs-code text-(--accent)">--status published</code>, <code className="docs-code text-(--accent)">status: published</code> in frontmatter, or <code className="docs-code text-(--accent)">defaults.status</code> in your config. The self-hosted Worker and remote MCP publish live immediately; Substack creates drafts only.
              </Callout>

              <div id="deploy-guide" className="scroll-mt-24">
                <SubHeading id="prerequisites" title="Prerequisites" />
              </div>
              <ul className="list-disc list-inside space-y-1.5 docs-prose text-sm text-(--dim)">
                <li>Cloudflare account; resource quotas, account eligibility, and billing requirements vary</li>
                <li>Node.js 22 or newer</li>
                <li>Wrangler CLI: <code className="docs-code rounded bg-(--surface2) px-1.5 py-0.5 text-xs text-(--accent) border border-(--border)">npm install -g wrangler</code> (or run via <code className="docs-code rounded bg-(--surface2) px-1.5 py-0.5 text-xs text-(--accent) border border-(--border)">npx wrangler</code>)</li>
                <li>Wrangler 4.x recommended; the repository pins <code className="docs-code">wrangler@^4</code> as a dev dependency</li>
              </ul>

              <p className="docs-prose text-(--dim) mt-3">
                Log in once so Wrangler can interact with your Cloudflare account:
              </p>
              <CodeBlock code="wrangler login" title="terminal" />

              <SubHeading id="step-1-install" title="1. Clone and Install" />
              <CodeBlock
                code={`git clone https://github.com/princepal9120/openpub.git openpub\ncd openpub\nnpm ci`}
                title="terminal"
              />

              <SubHeading id="step-2-resources" title="2. Create Cloudflare Resources" />
              <p className="docs-prose text-(--dim)">
                OpenPub relies on five Cloudflare resource bindings matching <code className="docs-code rounded bg-(--surface2) px-1.5 py-0.5 text-xs text-(--accent) border border-(--border)">wrangler.toml</code>. Four are provisioned via the Wrangler CLI, plus Workers AI enabled on your account:
              </p>
              <CodeBlock
                code={`# D1 database (drafts, publish log, platform credentials)\nwrangler d1 create openpub-db\n\n# KV namespace (bound but currently unused)\nwrangler kv namespace create KEYS\n\n# R2 bucket (generated cover images)\nwrangler r2 bucket create openpub-media\n\n# Queue (async publish jobs, with consumer configured in wrangler.toml)\nwrangler queues create openpub-publish`}
                title="bash"
              />

              <p className="docs-prose text-(--dim)">
                Each command outputs a resource ID. Update your <code className="docs-code rounded bg-(--surface2) px-1.5 py-0.5 text-xs text-(--accent) border border-(--border)">wrangler.toml</code> with these values:
              </p>
              <CodeBlock
                code={`[[d1_databases]]\nbinding = "DB"\ndatabase_name = "openpub-db"\ndatabase_id = "<id from d1 create>"\n\n[[kv_namespaces]]\nbinding = "KEYS"\nid = "<id from kv namespace create>"\n\n[[r2_buckets]]\nbinding = "MEDIA"\nbucket_name = "openpub-media"\n\n[[queues.producers]]\nbinding = "PUBLISH_QUEUE"\nqueue = "openpub-publish"\n\n[[queues.consumers]]\nqueue = "openpub-publish"\nmax_batch_size = 5\nmax_retries = 3\n\n[ai]\nbinding = "AI"`}
                title="wrangler.toml"
              />

              <SubHeading id="step-3-schema" title="3. Apply Database Schema" />
              <CodeBlock
                code="wrangler d1 execute openpub-db --remote --file=./migrations/init.sql"
                title="bash"
              />
              <p className="docs-prose text-(--dim)">
                This migration initializes the tables <code className="docs-code text-(--accent)">platform_config</code>, <code className="docs-code text-(--accent)">drafts</code>, and <code className="docs-code text-(--accent)">publish_log</code>. Safe to re-run at any time because all statements utilize <code className="docs-code">IF NOT EXISTS</code>.
              </p>

              <SubHeading id="step-4-secret" title="4. Set the Admin Secret" />
              <p className="docs-prose text-(--dim)">
                The <code className="docs-code rounded bg-(--surface2) px-1 py-0.5 text-xs text-(--accent) border border-(--border)">ADMIN_KEY</code> secret authenticates REST API calls and MCP requests. Use a Bearer token for POST requests and MCP; <code className="docs-code">?key=</code> works only for GET requests under <code className="docs-code">/api</code>. Generate a strong 32-byte hex key:
              </p>
              <CodeBlock
                code={`openssl rand -hex 32\nwrangler secret put ADMIN_KEY\n# paste the generated key when prompted`}
                title="bash"
              />
              <Callout type="tip">
                Store this key safely in your password manager. It protects Worker endpoints and access to platform credentials stored in D1 as plaintext JSON.
              </Callout>

              <SubHeading id="step-5-url" title="5. Configure BASE_URL" />
              <p className="docs-prose text-(--dim)">
                Generated cover image URLs and canonical links are constructed using <code className="docs-code text-(--accent)">BASE_URL</code>. Update the <code className="docs-code">[vars]</code> section in <code className="docs-code">wrangler.toml</code>:
              </p>
              <CodeBlock
                code={`[vars]\nBASE_URL = "https://openpub.<your-subdomain>.workers.dev"\nDASHBOARD_URL = "https://openpub.<your-subdomain>.workers.dev"`}
                title="wrangler.toml"
              />
              <p className="text-xs text-(--dim2)">
                If you do not know your subdomain yet, deploy once in step 6, copy the printed URL, update <code className="docs-code text-(--accent)">BASE_URL</code>, and deploy again.
              </p>

              <SubHeading id="step-6-deploy" title="6. Deploy to Cloudflare" />
              <CodeBlock code="npm run deploy" title="bash" />
              <p className="docs-prose text-(--dim)">
                This builds the dashboard SPA (<code className="docs-code text-xs">npm run build --workspace openpub-dashboard</code>) to <code className="docs-code text-xs">apps/dashboard/.output/public</code>, then deploys the Worker and its static assets together with Wrangler.
              </p>

              <SubHeading id="step-7-verify" title="7. Verify Endpoints" />
              <p className="docs-prose text-(--dim)">Public liveness check:</p>
              <CodeBlock
                code={`curl https://openpub.<subdomain>.workers.dev/health\n# {"ok":true,"name":"openpub"}`}
                title="bash"
              />

              <p className="docs-prose text-(--dim)">Authenticated API status check:</p>
              <CodeBlock
                code={`curl -H "Authorization: Bearer $ADMIN_KEY" \\\n  https://openpub.<subdomain>.workers.dev/api/status\n# {"platforms":[],"available":["devto","hashnode","wordpress","ghost","medium","substack","github-pages","x"]}`}
                title="bash"
              />

              <p className="docs-prose text-(--dim)">Streamable MCP handshake check:</p>
              <CodeBlock
                code={`curl https://openpub.<subdomain>.workers.dev/mcp\n# {"name":"openpub","transport":"streamable-http","usage":"POST JSON-RPC with Authorization: Bearer ADMIN_KEY"}`}
                title="bash"
              />

              <SubHeading id="custom-domain" title="Custom Domain (Optional)" />
              <ol className="list-decimal list-inside space-y-1.5 docs-prose text-sm text-(--dim)">
                <li>Add your domain zone to your Cloudflare dashboard.</li>
                <li>Navigate to Workers & Pages -&gt; select <code className="docs-code text-xs">openpub</code> -&gt; Settings -&gt; Domains & Routes -&gt; Add Custom Domain.</li>
                <li>Enter your preferred hostname (e.g. <code className="docs-code text-xs">publish.yourdomain.com</code>). Cloudflare provisions TLS automatically.</li>
                <li>Update <code className="docs-code text-xs">BASE_URL</code> in <code className="docs-code text-xs">wrangler.toml</code> to match and run <code className="docs-code text-xs">npm run deploy</code>.</li>
              </ol>

              <SubHeading id="free-tier" title="Cloudflare Free Tier Allocation" />
              <div className="overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface)/75 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/50 text-(--dim) font-mono">
                      <th className="px-3.5 py-3">Resource</th>
                      <th className="px-3.5 py-3">Free Tier Quota</th>
                      <th className="px-3.5 py-3">Usage in OpenPub</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg3)">
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">Workers requests</td>
                      <td className="px-3.5 py-2.5 font-mono">100,000 / day</td>
                      <td className="px-3.5 py-2.5">REST API and remote MCP requests</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">D1 Database</td>
                      <td className="px-3.5 py-2.5 font-mono">5 GB storage, 5M reads / day</td>
                      <td className="px-3.5 py-2.5">Draft bodies, publish logs, and platform credentials</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">KV Namespace</td>
                      <td className="px-3.5 py-2.5 font-mono">100,000 reads / day</td>
                      <td className="px-3.5 py-2.5">Bound in configuration; currently unused</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">R2 Object Storage</td>
                      <td className="px-3.5 py-2.5 font-mono">10 GB storage, $0 egress</td>
                      <td className="px-3.5 py-2.5">Generated cover images and uploaded assets</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">Queues</td>
                      <td className="px-3.5 py-2.5 font-mono">Check current Cloudflare plan</td>
                      <td className="px-3.5 py-2.5">Decoupled async publishing jobs with automatic retries</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">Workers AI</td>
                      <td className="px-3.5 py-2.5 font-mono">10,000 neurons / day</td>
                      <td className="px-3.5 py-2.5">Fast FLUX cover image generation</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading id="updating" title="Updating OpenPub" />
              <CodeBlock
                code={`git pull\nnpm ci\nnpm run deploy\n# For database schema upgrades:\nwrangler d1 execute openpub-db --remote --file=./migrations/<name>.sql`}
                title="bash"
              />

              <SubHeading id="console-onboarding" title="Set up the web console" />
              <p className="docs-prose text-(--dim)">
                After deploying, <a href="/app" className="text-(--accent) hover:underline">open the console</a> and complete three steps: test your instance URL and admin key, save credentials for a platform, then save your first Markdown draft. Platform credentials are stored as JSON in your instance's D1 database. Saving them is separate from testing the platform connection. The admin key stays in this browser's localStorage and is sent as a Bearer header on API requests.
              </p>
              <p className="docs-prose text-(--dim)">
                Setup never publishes. Saving the first draft shows a saved confirmation; choose Open console when you are ready. Publishing later requires reviewing and confirming the destinations. Substack creates a draft for you to publish in its own editor.
              </p>

              <SubHeading id="next-steps" title="Next Steps" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
                <a
                  href="#prerequisites"
                  className="rounded-xl border border-(--border) bg-(--surface2)/50 p-4 flex flex-col gap-2 transition-colors hover:border-(--accent) hover:bg-(--surface2)/80 text-left"
                >
                  <span className="text-sm font-semibold text-(--fg)">Deploy to Cloudflare &rarr;</span>
                  <span className="text-xs leading-relaxed text-(--dim)">
                    Step-by-step guide for creating D1, KV, R2, and Queue resources.
                  </span>
                </a>
                <a
                  href="/app"
                  className="rounded-xl border border-(--border) bg-(--surface2)/50 p-4 flex flex-col gap-2 transition-colors hover:border-(--accent) hover:bg-(--surface2)/80 text-left"
                >
                  <span className="text-sm font-semibold text-(--fg)">Dashboard Walkthrough &rarr;</span>
                  <span className="text-xs leading-relaxed text-(--dim)">
                    Explore the interactive web console for managing drafts and status.
                  </span>
                </a>
                <a
                  href="/"
                  className="rounded-xl border border-(--border) bg-(--surface2)/50 p-4 flex flex-col gap-2 transition-colors hover:border-(--accent) hover:bg-(--surface2)/80 text-left"
                >
                  <span className="text-sm font-semibold text-(--fg)">Main Landing Page &rarr;</span>
                  <span className="text-xs leading-relaxed text-(--dim)">
                    Return to the site overview, platform matrix, and value proposition.
                  </span>
                </a>
              </div>
            </section>

            {/* INTERFACES GROUP ANCHOR */}
            <div id="interfaces" className="-mt-14 pt-14" />

            {/* SECTION 2: CLI REFERENCE */}
            <section className="space-y-6 pt-14">
              <SectionHeading
                id="cli"
                badge="Terminal Workflow"
                title="CLI Reference"
                subtitle="The local-first openpub CLI runs directly on your machine with credentials stored in ~/.openpub/config.json (0600), letting you manage platforms, audit markdown, validate links, and fan out publications."
              />

              <SubHeading id="cli-install" title="Installation & Setup" />
              <p className="docs-prose text-(--dim)">
                Build the CLI from a clone of this repository (Node 20+):
              </p>
              <CodeBlock
                code={`git clone https://github.com/princepal9120/openpub.git\ncd openpub\nnpm install && npm run cli:build`}
                title="terminal"
              />
              <p className="docs-prose text-(--dim)">
                Run commands with <code className="docs-code text-(--fg2)">node apps/cli/dist/index.js &lt;command&gt;</code>, or run <code className="docs-code text-(--fg2)">npm link --workspace openpub-cli</code> once to make the <code className="docs-code text-(--accent)">openpub</code> binary available globally in your PATH.
              </p>

              <p className="docs-prose text-(--dim)">Initialize the local OpenPub configuration:</p>
              <CodeBlock
                code="node apps/cli/dist/index.js init"
                title="bash"
              />
              <p className="text-xs text-(--dim2)">
                <code className="docs-code">openpub init</code> creates <code className="docs-code">~/.openpub</code> and prints the next setup command. Platform credentials are saved to <code className="docs-code">~/.openpub/config.json</code> with restrictive permissions (0600) and are only sent directly to target platform APIs when publishing.
              </p>

              <SubHeading id="cli-matrix" title="Command Reference Matrix" />
              <div className="overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface)/75 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/50 text-(--dim) font-mono">
                      <th className="px-3.5 py-3">Command</th>
                      <th className="px-3.5 py-3">Arguments & Flags</th>
                      <th className="px-3.5 py-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg3) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">init</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">-</td>
                      <td className="px-3.5 py-2.5 font-sans">Create ~/.openpub directory and print next steps</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">setup</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;platform&gt; &lt;json-or-file&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Store platform credentials in ~/.openpub/config.json and verify</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">test</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;platform&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Verify stored credentials against target platform API</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">forget</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;platform&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Remove stored credentials for a platform</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">status</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">-</td>
                      <td className="px-3.5 py-2.5 font-sans">Show configured platforms, reachability, and defaults</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">publish</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt; [--to ...] [--status draft|published] [--canonical &lt;url&gt;] [--dry-run] [--force]</td>
                      <td className="px-3.5 py-2.5 font-sans">Fan out article to platforms (default status: draft)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">preview</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Render local markdown to HTML in ~/.openpub/preview/index.html</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">frontmatter</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt; [--format &lt;f&gt;]</td>
                      <td className="px-3.5 py-2.5 font-sans">Rewrite frontmatter (openpub, hugo, jekyll, astro, nextjs, devto, hashnode, ghost)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">audit</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Report quality issues (word count, headings, links, tags) and score out of 100</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">check-links</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">HEAD-request every HTTP(S) URL in the post and report status</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading id="cli-commands" title="Command Examples" />
              <p className="docs-prose text-(--dim)">Publish a post to dev.to and Hashnode:</p>
              <CodeBlock
                code="node apps/cli/dist/index.js publish my-article.md --to devto,hashnode --status draft"
                title="bash"
              />

              <p className="docs-prose text-(--dim)">Check configured platforms status:</p>
              <CodeBlock code="node apps/cli/dist/index.js status" title="bash" />

              <SubHeading id="cli-frontmatter" title="Markdown Frontmatter Specification" />
              <p className="docs-prose text-(--dim)">
                Specify target platforms, canonical URLs, and tags directly inside your Markdown frontmatter:
              </p>
              <CodeBlock
                code={`---\ntitle: "Shipping Edge Workers on Cloudflare"\ncanonical: "https://myblog.com/posts/shipping-edge-workers"\ncover_image: "https://<worker>/covers/<uuid>.png"\nplatforms:\n  - devto\n  - hashnode\n  - ghost\n  - wordpress\ntags:\n  - typescript\n  - cloudflare\n  - webdev\nstatus: draft\n---\n\n## Introduction\n\nYour article content starts here in standard Markdown...`}
                title="article.md"
              />
            </section>

            {/* SECTION 3: MCP SETUP */}
            <section className="space-y-6 pt-14">
              <SectionHeading
                id="mcp"
                badge="Agent Integration"
                title="MCP Setup"
                subtitle="OpenPub provides two ways to connect AI agents: a local stdio MCP server running on your machine, and a Streamable HTTP MCP server on your deployed Cloudflare Worker at POST /mcp."
              />

              <SubHeading id="mcp-overview" title="Local stdio vs Streamable HTTP" />
              <p className="docs-prose text-(--dim)">
                OpenPub ships a local stdio MCP server for direct integration with Claude Code, Cursor, Codex, and VS Code without requiring a Cloudflare deployment. When self-hosting on Cloudflare, OpenPub additionally exposes a Model Context Protocol endpoint over Streamable HTTP at <code className="docs-code text-(--accent)">POST /mcp</code>, protected by your <code className="docs-code text-(--accent)">ADMIN_KEY</code> secret.
              </p>

              <SubHeading id="mcp-build" title="Build Local stdio Server from Repo" />
              <p className="docs-prose text-(--dim)">
                Build the local stdio MCP server from a clone of this repository (Node 20+):
              </p>
              <CodeBlock
                code={`git clone https://github.com/princepal9120/openpub.git\ncd openpub/apps/mcp\nnpm install && npm run build`}
                title="terminal"
              />

              <SubHeading id="mcp-tools" title="Available MCP Tools" />
              <p className="docs-prose text-(--dim)">
                OpenPub defines tool sets tailored to each transport: 10 local tools for stdio clients and 13 remote tools for Cloudflare Worker clients.
              </p>

              <h4 className="mt-6 font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold uppercase tracking-wider text-(--accent)">
                Local stdio MCP Tools (10 Tools · apps/mcp/handlers.ts)
              </h4>
              <p className="text-xs text-(--dim) mt-1">
                Transport: <code className="docs-code text-xs">stdio</code>. Operates directly on local markdown files, <code className="docs-code text-xs">~/.openpub/config.json</code>, and <code className="docs-code text-xs">~/.openpub/state.json</code>.
              </p>
              <div className="overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface)/75 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/50 text-(--dim) font-mono">
                      <th className="px-3.5 py-3">Tool</th>
                      <th className="px-3.5 py-3">Purpose</th>
                      <th className="px-3.5 py-3">Key Arguments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg3) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Fan out local Markdown file to selected platforms (default: draft)</td>
                      <td className="px-3.5 py-2.5 font-sans">file (req), platforms[], status, canonical, dryRun, force</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">cross_publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Write inline content to temp file and fan out (default: draft)</td>
                      <td className="px-3.5 py-2.5 font-sans">title (req), content (req), platforms[], status</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">list_published</td>
                      <td className="px-3.5 py-2.5 font-sans">Return entries from local ledger (~/.openpub/state.json)</td>
                      <td className="px-3.5 py-2.5 font-sans">-</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">setup</td>
                      <td className="px-3.5 py-2.5 font-sans">Store and verify credentials in ~/.openpub/config.json</td>
                      <td className="px-3.5 py-2.5 font-sans">platform (req), credentials (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">status</td>
                      <td className="px-3.5 py-2.5 font-sans">List configured platforms and verification status</td>
                      <td className="px-3.5 py-2.5 font-sans">-</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">test_platform</td>
                      <td className="px-3.5 py-2.5 font-sans">Verify stored credentials against one platform API</td>
                      <td className="px-3.5 py-2.5 font-sans">platform (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">content_audit</td>
                      <td className="px-3.5 py-2.5 font-sans">Score Markdown file with CLI audit parity quality checks</td>
                      <td className="px-3.5 py-2.5 font-sans">file (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">check_links</td>
                      <td className="px-3.5 py-2.5 font-sans">HEAD-request every URL in Markdown file and report status</td>
                      <td className="px-3.5 py-2.5 font-sans">file (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">frontmatter</td>
                      <td className="px-3.5 py-2.5 font-sans">Rewrite frontmatter into target format preserving fields</td>
                      <td className="px-3.5 py-2.5 font-sans">file (req), format (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">x_article</td>
                      <td className="px-3.5 py-2.5 font-sans">Publish Markdown file to X platform only (default: draft)</td>
                      <td className="px-3.5 py-2.5 font-sans">file (req), status</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="mt-8 font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold uppercase tracking-wider text-(--accent)">
                Remote Worker MCP Tools (13 Tools · src/mcp.ts)
              </h4>
              <p className="text-xs text-(--dim) mt-1">
                Transport: <code className="docs-code text-xs">Streamable HTTP</code> (<code className="docs-code text-xs">POST /mcp</code>). Requires <code className="docs-code text-xs">ADMIN_KEY</code> authentication. Worker publish tools publish live immediately; <code className="docs-code">save_draft</code> only creates a draft. Operates on Cloudflare D1, R2, Queues, and Workers AI.
              </p>
              <div className="overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface)/75 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/50 text-(--dim) font-mono">
                      <th className="px-3.5 py-3">Tool</th>
                      <th className="px-3.5 py-3">Purpose</th>
                      <th className="px-3.5 py-3">Key Arguments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg3) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Publish a saved draft from D1 to one platform via Queue</td>
                      <td className="px-3.5 py-2.5 font-sans">draftId (req), platform (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">cross_publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Publish draft or inline content to all platforms with canonical wiring</td>
                      <td className="px-3.5 py-2.5 font-sans">draftId?, title?, content?, platforms[]</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">save_draft</td>
                      <td className="px-3.5 py-2.5 font-sans">Create a draft in Cloudflare D1 storage</td>
                      <td className="px-3.5 py-2.5 font-sans">content (req), platforms[] (req), title?</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">list_drafts</td>
                      <td className="px-3.5 py-2.5 font-sans">List existing drafts in D1 with status and platforms</td>
                      <td className="px-3.5 py-2.5 font-sans">-</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">get_draft</td>
                      <td className="px-3.5 py-2.5 font-sans">Retrieve draft details and markdown body from D1</td>
                      <td className="px-3.5 py-2.5 font-sans">id (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">delete_draft</td>
                      <td className="px-3.5 py-2.5 font-sans">Remove a draft from D1 storage</td>
                      <td className="px-3.5 py-2.5 font-sans">id (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">setup</td>
                      <td className="px-3.5 py-2.5 font-sans">Store platform API credentials in D1 table platform_config</td>
                      <td className="px-3.5 py-2.5 font-sans">platform (req), credentials (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">status</td>
                      <td className="px-3.5 py-2.5 font-sans">Show configured and available platforms from D1</td>
                      <td className="px-3.5 py-2.5 font-sans">-</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">test_platform</td>
                      <td className="px-3.5 py-2.5 font-sans">Test stored credentials against target platform API</td>
                      <td className="px-3.5 py-2.5 font-sans">platform (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">generate_cover</td>
                      <td className="px-3.5 py-2.5 font-sans">Generate cover image via Workers AI and store in R2 bucket</td>
                      <td className="px-3.5 py-2.5 font-sans">prompt (req), draftId?</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">list_posts</td>
                      <td className="px-3.5 py-2.5 font-sans">Inspect publish history from D1 publish_log with live URLs</td>
                      <td className="px-3.5 py-2.5 font-sans">-</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">check_links</td>
                      <td className="px-3.5 py-2.5 font-sans">HEAD-check URLs in Markdown body with SSRF protections</td>
                      <td className="px-3.5 py-2.5 font-sans">content (req)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">frontmatter</td>
                      <td className="px-3.5 py-2.5 font-sans">Generate frontmatter block for Hugo, Jekyll, Astro, Next.js, etc.</td>
                      <td className="px-3.5 py-2.5 font-sans">title (req), format (req), tags?</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading id="mcp-claude-code" title="Claude Code Configuration" />
              <p className="docs-prose text-(--dim)">
                For local stdio mode, add to <code className="docs-code text-xs">.mcp.json</code> in your project:
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "openpub": {\n      "command": "node",\n      "args": ["/absolute/path/to/openpub/apps/mcp/dist/index.js"]\n    }\n  }\n}`}
                title=".mcp.json (local stdio)"
              />
              <p className="docs-prose text-(--dim)">
                Or connect to your self-hosted Cloudflare Worker over HTTP:
              </p>
              <CodeBlock
                code={`claude mcp add --transport http openpub \\\n  https://openpub.<subdomain>.workers.dev/mcp \\\n  --header "Authorization: Bearer <ADMIN_KEY>"`}
                title="terminal (remote worker)"
              />

              <SubHeading id="mcp-cursor" title="Cursor & VS Code Configuration" />
              <p className="docs-prose text-(--dim)">
                Add to <code className="docs-code text-xs">.cursor/mcp.json</code>:
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "openpub": {\n      "command": "node",\n      "args": ["/absolute/path/to/openpub/apps/mcp/dist/index.js"]\n    }\n  }\n}`}
                title=".cursor/mcp.json (local stdio)"
              />
              <p className="text-xs text-(--dim2)">
                For VS Code GitHub Copilot, use <code className="docs-code text-xs">.vscode/mcp.json</code> with a <code className="docs-code text-xs">&quot;servers&quot;</code> key. For remote HTTP worker access, replace command/args with <code className="docs-code text-xs">&quot;url&quot;: &quot;https://openpub.&lt;subdomain&gt;.workers.dev/mcp&quot;</code> and headers.
              </p>

              <SubHeading id="mcp-windsurf" title="Windsurf & Codex Configuration" />
              <p className="docs-prose text-(--dim)">
                Add to <code className="docs-code text-xs">mcp_config.json</code> in Windsurf:
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "openpub": {\n      "command": "node",\n      "args": ["/absolute/path/to/openpub/apps/mcp/dist/index.js"]\n    }\n  }\n}`}
                title="mcp_config.json"
              />
              <p className="text-xs text-(--dim2)">
                For Codex CLI, add <code className="docs-code text-xs">[mcp_servers.openpub]</code> with <code className="docs-code text-xs">command = &quot;node&quot;</code> and <code className="docs-code text-xs">args = [&quot;/absolute/path/to/openpub/apps/mcp/dist/index.js&quot;]</code> in <code className="docs-code text-xs">~/.codex/config.toml</code>.
              </p>

              <SubHeading id="mcp-curl" title="Generic HTTP / curl Verification" />
              <CodeBlock
                code={`BASE=https://openpub.<subdomain>.workers.dev\nKEY=<ADMIN_KEY>\n\n# Call tools/list\ncurl -X POST $BASE/mcp \\\n  -H "Authorization: Bearer $KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'`}
                title="bash"
              />

              <SubHeading id="mcp-first-session" title="Typical First Agent Session" />
              <p className="docs-prose text-(--dim)">
                Remote MCP cannot read local files. Include article text in your prompt. Worker publishing sends posts live immediately; use the local CLI or stdio MCP when you need draft-first publishing.
              </p>
              <div className="rounded-xl border border-(--border) bg-(--surface2)/40 p-4 font-mono text-xs text-(--accent)">
                &quot;Check these links, generate a cover image, then publish this article to dev.to and Hashnode: [paste article text]&quot;
              </div>

              <SubHeading id="mcp-troubleshooting" title="Troubleshooting Guide" />
              <div className="overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface)/75 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/50 text-(--dim) font-mono">
                      <th className="px-3.5 py-3">Symptom</th>
                      <th className="px-3.5 py-3">Cause</th>
                      <th className="px-3.5 py-3">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg3)">
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--danger)">401 unauthorized</td>
                      <td className="px-3.5 py-2.5">Incorrect or missing ADMIN_KEY</td>
                      <td className="px-3.5 py-2.5">Verify Bearer header matches the secret set with wrangler secret put</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--danger)">Tools not showing</td>
                      <td className="px-3.5 py-2.5">Client failed initial handshake</td>
                      <td className="px-3.5 py-2.5">Reload editor window or restart MCP server connection</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-6 pt-14">
              <SectionHeading
                id="github-action"
                badge="CI / CD Automation"
                title="GitHub Action"
                subtitle="Release status for automated publishing on push."
              />
              <SubHeading id="action-setup" title="Not released yet" />
              <Callout type="warning">
                The CLI npm package and a tagged GitHub Action release are not published yet.
                This repository does not currently include an Action entry point. Do not use
                <code className="docs-code"> princepal9120/openpub@main </code>
                or an unreleased tag as a runnable publishing Action.
              </Callout>
              <p className="docs-prose text-(--dim)">
                For now, <a href="#cli-install" className="text-(--accent) hover:underline">build the CLI from source</a>
                {' '}and run a dry run before publishing. Keep credentials in repository secrets
                if you invoke the CLI from your own CI workflow.
              </p>
            </section>

            {/* REFERENCE GROUP ANCHOR */}
            <div id="reference" className="-mt-14 pt-14" />

            {/* SECTION 5: PLATFORMS TABLE */}
            <section className="space-y-6 pt-14">
              <SectionHeading
                id="platforms"
                badge="Adapters & Credentials"
                title="Platforms Table"
                subtitle="OpenPub supports eight publishing platforms. Adapters read credential keys verbatim; self-hosted Worker credentials are stored as plaintext JSON in D1."
              />

              <SubHeading id="platforms-overview" title="Storing and Testing Credentials" />
              <p className="docs-prose text-(--dim)">
                Store Worker credentials via REST API using <code className="docs-code text-(--accent)">POST /api/platforms/:name</code>. The local CLI stores credentials separately in <code className="docs-code">~/.openpub/config.json</code> and does not configure the Worker:
              </p>
              <CodeBlock
                code={`# Via REST API:\ncurl -X POST \\\n  -H "Authorization: Bearer $ADMIN_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"api_key": "your-devto-key"}' \\\n  https://<worker>/api/platforms/devto\n\n# Test connectivity:\ncurl -X POST -H "Authorization: Bearer $ADMIN_KEY" \\\n  https://<worker>/api/platforms/devto/test\n# {"ok":true}`}
                title="bash"
              />

              <SubHeading id="platforms-matrix" title="Quick Reference Matrix" />
              <div className="overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface)/75 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/50 text-(--dim) font-mono">
                      <th className="px-3.5 py-3">Platform</th>
                      <th className="px-3.5 py-3">Slug</th>
                      <th className="px-3.5 py-3">Credential Keys</th>
                      <th className="px-3.5 py-3">Token Source</th>
                      <th className="px-3.5 py-3">Behavior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg3) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">dev.to</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">devto</td>
                      <td className="px-3.5 py-2.5">api_key</td>
                      <td className="px-3.5 py-2.5 font-sans">Settings &gt; Extensions</td>
                      <td className="px-3.5 py-2.5 font-sans">Live publish, 4 tags max, canonical URL, cover</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">Hashnode</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">hashnode</td>
                      <td className="px-3.5 py-2.5">token, publication_id?</td>
                      <td className="px-3.5 py-2.5 font-sans">Account &gt; Developer &gt; PAT</td>
                      <td className="px-3.5 py-2.5 font-sans">GraphQL publishPost, 5 tags, canonical URL</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">WordPress</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">wordpress</td>
                      <td className="px-3.5 py-2.5">site_url, username, app_password</td>
                      <td className="px-3.5 py-2.5 font-sans">WP Admin &gt; Users &gt; App Passwords</td>
                      <td className="px-3.5 py-2.5 font-sans">REST API /wp-json/wp/v2/posts, HTML body</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">Ghost</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">ghost</td>
                      <td className="px-3.5 py-2.5">site_url, admin_key</td>
                      <td className="px-3.5 py-2.5 font-sans">Ghost Admin &gt; Integrations</td>
                      <td className="px-3.5 py-2.5 font-sans">Admin API key (id:secret), HS256 JWT, HTML body</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">Medium</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">medium</td>
                      <td className="px-3.5 py-2.5">integration_token</td>
                      <td className="px-3.5 py-2.5 font-sans">Settings &gt; Security and apps</td>
                      <td className="px-3.5 py-2.5 font-sans">Creates public or draft, canonical URL, no updates</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">Substack</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">substack</td>
                      <td className="px-3.5 py-2.5">publication_url, connect_sid</td>
                      <td className="px-3.5 py-2.5 font-sans">Browser DevTools Cookies</td>
                      <td className="px-3.5 py-2.5 font-sans">Internal drafts API, ProseMirror format, manual send</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">GitHub Pages</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">github-pages</td>
                      <td className="px-3.5 py-2.5">token, repo, dir?, branch?</td>
                      <td className="px-3.5 py-2.5 font-sans">GitHub Developer Settings &gt; PAT</td>
                      <td className="px-3.5 py-2.5 font-sans">Git commit markdown with frontmatter into repo</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg) font-sans font-medium">X Articles</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">x</td>
                      <td className="px-3.5 py-2.5">access_token</td>
                      <td className="px-3.5 py-2.5 font-sans">developer.x.com OAuth 2.0</td>
                      <td className="px-3.5 py-2.5 font-sans">Articles API v2, requires X Premium on account</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Individual Platform Breakdown */}
              <SubHeading id="platform-devto" title="dev.to (devto)" />
              <p className="docs-prose text-(--dim)">
                Scope: read and write articles. Go to <code className="docs-code text-xs">dev.to -&gt; Settings -&gt; Extensions -&gt; DEV Community API Keys</code>. Create a key named <code className="docs-code text-xs">openpub</code> and paste into credentials:
              </p>
              <CodeBlock code={`{\n  "api_key": "xxxxxxxxxxxxxxxxxxxxxxxx"\n}`} title="devto credentials JSON" />

              <SubHeading id="platform-hashnode" title="Hashnode (hashnode)" />
              <p className="docs-prose text-(--dim)">
                Go to <code className="docs-code text-xs">hashnode.com -&gt; Account Settings -&gt; Developer Settings -&gt; Personal Access Tokens</code>:
              </p>
              <CodeBlock code={`{\n  "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",\n  "publication_id": "65f1a2b3c4d5e6f7a8b9c0d1"\n}`} title="hashnode credentials JSON" />

              <SubHeading id="platform-wordpress" title="WordPress (wordpress)" />
              <p className="docs-prose text-(--dim)">
                Go to <code className="docs-code text-xs">WP Admin -&gt; Users -&gt; Profile -&gt; Application Passwords</code>. Generate an application password:
              </p>
              <CodeBlock code={`{\n  "site_url": "https://yourblog.com",\n  "username": "your-wp-username",\n  "app_password": "xxxx xxxx xxxx xxxx xxxx xxxx"\n}`} title="wordpress credentials JSON" />

              <SubHeading id="platform-ghost" title="Ghost (ghost)" />
              <p className="docs-prose text-(--dim)">
                Go to <code className="docs-code text-xs">Ghost Admin -&gt; Settings -&gt; Integrations -&gt; Add custom integration</code>. Copy the <strong>Admin API Key</strong> (format <code className="docs-code text-xs">&lt;id&gt;:&lt;secret&gt;</code>):
              </p>
              <CodeBlock code={`{\n  "site_url": "https://yourblog.ghost.io",\n  "admin_key": "64f1a2b3c4d5e6f7a8b9c0d1:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"\n}`} title="ghost credentials JSON" />

              <SubHeading id="platform-medium" title="Medium (medium)" />
              <p className="docs-prose text-(--dim)">
                Integration tokens available from <code className="docs-code text-xs">medium.com/me/settings -&gt; Security and apps</code>:
              </p>
              <CodeBlock code={`{\n  "integration_token": "2a1b3c4d5e6f..."\n}`} title="medium credentials JSON" />

              <SubHeading id="platform-substack" title="Substack (substack)" />
              <p className="docs-prose text-(--dim)">
                Copy <code className="docs-code text-xs">connect.sid</code> from browser DevTools Cookies on your publication domain:
              </p>
              <CodeBlock code={`{\n  "publication_url": "https://yourpub.substack.com",\n  "connect_sid": "s%3Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"\n}`} title="substack credentials JSON" />

              <SubHeading id="platform-github-pages" title="GitHub Pages (github-pages)" />
              <p className="docs-prose text-(--dim)">
                Directly commits Markdown files into your static site repository (Astro, Hugo, Jekyll, Next.js, mdBook):
              </p>
              <CodeBlock code={`{\n  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",\n  "repo": "youruser/yourblog",\n  "dir": "content/posts",\n  "branch": "main"\n}`} title="github-pages credentials JSON" />

              <SubHeading id="platform-x" title="X Articles (x)" />
              <p className="docs-prose text-(--dim)">
                Publishes articles via the X Articles API v2. Requires an account with active X Premium:
              </p>
              <CodeBlock code={`{\n  "access_token": "xxxxxxxxxxxxxxxxxxxxxxxx"\n}`} title="x credentials JSON" />
            </section>

            {/* SECTION 6: ARCHITECTURE */}
            <section className="space-y-6 pt-14">
              <SectionHeading
                id="architecture"
                badge="System Design"
                title="Architecture & API"
                subtitle="OpenPub relies entirely on Cloudflare edge primitives. No servers, no containers, and no external database dependencies."
              />

              <SubHeading id="arch-diagram" title="System Diagram" />
              <div className="my-5 overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface) p-5 font-mono text-xs leading-relaxed text-(--fg3)">
                <pre>{`                          +---------------------------------------------+
  MCP clients ----------->|   Cloudflare Worker (Hono)                  |
  (Claude Code, Cursor)   |                                             |
  Dashboard ------------->|   /api/*   REST    /mcp   JSON-RPC          |
                          +------+-+------------------+-+---------------+
                                 | |                  | |
                    +------------v-+ |      +---------v-+-+
                    |  D1            |      |  Queue      |
                    |  drafts, creds,|      |  openpub-  |
                    |  publish_log   |      |  publish    |
                    +------------+-+-+      +---------+-+-+
                               | |                 | | consumer (retry x3)
                               | |                 | v
                               | |        +--------+-------+
                               | |        | Platform       |---> dev.to API
                               | |        | adapters       |---> Hashnode GraphQL
                               | |        |                |---> WP REST
                               | |        |                |---> Ghost Admin API
                               | |        |                |---> Medium API
                               | |        |                |---> Substack drafts
                               | |        |                |---> GitHub Contents API
                               | |        |                |---> X Articles API
                               | |        +--------+-------+
                               | |                 | canonical URL of first
                               | +-----------------+ success feeds the rest
                               v
        KV: KEYS (unused)  R2: MEDIA (cover images)  Workers AI: FLUX schnell`}</pre>
              </div>

              <SubHeading id="arch-components" title="Core Edge Components" />
              <div className="grid gap-4 sm:grid-cols-2 my-4">
                <div className="rounded-xl border border-(--border)/85 bg-(--surface2)/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" aria-hidden="true" />
                    <h4 className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-(--fg)">
                      Cloudflare Worker (Hono)
                    </h4>
                  </div>
                  <p className="docs-prose mt-2 text-xs leading-relaxed text-(--dim)">
                    Edge request router handling high-performance REST APIs and the Streamable HTTP MCP JSON-RPC protocol in a single unified deployment.
                  </p>
                </div>

                <div className="rounded-xl border border-(--border)/85 bg-(--surface2)/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" aria-hidden="true" />
                    <h4 className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-(--fg)">
                      Cloudflare D1 Database
                    </h4>
                  </div>
                  <p className="docs-prose mt-2 text-xs leading-relaxed text-(--dim)">
                    Serverless SQLite database maintaining drafts, platform credentials, and publish logs. Failed and retryable log entries can be removed during retries.
                  </p>
                </div>

                <div className="rounded-xl border border-(--border)/85 bg-(--surface2)/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" aria-hidden="true" />
                    <h4 className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-(--fg)">
                      Cloudflare Queues
                    </h4>
                  </div>
                  <p className="docs-prose mt-2 text-xs leading-relaxed text-(--dim)">
                    Asynchronous task runner isolating each platform dispatch. If one external API times out, remaining platforms complete without failure.
                  </p>
                </div>

                <div className="rounded-xl border border-(--border)/85 bg-(--surface2)/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" aria-hidden="true" />
                    <h4 className="font-['IBM_Plex_Sans',sans-serif] text-sm font-semibold text-(--fg)">
                      R2 Bucket & Workers AI
                    </h4>
                  </div>
                  <p className="docs-prose mt-2 text-xs leading-relaxed text-(--dim)">
                    On-demand AI cover illustration using FLUX.1 schnell, stored in R2 and served directly by the edge worker with zero egress fees.
                  </p>
                </div>
              </div>

              <SubHeading id="arch-lifecycle" title="Publish Lifecycle & Canonical Injection" />
              <ol className="list-decimal list-inside space-y-2 docs-prose text-sm text-(--dim)">
                <li>
                  <strong className="text-(--fg2)">Draft Creation:</strong> Content is submitted through the dashboard or remote MCP API with title, tags, and target platforms. Worker tag parsing accepts inline <code className="docs-code">tags: [a, b]</code> only (max 6); YAML block-list tags are ignored. The local CLI and stdio MCP publish directly to platform APIs instead of this Worker.
                </li>
                <li>
                  <strong className="text-(--fg2)">Queue Dispatch:</strong> Individual queue messages are enqueued for each platform adapter.
                </li>
                <li>
                  <strong className="text-(--fg2)">First-Success Canonical Wiring:</strong> The first platform that successfully creates a public post sets the post URL as the article canonical URL.
                </li>
                <li>
                  <strong className="text-(--fg2)">Cross-Post Attribution:</strong> Subsequent platform publications automatically include that canonical tag, preserving your original search engine ranking equity.
                </li>
              </ol>

              <SubHeading id="arch-idempotency" title="Idempotent Republishing" />
              <p className="docs-prose text-(--dim)">
                The local CLI hashes content in <code className="docs-code">~/.openpub/state.json</code>; unchanged posts are skipped, and supported platforms update in place when remote IDs exist. X Articles, Substack, and Medium cannot be updated by the CLI. The Worker uses a separate queue: platforms already marked successful are skipped rather than updated.
              </p>

              <SubHeading id="arch-api-matrix" title="REST API Reference" />
              <div className="overflow-x-auto rounded-xl border border-(--border)/85 bg-(--surface)/75 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/50 text-(--dim) font-mono">
                      <th className="px-3.5 py-3">Method</th>
                      <th className="px-3.5 py-3">Endpoint</th>
                      <th className="px-3.5 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg3) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/health</td>
                      <td className="px-3.5 py-2.5 font-sans">Unauthenticated liveness check</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/status</td>
                      <td className="px-3.5 py-2.5 font-sans">Configured and available platform adapters</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/platforms/:name</td>
                      <td className="px-3.5 py-2.5 font-sans">Store platform credentials JSON</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/platforms/:name/test</td>
                      <td className="px-3.5 py-2.5 font-sans">Verify platform credentials against upstream API</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/drafts</td>
                      <td className="px-3.5 py-2.5 font-sans">List stored drafts in D1</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/drafts</td>
                      <td className="px-3.5 py-2.5 font-sans">Create a draft &#123;title, content, platforms, cover_image&#125;</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">PUT</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/drafts/:id</td>
                      <td className="px-3.5 py-2.5 font-sans">Update draft fields; send null to clear title or cover_image</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-red-400">DELETE</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/drafts/:id</td>
                      <td className="px-3.5 py-2.5 font-sans">Delete draft and publish history</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Queue all draft platforms or a requested subset</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/history</td>
                      <td className="px-3.5 py-2.5 font-sans">Fetch publish log with URLs and error diagnostics</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/history/:draftId/:platform/retry</td>
                      <td className="px-3.5 py-2.5 font-sans">Retry a failed platform publish</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/api/images/generate</td>
                      <td className="px-3.5 py-2.5 font-sans">Generate cover image from prompt via Workers AI</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg)">/mcp</td>
                      <td className="px-3.5 py-2.5 font-sans">Streamable HTTP MCP JSON-RPC 2.0 endpoint</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-20 border-t border-(--surface3) pt-8 pb-12">
              <div className="flex flex-wrap items-center justify-between gap-4 font-['IBM_Plex_Sans',sans-serif] text-xs text-(--dim)">
                <span>OpenPub · Open Source MIT License</span>
                <div className="flex items-center gap-6">
                  <a href="/" className="hover:text-(--accent) transition-colors">
                    Home
                  </a>
                  <a href="/app" className="hover:text-(--accent) transition-colors">
                    Dashboard
                  </a>
                  <a
                    href={GITHUB}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-(--accent) transition-colors"
                  >
                    GitHub Repository
                  </a>
                </div>
              </div>
            </footer>
          </main>

          {/* Right Sidebar: "On this page" TOC */}
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pl-4 xl:block border-l border-(--surface3)">
            <div className="text-xs font-semibold uppercase tracking-wider text-(--accent) font-['IBM_Plex_Sans',sans-serif]">
              On this page
            </div>
            <div className="mt-1 text-xs text-(--dim) font-medium">
              {currentSectionData.title}
            </div>
            <ul className="mt-3.5 space-y-2 border-l border-(--surface3) pl-3 text-xs">
              {currentSectionData.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block text-(--dim) hover:text-(--accent) transition-colors leading-relaxed"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-(--border) bg-(--surface2)/50 p-4 text-xs">
              <span className="font-semibold text-(--fg) block">Open Source</span>
              <p className="mt-1 text-[11px] leading-relaxed text-(--dim)">
                MIT licensed. Runs completely on your own machine and edge accounts.
              </p>
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-(--accent) hover:underline"
              >
                GitHub Repository &rarr;
              </a>
            </div>

            <div className="mt-4 rounded-xl border border-(--border) bg-(--surface2)/30 p-4 text-xs">
              <span className="font-semibold text-(--fg2) block">Need Help?</span>
              <p className="mt-1 text-[11px] leading-relaxed text-(--dim)">
                Issues or questions? Check our open source tracker or discussions on GitHub.
              </p>
              <a
                href={`${GITHUB}/issues`}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-(--accent) hover:underline"
              >
                Open an issue &rarr;
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
