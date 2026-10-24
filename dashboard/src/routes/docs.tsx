import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { ThemeToggle } from "~/components/ThemeToggle"
import { Logo } from '~/components/Logo'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

const GITHUB = 'https://github.com/princepal9120/openpub'

interface NavSection {
  id: string
  title: string
  items: { id: string; label: string }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'prerequisites', label: 'Prerequisites' },
      { id: 'step-1-install', label: '1. Clone & Install' },
      { id: 'step-2-resources', label: '2. Cloudflare Resources' },
      { id: 'step-3-schema', label: '3. Database Schema' },
      { id: 'step-4-secret', label: '4. Admin Secret' },
      { id: 'step-5-url', label: '5. Set BASE_URL' },
      { id: 'step-6-deploy', label: '6. Deploy Worker' },
      { id: 'step-7-verify', label: '7. Verify Endpoints' },
      { id: 'custom-domain', label: 'Custom Domain' },
      { id: 'free-tier', label: 'Free Tier Limits' },
      { id: 'updating', label: 'Updating' },
    ],
  },
  {
    id: 'platforms',
    title: 'Platforms Table',
    items: [
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
    ],
  },
  {
    id: 'cli',
    title: 'CLI Reference',
    items: [
      { id: 'cli-install', label: 'Install & Login' },
      { id: 'cli-matrix', label: 'Command Matrix' },
      { id: 'cli-commands', label: 'Command Details' },
      { id: 'cli-frontmatter', label: 'Markdown Frontmatter' },
    ],
  },
  {
    id: 'mcp',
    title: 'MCP Setup',
    items: [
      { id: 'mcp-overview', label: 'Streamable HTTP' },
      { id: 'mcp-tools', label: '13 Available Tools' },
      { id: 'mcp-claude-code', label: 'Claude Code' },
      { id: 'mcp-cursor', label: 'Cursor' },
      { id: 'mcp-windsurf', label: 'Windsurf' },
      { id: 'mcp-curl', label: 'Generic HTTP / curl' },
      { id: 'mcp-first-session', label: 'Typical First Session' },
      { id: 'mcp-troubleshooting', label: 'Troubleshooting' },
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture',
    items: [
      { id: 'arch-diagram', label: 'System Diagram' },
      { id: 'arch-components', label: 'Core Components' },
      { id: 'arch-lifecycle', label: 'Publish Lifecycle' },
      { id: 'arch-idempotency', label: 'Idempotency & Canonical' },
      { id: 'arch-api-matrix', label: 'REST API Reference' },
    ],
  },
]

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-(--border)/80 bg-(--surface)/80">
      {title && (
        <div className="flex items-center justify-between border-b border-(--border)/80 bg-(--surface2)/40 px-4 py-2 font-mono text-xs text-(--dim)">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-(--accent)/80" />
            {title}
          </span>
          <button
            type="button"
            onClick={copy}
            className="rounded border border-(--border) bg-(--surface2) px-2 py-0.5 font-mono text-[11px] text-(--fg4) transition-colors hover:border-(--surface4) hover:text-(--accent)"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <div className="relative">
        {!title && (
          <button
            type="button"
            onClick={copy}
            className="absolute top-2.5 right-2.5 rounded border border-(--border) bg-(--surface2)/90 px-2 py-0.5 font-mono text-[11px] text-(--fg4) transition-colors hover:border-(--surface4) hover:text-(--accent)"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-(--fg4)">
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
}: {
  id: string
  badge: string
  title: string
  subtitle?: string
}) {
  return (
    <div id={id} className="scroll-mt-24 pt-12 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
        <span className="font-mono text-xs uppercase tracking-widest text-(--accent)">
          {badge}
        </span>
      </div>
      <h2 className="mt-2 font-mono text-2xl font-bold tracking-tight text-(--fg2) sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-(--dim)">{subtitle}</p>
      )}
      <div className="mt-6 border-b border-(--surface2)" />
    </div>
  )
}

function SubHeading({ id, title }: { id: string; title: string }) {
  return (
    <h3
      id={id}
      className="scroll-mt-24 mt-10 mb-3 font-mono text-lg font-semibold tracking-tight text-(--fg2) flex items-center gap-2"
    >
      <span className="text-(--dim3) font-mono text-sm">#</span>
      {title}
    </h3>
  )
}

function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode
  type?: 'info' | 'tip'
}) {
  const isTip = type === 'tip'
  return (
    <div
      className={`my-4 rounded-lg border p-4 text-xs leading-relaxed ${
        isTip
          ? 'border-(--accent-strong)/40 bg-(--accent-strong)/10 text-(--accent)'
          : 'border-(--border) bg-(--surface2)/30 text-(--fg4)'
      }`}
    >
      {children}
    </div>
  )
}

function DocsPage() {
  const [activeSection, setActiveSection] = React.useState('getting-started')

  React.useEffect(() => {
    const handleScroll = () => {
      const headings = NAV_SECTIONS.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      }))

      const scrollPos = window.scrollY + 120
      for (let i = headings.length - 1; i >= 0; i--) {
        const item = headings[i]
        if (item.el && item.el.offsetTop <= scrollPos) {
          setActiveSection(item.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-(--bg) font-sans text-(--fg4) antialiased selection:bg-(--accent-strong)/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-(--surface2) bg-(--bg)/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a href="/" className="transition-opacity hover:opacity-90">
              <Logo />
            </a>
            <span className="rounded border border-(--border) bg-(--surface2) px-2 py-0.5 font-mono text-[11px] text-(--dim)">
              docs
            </span>
          </div>

          <div className="flex items-center gap-5 font-mono text-xs text-(--dim)">
            <a
              href="/"
              className="transition-colors hover:text-(--fg2) hidden sm:inline"
            >
              Home
            </a>
            <ThemeToggle />
            <a
              href="/app"
              className="rounded-md border border-(--border) bg-(--surface2)/50 px-3 py-1.5 text-(--fg3) transition-colors hover:border-(--accent-strong)/60 hover:text-(--accent)"
            >
              Open App
            </a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-(--fg2)"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-10">
          {/* Left Sidebar */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto py-8 pr-4 lg:block border-r border-(--surface2)">
            <nav className="space-y-6">
              {NAV_SECTIONS.map((sec) => (
                <div key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className={`block font-mono text-xs uppercase tracking-wider transition-colors ${
                      activeSection === sec.id
                        ? 'font-semibold text-(--accent)'
                        : 'text-(--dim) hover:text-(--fg3)'
                    }`}
                  >
                    {sec.title}
                  </a>
                  <ul className="mt-2.5 space-y-1.5 border-l border-(--surface2) pl-3">
                    {sec.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="block text-xs text-(--dim2) transition-colors hover:text-(--fg3)"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Content Column */}
          <main className="min-w-0 max-w-4xl flex-1 py-8 lg:py-10">
            {/* Quick jump for mobile */}
            <div className="mb-8 rounded-lg border border-(--border) bg-(--surface)/40 p-4 lg:hidden">
              <span className="font-mono text-xs uppercase tracking-wider text-(--accent)">
                Jump to Section
              </span>
              <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
                {NAV_SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="rounded border border-(--border) bg-(--surface2) px-2.5 py-1 text-(--fg4) hover:border-(--accent-strong)/60 hover:text-(--accent)"
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
                badge="Deployment & Setup"
                title="Getting Started"
                subtitle="OpenPub runs as a single Cloudflare Worker backed by D1 (drafts and publish log), KV (config), R2 (cover images), a Queue (publish jobs), and Workers AI (cover generation). One worker, no servers."
              />

              <SubHeading id="overview" title="Architecture Overview" />
              <p className="text-sm leading-relaxed text-(--dim)">
                Cross-posting tools typically keep your credentials on third-party servers, charge monthly subscriptions, or quietly break when platform APIs change. OpenPub runs inside your own Cloudflare account. Your drafts, credentials, and publish logs reside in your own D1 SQLite database.
              </p>

              <SubHeading id="prerequisites" title="Prerequisites" />
              <ul className="list-disc list-inside space-y-1 text-sm text-(--dim)">
                <li>Cloudflare account (the free plan includes all required resources)</li>
                <li>Node.js 20 or newer</li>
                <li>Wrangler CLI: <code className="rounded bg-(--surface2) px-1.5 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">npm install -g wrangler</code> (or via <code className="rounded bg-(--surface2) px-1.5 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">npx wrangler</code>)</li>
                <li>Wrangler 4.x recommended; the repo pins wrangler@^4 as a dev dependency</li>
              </ul>

              <p className="text-sm text-(--dim) mt-2">
                Log in once so Wrangler can interact with your Cloudflare account:
              </p>
              <CodeBlock code="wrangler login" title="terminal" />

              <SubHeading id="step-1-install" title="1. Clone and Install" />
              <CodeBlock
                code={`git clone https://github.com/princepal9120/openpub.git openpub\ncd openpub\nnpm install`}
                title="terminal"
              />

              <SubHeading id="step-2-resources" title="2. Create Cloudflare Resources" />
              <p className="text-sm text-(--dim)">
                OpenPub provisions four distinct Cloudflare bindings matching <code className="rounded bg-(--surface2) px-1.5 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">wrangler.toml</code>:
              </p>
              <CodeBlock
                code={`# D1 database (drafts, publish log, platform credentials)\nwrangler d1 create openpub-db\n\n# KV namespace (worker key/value config)\nwrangler kv namespace create KEYS\n\n# R2 bucket (generated cover images)\nwrangler r2 bucket create openpub-media\n\n# Queue (async publish jobs, with consumer configured in wrangler.toml)\nwrangler queues create openpub-publish`}
                title="bash"
              />

              <p className="text-sm text-(--dim)">
                Each command outputs an ID. Paste those values into <code className="rounded bg-(--surface2) px-1.5 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">wrangler.toml</code>:
              </p>
              <CodeBlock
                code={`[[d1_databases]]\nbinding = "DB"\ndatabase_name = "openpub-db"\ndatabase_id = "<id from d1 create>"\n\n[[kv_namespaces]]\nbinding = "KEYS"\nid = "<id from kv namespace create>"\n\n[[r2_buckets]]\nbinding = "MEDIA"\nbucket_name = "openpub-media"\n\n[[queues.producers]]\nbinding = "PUBLISH_QUEUE"\nqueue = "openpub-publish"\n\n[[queues.consumers]]\nqueue = "openpub-publish"\nmax_batch_size = 5\nmax_retries = 3\n\n[ai]\nbinding = "AI"`}
                title="wrangler.toml"
              />

              <SubHeading id="step-3-schema" title="3. Apply the Database Schema" />
              <CodeBlock
                code="wrangler d1 execute openpub-db --file=./migrations/init.sql"
                title="bash"
              />
              <p className="text-sm text-(--dim)">
                This migration creates <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">platform_config</code>, <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">drafts</code>, and <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">publish_log</code>. Safe to re-run at any time; all statements use <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">IF NOT EXISTS</code>.
              </p>

              <SubHeading id="step-4-secret" title="4. Set the Admin Secret" />
              <p className="text-sm text-(--dim)">
                The <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">ADMIN_KEY</code> authenticates every REST API call and MCP request via the Bearer header or <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">?key=</code> query param. Generate a 32-byte hex key:
              </p>
              <CodeBlock
                code={`openssl rand -hex 32\nwrangler secret put ADMIN_KEY\n# paste the generated key when prompted`}
                title="bash"
              />
              <Callout type="tip">
                Store this key in your password manager. It is the sole master credential protecting your worker endpoints and stored API tokens.
              </Callout>

              <SubHeading id="step-5-url" title="5. Configure BASE_URL" />
              <p className="text-sm text-(--dim)">
                Generated cover image URLs are constructed from <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">BASE_URL</code>. Update <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">[vars]</code> in <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">wrangler.toml</code>:
              </p>
              <CodeBlock
                code={`[vars]\nBASE_URL = "https://openpub.<your-subdomain>.workers.dev"`}
                title="wrangler.toml"
              />
              <p className="text-xs text-(--dim2)">
                If you do not know your subdomain yet, deploy once in step 6, copy the printed URL, update <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">BASE_URL</code>, and redeploy.
              </p>

              <SubHeading id="step-6-deploy" title="6. Deploy to Cloudflare" />
              <CodeBlock code="wrangler deploy" title="bash" />
              <p className="text-sm text-(--dim)">
                Wrangler compiles and deploys the worker, outputting the live production URL.
              </p>

              <SubHeading id="step-7-verify" title="7. Verify Endpoints" />
              <p className="text-sm text-(--dim)">Health check (unauthenticated public ping):</p>
              <CodeBlock
                code={`curl https://openpub.<subdomain>.workers.dev/health\n# {"ok":true,"name":"openpub"}`}
                title="bash"
              />

              <p className="text-sm text-(--dim)">Authenticated API status check:</p>
              <CodeBlock
                code={`curl -H "Authorization: Bearer $ADMIN_KEY" \\\n  https://openpub.<subdomain>.workers.dev/api/status\n# {"platforms":[],"available":["devto","hashnode","wordpress","ghost","medium","substack","github-pages","x"]}`}
                title="bash"
              />

              <p className="text-sm text-(--dim)">MCP endpoint handshake:</p>
              <CodeBlock
                code={`curl https://openpub.<subdomain>.workers.dev/mcp\n# {"name":"openpub","transport":"streamable-http", ...}`}
                title="bash"
              />

              <SubHeading id="custom-domain" title="Custom Domain (Optional)" />
              <p className="text-sm text-(--dim)">
                To serve OpenPub on your own apex or subdomain:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-(--dim)">
                <li>Add the domain zone to your Cloudflare account.</li>
                <li>In Cloudflare Dashboard: Workers & Pages -&gt; open <code className="font-mono text-xs">openpub</code> -&gt; Settings -&gt; Domains & Routes -&gt; Add Custom Domain.</li>
                <li>Enter e.g. <code className="font-mono text-xs">post.example.com</code>. Cloudflare automatically issues and manages the TLS certificate.</li>
                <li>Update <code className="font-mono text-xs">BASE_URL</code> in <code className="font-mono text-xs">wrangler.toml</code> to <code className="font-mono text-xs">https://post.example.com</code> and run <code className="font-mono text-xs">wrangler deploy</code>.</li>
              </ol>

              <SubHeading id="free-tier" title="Free Tier Breakdown" />
              <div className="overflow-x-auto rounded-lg border border-(--border)/80 bg-(--surface)/60 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/40 text-(--dim) font-mono">
                      <th className="px-3.5 py-2.5">Resource</th>
                      <th className="px-3.5 py-2.5">Free Tier Allocation</th>
                      <th className="px-3.5 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg4)">
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">Workers requests</td>
                      <td className="px-3.5 py-2.5 font-mono">100,000 / day</td>
                      <td className="px-3.5 py-2.5">Plenty for publishing, API calls, and MCP sessions</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">D1 Database</td>
                      <td className="px-3.5 py-2.5 font-mono">5 GB storage, 5M rows read / day</td>
                      <td className="px-3.5 py-2.5">Drafts, publish logs, and platform credentials</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">KV Namespace</td>
                      <td className="px-3.5 py-2.5 font-mono">100,000 reads / day, 1,000 writes / day</td>
                      <td className="px-3.5 py-2.5">Worker key/value cache and config</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">R2 Object Storage</td>
                      <td className="px-3.5 py-2.5 font-mono">10 GB storage, zero egress fees</td>
                      <td className="px-3.5 py-2.5">Generated cover images and media files</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">Queues</td>
                      <td className="px-3.5 py-2.5 font-mono">1,000,000 operations / month</td>
                      <td className="px-3.5 py-2.5">Decoupled async publishing jobs with automatic retries</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--accent)">Workers AI</td>
                      <td className="px-3.5 py-2.5 font-mono">10,000 neurons / day</td>
                      <td className="px-3.5 py-2.5">Uses @cf/black-forest-labs/flux-1-schnell for fast covers</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading id="updating" title="Updating OpenPub" />
              <CodeBlock
                code={`git pull\nwrangler deploy\n# For database updates:\nwrangler d1 execute openpub-db --file=./migrations/<name>.sql`}
                title="bash"
              />
              <p className="text-sm text-(--dim)">
                Secrets like <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">ADMIN_KEY</code> persist across deployments.
              </p>
            </section>

            {/* SECTION 2: PLATFORMS TABLE */}
            <section className="space-y-6 pt-12">
              <SectionHeading
                id="platforms"
                badge="Adapters & Credentials"
                title="Platforms Table"
                subtitle="OpenPub supports eight platforms out of the box. Credential keys are exact: adapters read them verbatim from the stored JSON record."
              />

              <SubHeading id="platforms-overview" title="Storing and Testing Credentials" />
              <p className="text-sm leading-relaxed text-(--dim)">
                Store credentials via REST API using <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">POST /api/platforms/:name</code> or via CLI with <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">openpub setup</code>:
              </p>
              <CodeBlock
                code={`# Via REST API:\ncurl -X POST \\\n  -H "Authorization: Bearer $ADMIN_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"api_key": "your-devto-key"}' \\\n  https://<worker>/api/platforms/devto\n\n# Test credentials:\ncurl -X POST -H "Authorization: Bearer $ADMIN_KEY" \\\n  https://<worker>/api/platforms/devto/test\n# {"ok":true}`}
                title="bash"
              />

              <SubHeading id="platforms-matrix" title="Quick Reference Matrix" />
              <div className="overflow-x-auto rounded-lg border border-(--border)/80 bg-(--surface)/60 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/40 text-(--dim) font-mono">
                      <th className="px-3.5 py-2.5">Platform</th>
                      <th className="px-3.5 py-2.5">Slug</th>
                      <th className="px-3.5 py-2.5">Credential Keys</th>
                      <th className="px-3.5 py-2.5">Token Location</th>
                      <th className="px-3.5 py-2.5">Behavior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg4) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">dev.to</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">devto</td>
                      <td className="px-3.5 py-2.5">api_key</td>
                      <td className="px-3.5 py-2.5 font-sans">Settings &gt; Extensions</td>
                      <td className="px-3.5 py-2.5 font-sans">Live publish, 4 tags max, canonical URL, cover</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">Hashnode</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">hashnode</td>
                      <td className="px-3.5 py-2.5">token, publication_id?</td>
                      <td className="px-3.5 py-2.5 font-sans">Account &gt; Developer &gt; PAT</td>
                      <td className="px-3.5 py-2.5 font-sans">GraphQL publishPost, 5 tags, canonical URL</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">WordPress</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">wordpress</td>
                      <td className="px-3.5 py-2.5">site_url, username, app_password</td>
                      <td className="px-3.5 py-2.5 font-sans">WP Admin &gt; Users &gt; App Passwords</td>
                      <td className="px-3.5 py-2.5 font-sans">REST API /wp-json/wp/v2/posts, HTML body</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">Ghost</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">ghost</td>
                      <td className="px-3.5 py-2.5">site_url, admin_key</td>
                      <td className="px-3.5 py-2.5 font-sans">Ghost Admin &gt; Integrations</td>
                      <td className="px-3.5 py-2.5 font-sans">Admin API key (id:secret), HS256 JWT, HTML body</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">Medium</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">medium</td>
                      <td className="px-3.5 py-2.5">integration_token</td>
                      <td className="px-3.5 py-2.5 font-sans">Settings &gt; Security and apps</td>
                      <td className="px-3.5 py-2.5 font-sans">Creates public or draft, canonical URL, no updates</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">Substack</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">substack</td>
                      <td className="px-3.5 py-2.5">publication_url, connect_sid</td>
                      <td className="px-3.5 py-2.5 font-sans">Browser DevTools Cookies</td>
                      <td className="px-3.5 py-2.5 font-sans">Internal drafts API, ProseMirror format, manual send</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">GitHub Pages</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">github-pages</td>
                      <td className="px-3.5 py-2.5">token, repo, dir?, branch?</td>
                      <td className="px-3.5 py-2.5 font-sans">GitHub Developer Settings &gt; PAT</td>
                      <td className="px-3.5 py-2.5 font-sans">Git commit markdown with frontmatter into repo</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--fg2) font-sans font-medium">X Articles</td>
                      <td className="px-3.5 py-2.5 text-(--accent)">x</td>
                      <td className="px-3.5 py-2.5">access_token</td>
                      <td className="px-3.5 py-2.5 font-sans">developer.x.com OAuth 2.0</td>
                      <td className="px-3.5 py-2.5 font-sans">Articles API v2, requires X Premium on account</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Individual Platform Details */}
              <SubHeading id="platform-devto" title="dev.to (devto)" />
              <p className="text-sm text-(--dim)">
                Scope: read and write articles. Go to <code className="font-mono text-xs text-(--fg4)">dev.to -&gt; Settings (avatar) -&gt; Extensions -&gt; DEV Community API Keys</code>. Create a key named <code className="font-mono text-xs text-(--fg4)">openpub</code> and copy it.
              </p>
              <CodeBlock
                code={`{\n  "api_key": "xxxxxxxxxxxxxxxxxxxxxxxx"\n}`}
                title="devto credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: Publishes directly via <code className="font-mono">POST /api/articles</code>. Supports up to 4 tags, canonical URL, and cover image.
              </p>

              <SubHeading id="platform-hashnode" title="Hashnode (hashnode)" />
              <p className="text-sm text-(--dim)">
                Go to <code className="font-mono text-xs text-(--fg4)">hashnode.com -&gt; Account Settings -&gt; Developer Settings -&gt; Personal Access Tokens</code>. Generate a new token.
              </p>
              <CodeBlock
                code={`{\n  "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",\n  "publication_id": "65f1a2b3c4d5e6f7a8b9c0d1" // optional\n}`}
                title="hashnode credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: If <code className="font-mono">publication_id</code> is omitted, OpenPub automatically resolves your first publication via GraphQL. Publishes via <code className="font-mono">publishPost</code> mutation at gql.hashnode.com with <code className="font-mono">publishAs: LIVE</code>. Max 5 tags; canonical URL (<code className="font-mono">originalArticleURL</code>) supported.
              </p>

              <SubHeading id="platform-wordpress" title="WordPress (wordpress)" />
              <p className="text-sm text-(--dim)">
                Works for self-hosted WordPress 5.6+ and WordPress.com. Go to <code className="font-mono text-xs text-(--fg4)">WP Admin -&gt; Users -&gt; Profile (or Edit User) -&gt; Application Passwords</code>. Name it <code className="font-mono text-xs text-(--fg4)">openpub</code> and generate. Copy the 24-character password.
              </p>
              <CodeBlock
                code={`{\n  "site_url": "https://yourblog.com",\n  "username": "your-wp-username",\n  "app_password": "xxxx xxxx xxxx xxxx xxxx xxxx"\n}`}
                title="wordpress credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: <code className="font-mono">site_url</code> must be the root (no /wp-admin). User requires <code className="font-mono">publish_posts</code> permission for live posts. If self-hosted cPanel/Apache strips Authorization headers, add <code className="font-mono">SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1</code> to your <code className="font-mono">.htaccess</code>.
              </p>

              <SubHeading id="platform-ghost" title="Ghost (ghost)" />
              <p className="text-sm text-(--dim)">
                Works on Ghost(Pro) and self-hosted Ghost 4/5/6. Go to <code className="font-mono text-xs text-(--fg4)">Ghost Admin (/ghost) -&gt; Settings -&gt; Integrations -&gt; Add custom integration</code>. Name it <code className="font-mono text-xs text-(--fg4)">openpub</code>. Copy the <strong>Admin API Key</strong> (format: <code className="font-mono text-xs text-(--fg4)">&lt;24-hex&gt;:&lt;64-hex&gt;</code>). Do not use the Content API key (read-only).
              </p>
              <CodeBlock
                code={`{\n  "site_url": "https://yourblog.ghost.io",\n  "admin_key": "64f1a2b3c4d5e6f7a8b9c0d1:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"\n}`}
                title="ghost credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: The key is split into <code className="font-mono">id:secret</code>, and OpenPub signs a 5-minute HS256 JWT per request. Publishes HTML via <code className="font-mono">POST /ghost/api/admin/posts/?source=html</code>. Max 10 tags; canonical URL and feature image supported.
              </p>

              <SubHeading id="platform-medium" title="Medium (medium)" />
              <p className="text-sm text-(--dim)">
                Go to <code className="font-mono text-xs text-(--fg4)">medium.com/me/settings -&gt; Security and apps -&gt; Integration tokens</code>. Enter a description and generate a token.
              </p>
              <CodeBlock
                code={`{\n  "integration_token": "2a1b3c4d5e6f..."\n}`}
                title="medium credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: Medium API creates posts as unlisted, draft, or public, but does not support subsequent updates. Max 5 tags; canonical URL supported and respected for SEO.
              </p>

              <SubHeading id="platform-substack" title="Substack (substack)" />
              <p className="text-sm text-(--dim)">
                Substack does not provide a public API. OpenPub authenticates via your publication session cookie <code className="font-mono text-xs text-(--fg4)">connect.sid</code> against the internal web editor endpoints.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-(--dim)">
                <li>Log in to your publication on substack.com in a desktop browser.</li>
                <li>Open DevTools (F12) -&gt; Application (or Storage in Firefox/Safari) -&gt; Cookies -&gt; https://&lt;yourpub&gt;.substack.com.</li>
                <li>Find <code className="font-mono text-xs text-(--fg4)">connect.sid</code> and copy its full value (URL-encoded string starting with <code className="font-mono text-xs">s%3A</code>).</li>
              </ol>
              <CodeBlock
                code={`{\n  "publication_url": "https://yourpub.substack.com",\n  "connect_sid": "s%3Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"\n}`}
                title="substack credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: Substack publishes land as drafts in your dashboard at <code className="font-mono">/publish/post/&lt;id&gt;</code> so you can review before sending out emails.
              </p>

              <SubHeading id="platform-github-pages" title="GitHub Pages (github-pages)" />
              <p className="text-sm text-(--dim)">
                Directly commits Markdown files with frontmatter to a GitHub repository for static site generators like Astro, Hugo, Jekyll, Next.js, or mdBook.
              </p>
              <p className="text-sm text-(--dim)">
                Create a Personal Access Token with <code className="font-mono text-xs text-(--fg4)">repo</code> scope (classic) or fine-grained token with <code className="font-mono text-xs text-(--fg4)">Contents: Read and write</code> on the blog repository.
              </p>
              <CodeBlock
                code={`{\n  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",\n  "repo": "youruser/yourblog",\n  "dir": "content/posts",\n  "branch": "main"\n}`}
                title="github-pages credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: Files are written to <code className="font-mono">&lt;dir&gt;/&lt;slug&gt;.md</code> with YAML frontmatter. Re-publishing updates the file in place with SHA-aware PUT requests.
              </p>

              <SubHeading id="platform-x" title="X Articles (x)" />
              <p className="text-sm text-(--dim)">
                Publishes long-form articles via the X Articles API (v2). Requires an X account with <strong>X Premium</strong>.
              </p>
              <p className="text-sm text-(--dim)">
                Set up a developer app at <code className="font-mono text-xs text-(--fg4)">developer.x.com</code> with OAuth 2.0 user context (<code className="font-mono text-xs text-(--fg4)">tweet.write</code> and <code className="font-mono text-xs text-(--fg4)">tweet.read</code> scopes) to obtain an access token.
              </p>
              <CodeBlock
                code={`{\n  "access_token": "xxxxxxxxxxxxxxxxxxxxxxxx"\n}`}
                title="x credentials JSON"
              />
              <p className="text-xs text-(--dim2)">
                Notes: Publishing creates a draft article via <code className="font-mono">POST /2/articles/draft</code> and publishes it via <code className="font-mono">POST /2/articles/:id/publish</code>. Markdown headings, lists, bold/italic, and quotes are converted to DraftJS content states.
              </p>
            </section>

            {/* SECTION 3: CLI REFERENCE */}
            <section className="space-y-6 pt-12">
              <SectionHeading
                id="cli"
                badge="Terminal Workflow"
                title="CLI Reference"
                subtitle="The openpub-cli tool connects to your self-hosted worker, letting you manage drafts, store platform tokens, inspect publish logs, and publish directly from your terminal."
              />

              <SubHeading id="cli-install" title="Installation & Authentication" />
              <p className="text-sm text-(--dim)">Install globally or run via npx:</p>
              <CodeBlock code="npm install -g openpub-cli" title="bash" />
              <p className="text-sm text-(--dim)">Log in to your OpenPub deployment:</p>
              <CodeBlock
                code="openpub login --url https://openpub.<subdomain>.workers.dev --key <ADMIN_KEY>"
                title="bash"
              />
              <p className="text-xs text-(--dim2)">
                If flags are omitted, the CLI interactively prompts for the URL and key, validates the connection against <code className="font-mono">/api/status</code>, and saves configuration to <code className="font-mono">~/.openpub/config.json</code>.
              </p>

              <SubHeading id="cli-matrix" title="Command Reference Matrix" />
              <div className="overflow-x-auto rounded-lg border border-(--border)/80 bg-(--surface)/60 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/40 text-(--dim) font-mono">
                      <th className="px-3.5 py-2.5">Command</th>
                      <th className="px-3.5 py-2.5">Arguments & Flags</th>
                      <th className="px-3.5 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg4) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">login</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">[--url &lt;url&gt;] [--key &lt;key&gt;]</td>
                      <td className="px-3.5 py-2.5 font-sans">Save worker URL and admin key with verification</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">status</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">-</td>
                      <td className="px-3.5 py-2.5 font-sans">Show configured and available platform adapters</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">drafts</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">-</td>
                      <td className="px-3.5 py-2.5 font-sans">List existing drafts in D1 with assigned platforms</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">rm</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;draftId&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Delete draft from database</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">setup</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;platform&gt; &lt;json-or-file&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Store credentials for a platform adapter</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">test</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;platform&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Verify stored credentials against platform API</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">draft</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt; [--to devto,...]</td>
                      <td className="px-3.5 py-2.5 font-sans">Create draft from markdown with parsed frontmatter</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">publish</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt; [--to ...] [--no-wait]</td>
                      <td className="px-3.5 py-2.5 font-sans">Create draft, dispatch queue jobs, watch live progress</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">retry</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;draftId&gt; &lt;platform&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Re-enqueue failed publish job for one platform</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">history</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">[--json]</td>
                      <td className="px-3.5 py-2.5 font-sans">Inspect publishing log and per-platform URLs</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">cover</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;prompt words...&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Generate cover image on worker via Workers AI FLUX</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">preview</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;file.md&gt; [--no-open]</td>
                      <td className="px-3.5 py-2.5 font-sans">Render local markdown to HTML preview in browser</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">docs</td>
                      <td className="px-3.5 py-2.5 text-(--dim)">&lt;dir&gt;</td>
                      <td className="px-3.5 py-2.5 font-sans">Build static HTML documentation site from folder</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading id="cli-commands" title="Command Examples" />
              <p className="text-sm text-(--dim)">Publish a post to dev.to and Hashnode:</p>
              <CodeBlock
                code="openpub publish my-article.md --to devto,hashnode"
                title="bash"
              />

              <p className="text-sm text-(--dim)">Retry a single failed platform:</p>
              <CodeBlock
                code="openpub retry clx123abc devto"
                title="bash"
              />

              <p className="text-sm text-(--dim)">Generate an AI cover image for a post:</p>
              <CodeBlock
                code="openpub cover 'minimalist dark emerald circuit diagram illustration'"
                title="bash"
              />

              <SubHeading id="cli-frontmatter" title="Markdown Frontmatter Specification" />
              <p className="text-sm text-(--dim)">
                You can specify target platforms, canonical URLs, and cover images directly in your Markdown file frontmatter:
              </p>
              <CodeBlock
                code={`---\ntitle: "Shipping Edge Workers on Cloudflare"\ncanonical: "https://myblog.com/posts/shipping-edge-workers"\ncover_image: "https://openpub.workers.dev/api/images/covers/cover-abc.png"\nplatforms:\n  - devto\n  - hashnode\n  - ghost\n  - wordpress\ntags:\n  - typescript\n  - cloudflare\n  - webdev\n---\n\n## Introduction\n\nYour article content starts here in standard Markdown...`}
                title="article.md"
              />
            </section>

            {/* SECTION 4: MCP SETUP */}
            <section className="space-y-6 pt-12">
              <SectionHeading
                id="mcp"
                badge="Agent Integration"
                title="MCP Setup"
                subtitle="OpenPub exposes an MCP server over Streamable HTTP at POST /mcp. Stateless JSON mode: answers initialize, tools/list, tools/call, ping, and ignores notifications."
              />

              <SubHeading id="mcp-overview" title="Streamable HTTP Protocol" />
              <p className="text-sm text-(--dim)">
                Authentication uses the same <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">ADMIN_KEY</code> as the REST API, passed via <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">Authorization: Bearer &lt;key&gt;</code> or <code className="rounded bg-(--surface2) px-1 py-0.5 font-mono text-xs text-(--accent) border border-(--border)">?key=&lt;ADMIN_KEY&gt;</code>.
              </p>

              <SubHeading id="mcp-tools" title="13 Available Tools" />
              <div className="overflow-x-auto rounded-lg border border-(--border)/80 bg-(--surface)/60 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/40 text-(--dim) font-mono">
                      <th className="px-3.5 py-2.5">Tool</th>
                      <th className="px-3.5 py-2.5">Purpose</th>
                      <th className="px-3.5 py-2.5">Key Arguments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg4) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Publish draft or markdown content to a single platform</td>
                      <td className="px-3.5 py-2.5 font-sans">draftId or content, platform</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">cross_publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Enqueue publish jobs across multiple platforms</td>
                      <td className="px-3.5 py-2.5 font-sans">draftId or content, platforms[]</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">save_draft</td>
                      <td className="px-3.5 py-2.5 font-sans">Create or update a draft in D1 storage</td>
                      <td className="px-3.5 py-2.5 font-sans">content, title?, platforms[], cover_image?</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">list_drafts</td>
                      <td className="px-3.5 py-2.5 font-sans">List existing drafts with creation dates and platforms</td>
                      <td className="px-3.5 py-2.5 font-sans">-</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">get_draft</td>
                      <td className="px-3.5 py-2.5 font-sans">Retrieve draft details and markdown body</td>
                      <td className="px-3.5 py-2.5 font-sans">id</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">delete_draft</td>
                      <td className="px-3.5 py-2.5 font-sans">Remove a draft from D1</td>
                      <td className="px-3.5 py-2.5 font-sans">id</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">setup</td>
                      <td className="px-3.5 py-2.5 font-sans">Store platform credentials in encrypted storage</td>
                      <td className="px-3.5 py-2.5 font-sans">platform, credentials object</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">status</td>
                      <td className="px-3.5 py-2.5 font-sans">Show configured and available platform adapters</td>
                      <td className="px-3.5 py-2.5 font-sans">-</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">test_platform</td>
                      <td className="px-3.5 py-2.5 font-sans">Execute verification ping against target platform</td>
                      <td className="px-3.5 py-2.5 font-sans">platform</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">generate_cover</td>
                      <td className="px-3.5 py-2.5 font-sans">Generate cover image via Workers AI and store in R2</td>
                      <td className="px-3.5 py-2.5 font-sans">prompt, draftId?</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">list_posts</td>
                      <td className="px-3.5 py-2.5 font-sans">Inspect publish history with per-platform live URLs</td>
                      <td className="px-3.5 py-2.5 font-sans">draftId?</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">check_links</td>
                      <td className="px-3.5 py-2.5 font-sans">HEAD-check every URL in a Markdown document</td>
                      <td className="px-3.5 py-2.5 font-sans">content</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">frontmatter</td>
                      <td className="px-3.5 py-2.5 font-sans">Format frontmatter for Astro, Hugo, Jekyll, Ghost</td>
                      <td className="px-3.5 py-2.5 font-sans">title, tags, canonical, target</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading id="mcp-claude-code" title="Claude Code Configuration" />
              <p className="text-sm text-(--dim)">Add the server using Claude Code built-in HTTP transport:</p>
              <CodeBlock
                code={`claude mcp add --transport http openpub \\\n  https://openpub.<subdomain>.workers.dev/mcp \\\n  --header "Authorization: Bearer <ADMIN_KEY>"`}
                title="terminal"
              />
              <p className="text-sm text-(--dim)">
                Or add to project-level <code className="font-mono text-xs text-(--fg4)">.mcp.json</code> or user-level <code className="font-mono text-xs text-(--fg4)">~/.claude.json</code>:
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "openpub": {\n      "type": "http",\n      "url": "https://openpub.<subdomain>.workers.dev/mcp",\n      "headers": {\n        "Authorization": "Bearer <ADMIN_KEY>"\n      }\n    }\n  }\n}`}
                title=".mcp.json"
              />

              <SubHeading id="mcp-cursor" title="Cursor Configuration" />
              <p className="text-sm text-(--dim)">
                Edit <code className="font-mono text-xs text-(--fg4)">~/.cursor/mcp.json</code> or <code className="font-mono text-xs text-(--fg4)">.cursor/mcp.json</code> in your project root:
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "openpub": {\n      "url": "https://openpub.<subdomain>.workers.dev/mcp",\n      "headers": {\n        "Authorization": "Bearer <ADMIN_KEY>"\n      }\n    }\n  }\n}`}
                title="mcp.json"
              />
              <p className="text-xs text-(--dim2)">
                Open Cursor Settings -&gt; MCP, verify the green status dot, and check tool listing. If headers are not forwarded, pass the key as query parameter: <code className="font-mono text-xs">"url": "https://openpub.&lt;subdomain&gt;.workers.dev/mcp?key=&lt;ADMIN_KEY&gt;"</code>.
              </p>

              <SubHeading id="mcp-windsurf" title="Windsurf Configuration" />
              <p className="text-sm text-(--dim)">
                Add to <code className="font-mono text-xs text-(--fg4)">~/.codeium/windsurf/mcp_config.json</code>:
              </p>
              <CodeBlock
                code={`{\n  "mcpServers": {\n    "openpub": {\n      "serverUrl": "https://openpub.<subdomain>.workers.dev/mcp",\n      "headers": {\n        "Authorization": "Bearer <ADMIN_KEY>"\n      }\n    }\n  }\n}`}
                title="mcp_config.json"
              />

              <SubHeading id="mcp-curl" title="Generic HTTP / curl Verification" />
              <CodeBlock
                code={`BASE=https://openpub.<subdomain>.workers.dev\nKEY=<ADMIN_KEY>\n\n# 1. Initialize\ncurl -X POST $BASE/mcp -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{\n  "jsonrpc": "2.0", "id": 1, "method": "initialize",\n  "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "curl-client", "version": "1.0"}}\n}'\n\n# 2. List tools\ncurl -X POST $BASE/mcp -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{\n  "jsonrpc": "2.0", "id": 2, "method": "tools/list"\n}'\n\n# 3. Call tool (status)\ncurl -X POST $BASE/mcp -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{\n  "jsonrpc": "2.0", "id": 3, "method": "tools/call",\n  "params": {"name": "status", "arguments": {}}\n}'`}
                title="bash"
              />

              <SubHeading id="mcp-first-session" title="Typical First Session" />
              <p className="text-sm text-(--dim)">
                Once connected, your AI coding agent can manage publishing seamlessly:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-(--dim)">
                <li><code className="font-mono text-(--accent)">setup</code>: Store credentials for each platform.</li>
                <li><code className="font-mono text-(--accent)">test_platform</code>: Ensure platform APIs return <code className="font-mono">&#123;ok: true&#125;</code>.</li>
                <li><code className="font-mono text-(--accent)">save_draft</code>: Upload Markdown content and specify target platforms.</li>
                <li><code className="font-mono text-(--accent)">cross_publish</code>: Dispatch queue jobs using the generated draft ID.</li>
                <li><code className="font-mono text-(--accent)">list_posts</code>: Inspect live platform URLs and check for failures.</li>
              </ol>

              <SubHeading id="mcp-troubleshooting" title="Troubleshooting Guide" />
              <div className="overflow-x-auto rounded-lg border border-(--border)/80 bg-(--surface)/60 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/40 text-(--dim) font-mono">
                      <th className="px-3.5 py-2.5">Symptom</th>
                      <th className="px-3.5 py-2.5">Likely Cause</th>
                      <th className="px-3.5 py-2.5">Remedy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg4)">
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--danger)">401 unauthorized</td>
                      <td className="px-3.5 py-2.5">Incorrect or missing ADMIN_KEY</td>
                      <td className="px-3.5 py-2.5">Verify Bearer header or test with curl using the exact secret value</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--danger)">Tools not listed</td>
                      <td className="px-3.5 py-2.5">Client failed to send tools/list</td>
                      <td className="px-3.5 py-2.5">Inspect client MCP logs; reload window in Cursor or Claude Code</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-(--danger)">fetch failed / ECONNRESET</td>
                      <td className="px-3.5 py-2.5">Incorrect worker URL or client forced SSE</td>
                      <td className="px-3.5 py-2.5">OpenPub uses POST-only JSON; check URL format</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-yellow-400">test_platform ok: false</td>
                      <td className="px-3.5 py-2.5">Credentials rejected by platform API</td>
                      <td className="px-3.5 py-2.5">Check token expiry, permissions, or platform-specific gotchas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 5: ARCHITECTURE */}
            <section className="space-y-6 pt-12">
              <SectionHeading
                id="architecture"
                badge="System Design"
                title="Architecture"
                subtitle="OpenPub relies entirely on Cloudflare edge primitives. No servers, no containers, no external databases."
              />

              <SubHeading id="arch-diagram" title="System Diagram" />
              <div className="my-4 overflow-x-auto rounded-lg border border-(--border)/80 bg-(--surface)/90 p-5 font-mono text-xs leading-relaxed text-(--fg4)">
                <pre>{`                          +---------------------------------------------+
  openpub-cli ---------->|                                             |
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
        KV: KEYS      R2: MEDIA (cover images)      Workers AI: FLUX schnell`}</pre>
              </div>

              <SubHeading id="arch-components" title="Core Components" />
              <div className="grid gap-4 sm:grid-cols-2 my-4">
                <div className="rounded-lg border border-(--border)/80 bg-(--surface)/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" />
                    <h4 className="font-mono text-sm font-semibold text-(--fg2)">
                      Cloudflare Worker (Hono)
                    </h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                    High-performance edge handler serving both standard REST API endpoints and streamable JSON-RPC 2.0 MCP protocol on the same worker.
                  </p>
                </div>

                <div className="rounded-lg border border-(--border)/80 bg-(--surface)/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" />
                    <h4 className="font-mono text-sm font-semibold text-(--fg2)">
                      Cloudflare D1 Database
                    </h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                    Serverless relational SQLite database storing draft contents, platform credentials, and immutable publish log records.
                  </p>
                </div>

                <div className="rounded-lg border border-(--border)/80 bg-(--surface)/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" />
                    <h4 className="font-mono text-sm font-semibold text-(--fg2)">
                      Cloudflare Queues
                    </h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                    Isolates individual platform publish tasks with automatic 3x retries. A flaky third-party API never halts remaining publishers.
                  </p>
                </div>

                <div className="rounded-lg border border-(--border)/80 bg-(--surface)/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-(--accent)" />
                    <h4 className="font-mono text-sm font-semibold text-(--fg2)">
                      R2 Media Bucket & Workers AI
                    </h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-(--dim)">
                    Workers AI generates cover images using FLUX.1 schnell, stored in R2 and served directly by the worker with zero egress fees.
                  </p>
                </div>
              </div>

              <SubHeading id="arch-lifecycle" title="Publish Lifecycle" />
              <p className="text-sm leading-relaxed text-(--dim)">
                The publish sequence is designed to be resilient and idempotent:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-(--dim)">
                <li>
                  <strong className="text-(--fg3)">Dispatch:</strong> <code className="font-mono text-xs">POST /api/publish</code> or <code className="font-mono text-xs">cross_publish</code> receives a draft ID and enqueues one queue message per target platform.
                </li>
                <li>
                  <strong className="text-(--fg3)">Consumer Execution:</strong> The queue consumer pulls messages in batches, pulls credentials from D1, and invokes the platform adapter.
                </li>
                <li>
                  <strong className="text-(--fg3)">Canonical Injection:</strong> The first platform that publishes successfully records its live post URL. This URL is stamped onto the draft as its canonical URL.
                </li>
                <li>
                  <strong className="text-(--fg3)">SEO Preservation:</strong> All subsequent platform publishes link back to that canonical URL, ensuring search equity is preserved on your primary publication.
                </li>
              </ol>

              <SubHeading id="arch-idempotency" title="Idempotency & Safe Retries" />
              <p className="text-sm leading-relaxed text-(--dim)">
                Re-publishing an existing draft checks the publish log first. Any platform that already succeeded is skipped; only failed or pending platforms are executed. You can safely retry without fear of duplicate posts.
              </p>

              <SubHeading id="arch-api-matrix" title="REST API Reference" />
              <div className="overflow-x-auto rounded-lg border border-(--border)/80 bg-(--surface)/60 my-4">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface2)/40 text-(--dim) font-mono">
                      <th className="px-3.5 py-2.5">Method</th>
                      <th className="px-3.5 py-2.5">Endpoint</th>
                      <th className="px-3.5 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)/60 text-(--fg4) font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/health</td>
                      <td className="px-3.5 py-2.5 font-sans">Unauthenticated liveness check</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/status</td>
                      <td className="px-3.5 py-2.5 font-sans">Configured and available platform list</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/platforms/:name</td>
                      <td className="px-3.5 py-2.5 font-sans">Store platform credentials JSON</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/platforms/:name/test</td>
                      <td className="px-3.5 py-2.5 font-sans">Verify platform credentials against upstream API</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/drafts</td>
                      <td className="px-3.5 py-2.5 font-sans">List stored drafts</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/drafts</td>
                      <td className="px-3.5 py-2.5 font-sans">Create a draft &#123;title, content, platforms, cover_image&#125;</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/drafts/:id</td>
                      <td className="px-3.5 py-2.5 font-sans">Fetch draft content by ID</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--danger)">DELETE</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/drafts/:id</td>
                      <td className="px-3.5 py-2.5 font-sans">Delete a draft from D1</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/publish</td>
                      <td className="px-3.5 py-2.5 font-sans">Dispatch publish jobs to queue for assigned platforms</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/history</td>
                      <td className="px-3.5 py-2.5 font-sans">Fetch publish log with URLs and error diagnostics</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/history/:draftId/:platform/retry</td>
                      <td className="px-3.5 py-2.5 font-sans">Re-enqueue failed job for specific platform</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/images/generate</td>
                      <td className="px-3.5 py-2.5 font-sans">Generate cover image from prompt via Workers AI</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-blue-400">GET</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/api/images/covers/:key</td>
                      <td className="px-3.5 py-2.5 font-sans">Serve cover image from R2 bucket</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 text-(--accent)">POST</td>
                      <td className="px-3.5 py-2.5 text-(--fg3)">/mcp</td>
                      <td className="px-3.5 py-2.5 font-sans">Streamable HTTP MCP JSON-RPC 2.0 endpoint</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-20 border-t border-(--surface2) pt-8 pb-12">
              <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-(--dim2)">
                <span>openpub · MIT License</span>
                <div className="flex items-center gap-6">
                  <a href="/" className="hover:text-(--fg3) transition-colors">
                    Landing
                  </a>
                  <a href="/app" className="hover:text-(--fg3) transition-colors">
                    Dashboard App
                  </a>
                  <a
                    href={GITHUB}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-(--fg3) transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
