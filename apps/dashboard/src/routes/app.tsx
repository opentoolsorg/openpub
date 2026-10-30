import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import { resolvePostMetadata } from "@openpub/core/post"
import { Logo, Mark } from "~/components/Logo"

export const Route = createFileRoute("/app")({
  component: App,
})

const DEFAULT_BASE = "https://openpub.princslabs.workers.dev"

const PLATFORMS = [
  "devto",
  "hashnode",
  "wordpress",
  "ghost",
  "medium",
  "substack",
  "github-pages",
  "x",
] as const

type PlatformKey = (typeof PLATFORMS)[number]

const CRED_KEYS: Record<PlatformKey, string[]> = {
  devto: ["api_key"],
  hashnode: ["token", "publication_id"],
  wordpress: ["site_url", "username", "app_password"],
  ghost: ["site_url", "admin_key"],
  medium: ["integration_token"],
  substack: ["connect_sid", "publication_url"],
  "github-pages": ["token", "repo", "dir", "branch"],
  x: ["access_token"],
}

interface PlatformMeta {
  name: string
  cap: string
  note: string
  where: string
  fieldLabels: Record<string, string>
  fieldTypes: Record<string, string>
  fieldPlaceholders: Record<string, string>
}

const PLATFORM_DETAILS: Record<PlatformKey, PlatformMeta> = {
  devto: {
    name: "DEV",
    cap: "Publishes live posts to your DEV.to profile",
    note: "Publishes live",
    where: "dev.to/settings/extensions -> Generate API key",
    fieldLabels: { api_key: "API Key" },
    fieldTypes: { api_key: "password" },
    fieldPlaceholders: { api_key: "dev_api_..." },
  },
  hashnode: {
    name: "Hashnode",
    cap: "Publishes live to your Hashnode publication",
    note: "Publishes live to your publication",
    where: "hashnode.com/settings/developer -> Personal Access Token, and publication settings for ID",
    fieldLabels: { token: "Access Token", publication_id: "Publication ID" },
    fieldTypes: { token: "password", publication_id: "text" },
    fieldPlaceholders: { token: "hn_pat_...", publication_id: "64a..." },
  },
  wordpress: {
    name: "WordPress",
    cap: "Publishes live posts via WordPress REST API",
    note: "Publishes live",
    where: "Users -> Profile -> Application Passwords",
    fieldLabels: { site_url: "Site URL", username: "Username", app_password: "Application Password" },
    fieldTypes: { site_url: "url", username: "text", app_password: "password" },
    fieldPlaceholders: { site_url: "https://yourblog.com", username: "admin", app_password: "abcd efgh ijkl mnop" },
  },
  ghost: {
    name: "Ghost",
    cap: "Publishes live posts via Ghost Admin API",
    note: "Publishes live",
    where: "Settings -> Integrations -> Add custom integration -> Admin API Key",
    fieldLabels: { site_url: "Site URL", admin_key: "Admin API Key" },
    fieldTypes: { site_url: "url", admin_key: "password" },
    fieldPlaceholders: { site_url: "https://yourblog.ghost.io", admin_key: "64a...:8f2..." },
  },
  medium: {
    name: "Medium",
    cap: "Publishes live posts (Medium API is deprecated)",
    note: "Publishes live · API deprecated",
    where: "Settings -> Security and apps -> Integration tokens",
    fieldLabels: { integration_token: "Integration Token" },
    fieldTypes: { integration_token: "password" },
    fieldPlaceholders: { integration_token: "2a3b..." },
  },
  substack: {
    name: "Substack",
    cap: "Creates drafts in your Substack publication",
    note: "Creates drafts only",
    where: "Browser cookies (connect.sid) after logging in on substack.com",
    fieldLabels: { connect_sid: "Connect SID cookie", publication_url: "Publication URL" },
    fieldTypes: { connect_sid: "password", publication_url: "url" },
    fieldPlaceholders: { connect_sid: "s%3A...", publication_url: "https://yourname.substack.com" },
  },
  "github-pages": {
    name: "Your Pages",
    cap: "Commits markdown post file to your GitHub repository",
    note: "Commits the file to your repo",
    where: "github.com/settings/tokens (classic with repo scope)",
    fieldLabels: { token: "Personal Access Token", repo: "Repository (owner/repo)", dir: "Posts Directory", branch: "Branch" },
    fieldTypes: { token: "password", repo: "text", dir: "text", branch: "text" },
    fieldPlaceholders: { token: "ghp_...", repo: "username/blog", dir: "_posts", branch: "main" },
  },
  x: {
    name: "X (Twitter)",
    cap: "Posts thread to your X profile",
    note: "Needs X Premium / Developer Portal access",
    where: "developer.x.com -> User OAuth 2.0 Access Token",
    fieldLabels: { access_token: "OAuth 2.0 Access Token" },
    fieldTypes: { access_token: "password" },
    fieldPlaceholders: { access_token: "AAAA..." },
  },
}

const PLATFORM_PUBLISH_SUMMARY: Record<PlatformKey, { title: string; desc: string }> = {
  devto: { title: "Goes live.", desc: "Public on your DEV profile." },
  hashnode: { title: "Goes live in your publication.", desc: "A live Hashnode post can't be turned back into a draft." },
  ghost: { title: "Goes live.", desc: "Published on your Ghost site." },
  medium: { title: "Goes live, if the token still works.", desc: "Medium's API is deprecated, and a Medium post can't be edited later." },
  wordpress: { title: "Goes live.", desc: "Published on your WordPress site." },
  substack: { title: "Creates a draft.", desc: "Substack creates a draft in your publication." },
  "github-pages": { title: "Commits post file to your GitHub repository.", desc: "Pushed to your repo." },
  x: { title: "Publishes thread to X.", desc: "Requires X Premium / Developer Portal." },
}

type Draft = {
  id: string
  title: string | null
  content: string
  platforms: string[]
  status: string
  canonical_url: string | null
  cover_image?: string | null
  created_at: number
}

type HistoryRow = {
  draft_id: string
  platform: string
  status: string
  url: string | null
  error: string | null
  attempts?: number
  created_at: number
}

type Api = (p: string, m?: string, b?: unknown) => Promise<Record<string, unknown>>

type Tab = "drafts" | "editor" | "log" | "platforms" | "settings"

function useApi() {
  const [base] = React.useState(
    () => (typeof window !== "undefined"
      ? (import.meta.env.DEV ? "http://localhost:8788" : window.location.origin)
      : DEFAULT_BASE),
  )
  const [authenticated, setAuthenticated] = React.useState(false)
  const [passwordConfigured, setPasswordConfigured] = React.useState(false)
  const [authLoading, setAuthLoading] = React.useState(true)
  const [authError, setAuthError] = React.useState("")

  const checkAuth = React.useCallback(() => {
    setAuthLoading(true)
    setAuthError("")
    return fetch(base + "/api/auth/status", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Login service returned ${res.status}. Try again shortly.`)
        return res.json() as Promise<{ authenticated?: boolean; passwordConfigured?: boolean }>
      })
      .then((data) => {
        setAuthenticated(Boolean(data.authenticated))
        setPasswordConfigured(Boolean(data.passwordConfigured))
      })
      .catch((error) => setAuthError((error as Error).message || "Could not reach the login service. Check your connection and try again."))
      .finally(() => setAuthLoading(false))
  }, [base])

  React.useEffect(() => {
    try { localStorage.removeItem("op-key") } catch {}
    checkAuth()
  }, [checkAuth])

  const api = React.useCallback<Api>(
    async (path, method = "GET", body) => {
      const res = await fetch(base + "/api" + path, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.status === 401) setAuthenticated(false)
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (!res.ok) throw new Error((data.error as string) || res.statusText || "Request failed")
      return data
    },
    [base],
  )

  return { base, api, authenticated, setAuthenticated, authLoading, authError, checkAuth, passwordConfigured }
}

function useToast() {
  const [msg, setMsg] = React.useState("")
  const timerRef = React.useRef<number | null>(null)
  const toast = React.useCallback((m: string) => {
    setMsg(m)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setMsg(""), 3500)
  }, [])
  return { msg, toast }
}

function getSystemTheme(): "dark" | "light" {
  if (typeof document !== "undefined") {
    if (document.documentElement.classList.contains("light")) return "light"
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light"
    }
  }
  return "dark"
}

function extractTitle(md: string): string | undefined {
  return resolvePostMetadata(md).title
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
  }
}

export function App() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-(--bg) text-(--fg3) font-sans antialiased">
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
          <div className="h-8 w-40 bg-(--surface2) rounded-lg" />
          <div className="h-48 bg-(--surface) border border-(--border) rounded-2xl" />
        </div>
      </div>
    )
  }

  return <MainApp />
}

function MainApp() {
  const { base, api, authenticated, setAuthenticated, authLoading, authError, checkAuth, passwordConfigured } = useApi()
  const [theme, setTheme] = React.useState<"dark" | "light">(getSystemTheme)

  const toggleTheme = React.useCallback(
    (target?: "dark" | "light") => {
      const next = target || (theme === "dark" ? "light" : "dark")
      setTheme(next)
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("light", next === "light")
        try {
          localStorage.setItem("op-theme", next)
        } catch {}
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute("content", next === "light" ? "#fafaf9" : "#0a0c0b")
      }
    },
    [theme],
  )

  if (authLoading) {
    return <div className="min-h-screen bg-(--bg)" role="status" aria-label="Checking login" />
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-(--bg) text-(--fg) p-6 flex items-center justify-center">
        <div role="alert" className="max-w-md rounded-2xl border border-(--danger)/35 bg-(--surface) p-8 space-y-3">
          <h1 className="font-semibold">Could not check your session</h1>
          <p className="text-sm text-(--dim)">{authError} Your login status is unknown.</p>
          <button type="button" onClick={() => { checkAuth() }} className="text-sm font-semibold text-(--accent)">Try again</button>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <OnboardingView
        base={base}
        passwordConfigured={passwordConfigured}
        onAuthenticated={() => { checkAuth() }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    )
  }

  return <ConsoleApp base={base} api={api} setAuthenticated={setAuthenticated} theme={theme} toggleTheme={toggleTheme} />
}

function ConsoleApp({ base, api, setAuthenticated, theme, toggleTheme }: {
  base: string
  api: Api
  setAuthenticated: (value: boolean) => void
  theme: "dark" | "light"
  toggleTheme: (target?: "dark" | "light") => void
}) {
  const { msg, toast } = useToast()
  const [tab, setTab] = React.useState<Tab>("drafts")

  // Editor shared state
  const [editorDraftId, setEditorDraftId] = React.useState<string | null>(null)
  const [editorMd, setEditorMd] = React.useState("")
  const [editorSel, setEditorSel] = React.useState<Set<string>>(new Set())
  const [editorCover, setEditorCover] = React.useState("")

  // Publish review modal state
  const [publishTarget, setPublishTarget] = React.useState<{
    draftId?: string
    title?: string
    content: string
    platforms: string[]
    cover_image?: string
  } | null>(null)

  // Status for badge counts
  const [configuredPlatforms, setConfiguredPlatforms] = React.useState<string[]>([])
  const [recentFailure, setRecentFailure] = React.useState<string | null>(null)

  // Load configured platforms for cross-tab awareness
  const refreshStatus = React.useCallback(async () => {
    try {
      const d = (await api("/status")) as unknown as { platforms: { platform: string }[] }
      const configured = (d.platforms || []).map((p) => p.platform)
      setConfiguredPlatforms(configured)
      setEditorSel((prev) => {
        const valid = new Set([...prev].filter((p) => configured.includes(p)))
        if (valid.size === 0 && configured.length > 0) return new Set([configured[0]])
        return valid
      })
    } catch {}
  }, [api])

  // Check recent failures for the attention banner
  const checkFailures = React.useCallback(async () => {
    try {
      const h = (await api("/history")) as unknown as { history: HistoryRow[] }
      const rows = h.history || []
      const failed = rows.find((r) => r.status === "failed" || r.status === "fail" || r.status === "error")
      if (failed) {
        setRecentFailure(`${failed.platform} had an error in draft ${failed.draft_id.slice(0, 8)}`)
      } else {
        setRecentFailure(null)
      }
    } catch {}
  }, [api])

  React.useEffect(() => {
    refreshStatus()
    checkFailures()
  }, [refreshStatus, checkFailures])

  const openInEditor = (id: string, content: string, platforms: string[], cover?: string | null) => {
    setEditorDraftId(id)
    setEditorMd(content)
    const valid = platforms.filter((p) => configuredPlatforms.includes(p))
    setEditorSel(new Set(valid.length ? valid : (configuredPlatforms.length ? [configuredPlatforms[0]] : [])))
    setEditorCover(cover || "")
    setTab("editor")
  }

  const startNewDraft = () => {
    setEditorDraftId(null)
    setEditorMd("# Shipping with OpenPub\n\nWrite in Markdown, pick platforms, and publish everywhere.\n")
    setEditorSel(new Set(configuredPlatforms.length ? [configuredPlatforms[0]] : []))
    setEditorCover("")
    setTab("editor")
  }

  return (
    <div className="op-console min-h-screen bg-(--bg) text-(--fg3) font-sans antialiased flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-(--border) bg-(--surface) p-4 sm:p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <a href="/" className="inline-flex items-center gap-2.5 text-(--fg) hover:opacity-90 transition-opacity">
              <Logo />
            </a>
            <span className="md:hidden text-[11px] font-mono px-2 py-0.5 rounded border border-(--border) text-(--dim)">
              console
            </span>
          </div>

          <button
            type="button"
            onClick={startNewDraft}
            className="w-full flex items-center justify-center gap-2 min-h-10 px-4 rounded-xl bg-(--accent-strong) hover:bg-(--accent) text-(--on-accent) font-semibold text-sm transition-colors cursor-pointer shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New draft
          </button>

          <nav aria-label="Console navigation" className="space-y-1">
            <NavItem
              active={tab === "drafts"}
              onClick={() => setTab("drafts")}
              label="Drafts"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5" />
                </svg>
              }
            />
            <NavItem
              active={tab === "log"}
              onClick={() => setTab("log")}
              label="Publish log"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              }
            />
            <NavItem
              active={tab === "platforms"}
              onClick={() => setTab("platforms")}
              label="Platforms"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="6" cy="12" r="2" />
                  <path d="M8 12h12M8 11l10-6M8 13l10 6" />
                </svg>
              }
            />
            <NavItem
              active={tab === "settings"}
              onClick={() => setTab("settings")}
              label="Settings"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
                </svg>
              }
            />
          </nav>
        </div>

        <div className="pt-6 mt-6 border-t border-(--border)/80 space-y-4">
          <button
            type="button"
            onClick={() => toggleTheme()}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            className="w-full flex items-center justify-between min-h-10 px-3 rounded-xl border border-(--border) hover:border-(--surface4) bg-transparent text-(--fg3) text-xs font-medium transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
              </svg>
              {theme === "light" ? "Dark theme" : "Light theme"}
            </span>
            <span className="text-[10px] text-(--dim) uppercase font-mono">{theme}</span>
          </button>

          <div className="p-3 rounded-xl border border-dashed border-(--border) bg-(--surface2)/40 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-(--dim)">
              <span>Self-hosted instance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
            </div>
            <code className="block text-xs font-mono text-(--fg2) truncate" title={base}>
              {getDomainFromUrl(base)}
            </code>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 max-w-5xl">
        {tab === "drafts" && (
          <DraftsView
            api={api}
            toast={toast}
            onOpenInEditor={openInEditor}
            onStartNewDraft={startNewDraft}
            onPublishDraft={(d) => {
              const active = (d.platforms || []).filter((p) => configuredPlatforms.includes(p))
              if (active.length === 0) {
                toast("No connected platforms in draft. Connect them in Platforms tab.")
                return
              }
              setPublishTarget({
                draftId: d.id,
                title: d.title || undefined,
                content: d.content,
                platforms: active,
                cover_image: d.cover_image || undefined,
              })
            }}
            onGoToLog={() => setTab("log")}
            onGoToPlatforms={() => setTab("platforms")}
            recentFailure={recentFailure}
          />
        )}

        {tab === "editor" && (
          <EditorView
            api={api}
            toast={toast}
            editorDraftId={editorDraftId}
            setEditorDraftId={setEditorDraftId}
            md={editorMd}
            setMd={setEditorMd}
            sel={editorSel}
            setSel={setEditorSel}
            cover={editorCover}
            setCover={setEditorCover}
            configuredPlatforms={configuredPlatforms}
            onGoToPlatforms={() => setTab("platforms")}
            onReviewAndPublish={(content, platforms) =>
              setPublishTarget({
                draftId: editorDraftId || undefined,
                title: extractTitle(content),
                content,
                platforms: [...platforms].filter((p) => configuredPlatforms.includes(p)),
                cover_image: editorCover.trim() || undefined,
              })
            }
            onSavedDraft={() => {
              toast("Draft saved successfully")
              setTab("drafts")
            }}
            onBack={() => setTab("drafts")}
          />
        )}

        {tab === "log" && (
          <LogView
            api={api}
            toast={toast}
            onGoToDrafts={() => setTab("drafts")}
            onRetry={async (draftId, platform) => {
              await api(`/history/${draftId}/${platform}/retry`, "POST")
              await checkFailures()
            }}
          />
        )}

        {tab === "platforms" && (
          <PlatformsView
            api={api}
            toast={toast}
            configured={configuredPlatforms}
            onRefresh={refreshStatus}
          />
        )}

        {tab === "settings" && (
          <SettingsView
            base={base}
            onSignOut={() => {
              fetch(base + "/api/auth/logout", { method: "POST", credentials: "include" })
                .then((res) => {
                  if (!res.ok) throw new Error(`Server returned ${res.status}`)
                  setAuthenticated(false)
                })
                .catch((error) => toast(`Sign out failed: ${(error as Error).message}. Try again.`))
            }}
            theme={theme}
            toggleTheme={toggleTheme}
            toast={toast}
          />
        )}

        {/* Publish Review Modal */}
        {publishTarget && (
          <PublishModal
            api={api}
            target={publishTarget}
            onClose={() => {
              setPublishTarget(null)
              checkFailures()
            }}
            onDone={() => {
              setPublishTarget(null)
              checkFailures()
              setTab("log")
            }}
            onSaveDraftId={(id) => {
              setEditorDraftId(id)
            }}
            toast={toast}
          />
        )}

        {/* Floating Toast Notification */}
        {msg && (
          <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-(--surface) border border-(--border) text-(--fg) text-xs font-mono shadow-2xl animate-fade-in max-w-sm">
            <span className="w-2 h-2 rounded-full bg-(--accent) shrink-0 animate-pulse" />
            <span className="truncate">{msg}</span>
          </div>
        )}
      </main>
    </div>
  )
}

function NavItem({
  active,
  onClick,
  label,
  icon,
  badge,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
  badge?: "alert"
  count?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`w-full flex items-center justify-between min-h-10 px-3.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
        active
          ? "bg-(--surface2) text-(--fg) border border-(--border)"
          : "text-(--dim) hover:text-(--fg) hover:bg-(--surface2)/50 border border-transparent"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={active ? "text-(--accent)" : "text-(--dim2)"}>{icon}</span>
        {label}
      </span>
      {badge === "alert" && <span className="w-2 h-2 rounded-full bg-(--danger)" />}
      {count && <span className="text-xs font-mono text-(--dim2)">{count}</span>}
    </button>
  )
}

function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === "published" || s === "ok" || s === "live" || s === "configured" || s === "test ok" || s === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-(--accent-strong)/30 bg-(--accent-strong)/10 text-(--accent)">
        <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
        {status}
      </span>
    )
  }
  if (s === "failed" || s === "fail" || s === "error" || s === "test failed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-500/30 bg-red-500/10 text-(--danger)">
        <span className="w-1.5 h-1.5 rounded-full bg-(--danger)" />
        {status}
      </span>
    )
  }
  if (s === "partial" || s === "retry" || s === "retrying" || s === "testing" || s === "retryable") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-500">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        {status}
      </span>
    )
  }
  if (s === "publishing" || s === "queued") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-(--border) bg-(--surface2) text-(--fg3)">
        <span className="w-1.5 h-1.5 rounded-full bg-(--fg3) animate-pulse" />
        {status}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-(--border) bg-(--surface2) text-(--dim)">
      <span className="w-1.5 h-1.5 rounded-full bg-(--dim2)" />
      {status}
    </span>
  )
}

// -------------------------------------------------------------
// DRAFTS VIEW (AppDrafts.dc.html)
// -------------------------------------------------------------
function DraftsView({
  api,
  toast,
  onOpenInEditor,
  onStartNewDraft,
  onPublishDraft,
  onGoToLog,
  onGoToPlatforms,
  recentFailure,
}: {
  api: Api
  toast: (m: string) => void
  onOpenInEditor: (id: string, content: string, platforms: string[], cover?: string | null) => void
  onStartNewDraft: () => void
  onPublishDraft: (d: Draft) => void
  onGoToLog: () => void
  onGoToPlatforms?: () => void
  recentFailure: string | null
}) {
  const [drafts, setDrafts] = React.useState<Draft[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<"all" | "published" | "drafts" | "attention">("all")
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const loadDrafts = React.useCallback(async () => {
    setLoadError(null)
    try {
      const d = (await api("/drafts")) as unknown as { drafts: Draft[] }
      setDrafts(d.drafts || [])
    } catch (e) {
      setLoadError((e as Error).message)
      toast("Failed to load drafts: " + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  React.useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  const deleteDraft = async (id: string) => {
    setDeleting(true)
    try {
      await api("/drafts/" + id, "DELETE")
      toast("Draft deleted")
      setConfirmDeleteId(null)
      loadDrafts()
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  const publishedCount = drafts.filter((d) => d.status === "published").length
  const regularDraftsCount = drafts.filter((d) => d.status !== "published").length
  const attentionCount = drafts.filter((d) => d.status === "failed" || d.status === "partial").length

  const filteredDrafts = drafts.filter((d) => {
    if (filter === "published") return d.status === "published"
    if (filter === "drafts") return d.status !== "published"
    if (filter === "attention") return d.status === "failed" || d.status === "partial"
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">Drafts</h1>
          <p className="text-sm text-(--dim) mt-1">
            Everything saved on this instance, newest first. The list shows the latest 100.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartNewDraft}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-(--accent-strong) hover:bg-(--accent) text-(--on-accent) font-semibold text-sm transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Write post
        </button>
      </div>

      {recentFailure && (
        <button
          type="button"
          onClick={onGoToLog}
          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/35 bg-amber-500/8 text-(--fg2) text-sm cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0" aria-hidden="true">
              <path d="M12 3l9.5 17h-19z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
            <span>
              <strong className="font-semibold text-(--fg)">Attention needed.</strong> {recentFailure}
            </span>
          </div>
          <span className="font-semibold text-xs text-amber-500 underline underline-offset-2">Open the log</span>
        </button>
      )}

      {/* Filter pills */}
      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={drafts.length}
        />
        <FilterPill
          active={filter === "published"}
          onClick={() => setFilter("published")}
          label="Published"
          count={publishedCount}
        />
        <FilterPill
          active={filter === "drafts"}
          onClick={() => setFilter("drafts")}
          label="Drafts"
          count={regularDraftsCount}
        />
        {attentionCount > 0 && (
          <FilterPill
            active={filter === "attention"}
            onClick={() => setFilter("attention")}
            label="Needs attention"
            count={attentionCount}
            variant="warn"
          />
        )}
      </div>

      {/* Draft list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-(--border) bg-(--surface) animate-pulse space-y-3">
              <div className="h-5 w-1/3 bg-(--surface2) rounded" />
              <div className="h-4 w-1/4 bg-(--surface2)/60 rounded" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-(--danger)/35 bg-(--surface) p-8 space-y-3">
          <h2 className="font-semibold text-(--fg)">Could not load drafts</h2>
          <p className="text-sm text-(--dim)">{loadError} Check your connection and try again. If your session expired, sign in again with your instance password.</p>
          <button type="button" onClick={() => { setLoading(true); loadDrafts() }} className="text-sm font-semibold text-(--accent)">Try again</button>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="flex flex-col items-start gap-4 p-12 sm:p-14 rounded-2xl border border-dashed border-(--border) bg-(--surface) text-left">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-(--accent)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6M9 17h4" />
          </svg>
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">
              {filter === "all" ? "No drafts on this instance yet" : "No drafts match this filter"}
            </h2>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-(--dim)">
              {filter === "all"
                ? "Write in Markdown, pick where it goes, and save. Nothing is sent to a platform until you press Publish."
                : "Try selecting a different filter pill above to view drafts."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={onStartNewDraft}
              className="inline-flex items-center min-h-11 px-5 rounded-xl bg-(--accent-strong) text-(--on-accent) font-semibold text-sm cursor-pointer hover:bg-(--accent) transition-colors"
            >
              Write your first draft
            </button>
            {onGoToPlatforms && (
              <button
                type="button"
                onClick={onGoToPlatforms}
                className="inline-flex items-center min-h-11 px-5 rounded-xl border border-(--border) bg-transparent text-(--fg) font-medium text-sm cursor-pointer hover:border-(--surface4) transition-colors"
              >
                Connect a platform first
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
          {filteredDrafts.map((d) => (
            <article
              key={d.id}
              className="p-5 rounded-2xl border border-(--border) bg-(--surface) hover:border-(--surface4) transition-colors space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="text-base font-semibold text-(--fg) break-words">
                    {d.title || "Untitled draft"}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-(--dim)">
                    <span>Saved {new Date(d.created_at * 1000).toLocaleDateString()}</span>
                    <span>·</span>
                    <code>{d.id.slice(0, 8)}</code>
                  </div>
                </div>
                <StatusChip status={d.status || "draft"} />
              </div>

              {/* Destinations */}
              {d.platforms && d.platforms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {d.platforms.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-(--border) bg-(--surface2) font-mono text-xs text-(--fg3)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions row */}
              <div className="pt-3 border-t border-(--border) flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenInEditor(d.id, d.content, d.platforms, d.cover_image)}
                    className="px-3 py-1.5 rounded-lg border border-(--border) hover:border-(--surface4) bg-transparent text-(--fg2) text-xs font-medium cursor-pointer transition-colors"
                  >
                    Open in editor
                  </button>
                  <button
                    type="button"
                    onClick={() => onPublishDraft(d)}
                    className="px-3 py-1.5 rounded-lg border border-(--accent-strong)/40 bg-(--accent-strong)/10 hover:bg-(--accent-strong)/20 text-(--accent) text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Publish…
                  </button>
                  <button
                    type="button"
                    onClick={onGoToLog}
                    className="px-3 py-1.5 rounded-lg border border-(--border) hover:border-(--surface4) bg-transparent text-(--dim) hover:text-(--fg2) text-xs font-medium cursor-pointer transition-colors"
                  >
                    View log
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(d.id)}
                  className="px-2.5 py-1.5 text-xs text-(--dim2) hover:text-(--danger) cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>

              {/* Inline delete confirmation */}
              {confirmDeleteId === d.id && (
                <div
                  role="alertdialog"
                  aria-label="Confirm delete"
                  className="p-3.5 rounded-xl border border-red-500/35 bg-red-500/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <span className="text-(--fg2)">
                    Delete this draft <strong className="font-semibold">and its publish log</strong> from the instance? Posts already live on platforms stay up.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-lg border border-(--border) bg-transparent text-(--fg) font-medium cursor-pointer"
                    >
                      Keep it
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => deleteDraft(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-(--danger) text-white font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Delete draft"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
          </div>
          <p className="text-xs text-(--dim)">
            Drafts published from the CLI or GitHub Action live in their own local ledger and don't appear here.
          </p>
        </div>
      )}
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  variant,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  variant?: "warn"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
        active
          ? "border border-(--accent) bg-(--accent-strong)/10 text-(--accent)"
          : variant === "warn"
            ? "border border-amber-500/30 text-amber-500 hover:border-amber-500"
            : "border border-(--border) text-(--dim) hover:text-(--fg) hover:border-(--surface4)"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono text-[11px] opacity-75">{count}</span>
    </button>
  )
}

// -------------------------------------------------------------
// EDITOR VIEW (AppEditor.dc.html)
// -------------------------------------------------------------
function EditorView({
  api,
  toast,
  editorDraftId,
  setEditorDraftId,
  md,
  setMd,
  sel,
  setSel,
  cover,
  setCover,
  configuredPlatforms,
  onGoToPlatforms,
  onReviewAndPublish,
  onSavedDraft,
  onBack,
}: {
  api: Api
  toast: (m: string) => void
  editorDraftId: string | null
  setEditorDraftId: (id: string | null) => void
  md: string
  setMd: (v: string) => void
  sel: Set<string>
  setSel: (s: Set<string>) => void
  cover: string
  setCover: (c: string) => void
  configuredPlatforms: string[]
  onGoToPlatforms: () => void
  onReviewAndPublish?: (content: string, platforms: Set<string>) => void
  onSavedDraft: () => void
  onBack?: () => void
}) {
  const [mode, setMode] = React.useState<"write" | "split" | "preview">("split")
  const [saving, setSaving] = React.useState(false)

  const title = extractTitle(md) || "Untitled post"
  const TitleHeading = onReviewAndPublish ? "h1" : "h3"
  const wordCount = md.trim() ? md.trim().split(/\s+/).filter(Boolean).length : 0
  const byteSize = new Blob([md]).size
  const formattedSize = byteSize < 1024 ? `${byteSize} B` : `${(byteSize / 1024).toFixed(1)} KB`

  const activePlatforms = [...sel].filter((p) => configuredPlatforms.includes(p))
  const selCount = activePlatforms.length

  const togglePlatform = (p: string) => {
    if (!configuredPlatforms.includes(p)) return
    const next = new Set(activePlatforms)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    setSel(next)
  }

  const handleSaveDraft = async () => {
    if (!md.trim()) return toast("Please write content before saving")
    if (activePlatforms.length === 0) return toast("Select at least one connected platform")
    setSaving(true)
    try {
      if (editorDraftId) {
        await api(`/drafts/${editorDraftId}`, "PUT", {
          title: extractTitle(md),
          content: md,
          platforms: activePlatforms,
          cover_image: cover.trim() || null,
        })
      } else {
        const res = (await api("/drafts", "POST", {
          title: extractTitle(md),
          content: md,
          platforms: activePlatforms,
          cover_image: cover.trim() || null,
        })) as unknown as { id: string }
        if (res?.id) setEditorDraftId(res.id)
      }
      onSavedDraft()
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs font-mono text-(--dim)">
            <button
              type="button"
              onClick={onBack ?? onGoToPlatforms}
              className="hover:text-(--fg) cursor-pointer"
            >
              Drafts
            </button>{" "}
            / {editorDraftId ? "Edit draft" : "New draft"}
          </nav>
          <TitleHeading className="text-xl sm:text-2xl font-semibold tracking-tight text-(--fg) mt-0.5">
            {title}
          </TitleHeading>
          <span className="text-xs text-(--dim2) font-mono">
            {wordCount} words · {formattedSize} of 1 MB max
          </span>
        </div>

        {/* View Mode Switcher */}
        <div role="group" aria-label="Editor view mode" className="flex items-center p-1 rounded-xl border border-(--border) bg-(--surface)">
          {(["write", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer transition-colors ${
                mode === m
                  ? "bg-(--surface2) text-(--fg) border border-(--border)"
                  : "text-(--dim) hover:text-(--fg)"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Preview Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {(mode === "write" || mode === "split") && (
          <section
            aria-label="Markdown source"
            className={`flex flex-col rounded-2xl border border-(--border) bg-(--surface) overflow-hidden ${
              mode === "write" ? "lg:col-span-2" : ""
            }`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-(--border) text-xs text-(--dim) bg-(--surface2)/50 font-mono">
              <span>Markdown</span>
              <span>Frontmatter title & tags supported</span>
            </div>
            <textarea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              placeholder={"---\ntitle: My Post\ntags: [tech, web]\n---\n\n# My Post\n\nWrite your thoughts here..."}
              className="w-full min-h-[380px] lg:min-h-[460px] p-4 bg-transparent text-(--fg) font-mono text-sm leading-relaxed outline-none resize-y"
            />
          </section>
        )}

        {(mode === "preview" || mode === "split") && (
          <section
            aria-label="Preview"
            className={`flex flex-col rounded-2xl border border-(--border) bg-(--surface) overflow-hidden ${
              mode === "preview" ? "lg:col-span-2" : ""
            }`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-(--border) text-xs text-(--dim) bg-(--surface2)/50 font-mono">
              <span>Preview</span>
              <span>Rendered output</span>
            </div>
            <div className="p-6 prose-like overflow-y-auto max-h-[500px]">
              <MarkdownPreview content={md} />
            </div>
          </section>
        )}
      </div>

      {/* Destinations Section */}
      <section aria-labelledby="dest-header" className="p-5 rounded-2xl border border-(--border) bg-(--surface) space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="dest-header" className="text-base font-semibold text-(--fg)">
            Destinations
          </h2>
          <span className="text-xs font-mono text-(--dim)">
            {selCount} selected · connect keys in Platforms tab to enable
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PLATFORMS.map((p) => {
            const isConfigured = configuredPlatforms.includes(p)
            const isSelected = activePlatforms.includes(p)
            const info = PLATFORM_DETAILS[p]

            return (
              <div
                key={p}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[82px] ${
                  isSelected && isConfigured
                    ? "border-(--accent) bg-(--accent-strong)/10"
                    : isConfigured
                      ? "border-(--border) bg-(--surface2)/40 hover:border-(--surface4)"
                      : "border-(--border)/60 bg-transparent opacity-65"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-(--fg)">
                    <input
                      type="checkbox"
                      checked={isSelected && isConfigured}
                      disabled={!isConfigured}
                      onChange={() => togglePlatform(p)}
                      className="rounded accent-(--accent) w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="font-semibold">{info.name}</span>
                  </label>
                  {!isConfigured && (
                    <button
                      type="button"
                      onClick={onGoToPlatforms}
                      className="text-[11px] font-medium text-(--accent) hover:underline cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-(--dim) line-clamp-1 mt-1">
                  {isConfigured ? info.note : "Not connected"}
                </span>
              </div>
            )
          })}
        </div>

        {/* Optional Cover image URL */}
        <div className="pt-2 max-w-md space-y-1">
          <label htmlFor="cover-url" className="text-xs font-medium text-(--fg3)">
            Cover image URL <span className="text-(--dim) font-normal">(optional)</span>
          </label>
          <input
            id="cover-url"
            type="url"
            placeholder="https://example.com/cover.png"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            className="w-full bg-(--surface2)/60 border border-(--border) focus:border-(--accent) text-(--fg) placeholder-(--dim3) rounded-xl px-3.5 py-2 text-xs font-mono outline-none transition-colors"
          />
        </div>
      </section>

      {/* Editor Footer Action Bar */}
      <div className="p-4 rounded-2xl border border-(--border) bg-(--surface) flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs text-(--dim)">
          Saving creates a draft snapshot on your Worker. Nothing is live until published.
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-(--border) hover:border-(--surface4) bg-transparent text-(--fg) text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          {onReviewAndPublish && <button
            type="button"
            disabled={selCount === 0 || !md.trim()}
            onClick={() => onReviewAndPublish(md, new Set(activePlatforms))}
            className="px-4 py-2 rounded-xl bg-(--accent-strong) hover:bg-(--accent) disabled:opacity-40 text-(--on-accent) text-xs font-semibold cursor-pointer disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            {selCount === 0 ? "Pick destination to publish" : "Review and publish"}
          </button>}
        </div>
      </div>
    </div>
  )
}

function MarkdownPreview({ content }: { content: string }) {
  const { body, title, tags } = resolvePostMetadata(content)
  const lines = body.split("\n")

  return (
    <div className="space-y-4 text-sm leading-relaxed text-(--fg2)">
      {title && (
        <h1 className="text-2xl font-bold tracking-tight text-(--fg)">
          {title}
        </h1>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-md bg-(--surface2) text-(--dim) text-xs font-mono">
              #{t}
            </span>
          ))}
        </div>
      )}

      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-bold text-(--fg) mt-4 mb-2">
              {trimmed.slice(2)}
            </h1>
          )
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-semibold text-(--fg) mt-3 mb-1.5">
              {trimmed.slice(3)}
            </h2>
          )
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-semibold text-(--fg) mt-2 mb-1">
              {trimmed.slice(4)}
            </h3>
          )
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={i} className="list-disc ml-5 text-(--fg3)">
              {trimmed.slice(2)}
            </li>
          )
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-2 border-(--accent) pl-3.5 italic text-(--dim) my-2">
              {trimmed.slice(2)}
            </blockquote>
          )
        }
        if (trimmed.startsWith("```")) {
          return (
            <div key={i} className="p-3 rounded-lg bg-(--surface2) font-mono text-xs text-(--dim) my-1 overflow-x-auto">
              {trimmed}
            </div>
          )
        }
        return <p key={i} className="text-(--fg3)">{line}</p>
      })}
    </div>
  )
}

// -------------------------------------------------------------
// PUBLISH MODAL (AppPublish.dc.html)
// -------------------------------------------------------------
function PublishModal({
  api,
  target,
  onClose,
  onDone,
  onSaveDraftId,
  toast,
}: {
  api: Api
  target: {
    draftId?: string
    title?: string
    content: string
    platforms: string[]
    cover_image?: string
  }
  onClose: () => void
  onDone: () => void
  onSaveDraftId?: (id: string) => void
  toast: (m: string) => void
}) {
  const [publishing, setPublishing] = React.useState(false)
  const [result, setResult] = React.useState<{ draftId: string; jobs: string[] } | null>(null)
  const [draftId, setDraftId] = React.useState<string | undefined>(target.draftId)

  React.useEffect(() => {
    if (target.draftId) setDraftId(target.draftId)
  }, [target.draftId])

  const isDraftOnly = target.platforms.length > 0 && target.platforms.every((p) => p === "substack")
  const countLabel = target.platforms.length === 1 ? "1 platform" : `${target.platforms.length} platforms`

  const handlePublish = async () => {
    setPublishing(true)
    try {
      let activeDraftId = draftId || target.draftId
      if (activeDraftId) {
        await api(`/drafts/${activeDraftId}`, "PUT", {
          title: target.title,
          content: target.content,
          cover_image: target.cover_image || null,
        })
      } else {
        const d = (await api("/drafts", "POST", {
          title: target.title,
          content: target.content,
          platforms: target.platforms,
          cover_image: target.cover_image || null,
        })) as unknown as { id: string }
        activeDraftId = d.id
        setDraftId(d.id)
        target.draftId = d.id
        if (onSaveDraftId) onSaveDraftId(d.id)
      }
      const res = (await api("/publish", "POST", {
        draftId: activeDraftId,
        platforms: target.platforms,
      })) as unknown as {
        draftId: string
        jobs: string[]
      }
      setResult({
        draftId: res.draftId || activeDraftId,
        jobs: res.jobs,
      })
      toast(res.jobs.length ? "Queued for publishing" : "No new jobs; selected platforms already published")
    } catch (e) {
      toast("Publish failed: " + (e as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <section role="dialog" aria-modal="true" aria-labelledby="pub-title" className="w-full max-w-lg bg-(--surface) border border-(--border) rounded-2xl p-6 space-y-6 shadow-2xl">
        {!result ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs text-(--dim) font-mono mb-1">
                <span>{target.title || "Untitled draft"}</span>
                {target.draftId && <code>{target.draftId.slice(0, 8)}</code>}
              </div>
              <h2 id="pub-title" className="text-xl font-bold text-(--fg)">
                {isDraftOnly ? "Create draft on Substack?" : target.platforms.length === 1 ? `Publish live to ${target.platforms[0]}?` : `Publish live to ${target.platforms.length} platforms?`}
              </h2>
              <p className="text-sm text-(--dim) mt-1.5 leading-relaxed">
                {isDraftOnly ? "Substack creates a draft in your publication." : "The console publishes with status: published. Unlike the CLI, there's no draft step: each post is public as soon as its job finishes."}
              </p>
            </div>

            <ul className="space-y-3 border-y border-(--border) py-4">
              {target.platforms.map((p) => {
                const key = p as PlatformKey
                const info = PLATFORM_PUBLISH_SUMMARY[key] || { title: "Goes live.", desc: "Publishes to platform." }
                return (
                  <li key={p} className="grid grid-cols-[100px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] gap-3 text-xs items-start">
                    <code className="font-mono font-semibold text-(--accent) shrink-0">{p}</code>
                    <div><strong className="font-medium text-(--fg)">{info.title}</strong>{" "}<span className="text-(--dim)">{info.desc}</span></div>
                  </li>
                )
              })}
            </ul>

            <div className="p-3.5 rounded-xl border border-(--border) bg-(--surface2)/50 text-xs text-(--dim) space-y-1.5">
              <p>
                <strong className="text-(--fg2)">Canonical URL:</strong> First platform to finish sets canonical; subsequent platforms point back to it.
              </p>
              <p>
                <strong className="text-(--fg2)">Already live?</strong> Successful platforms are skipped. Dashboard republishing does not update an existing live post yet.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-(--border) bg-transparent text-(--fg) text-xs font-semibold cursor-pointer"
              >
                Back to editor
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="px-5 py-2 rounded-xl bg-(--accent-strong) hover:bg-(--accent) text-(--on-accent) text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
              >
                {publishing
                  ? "Queuing jobs…"
                  : isDraftOnly
                    ? target.platforms.length === 1
                      ? "Create draft on Substack"
                      : `Create draft on ${countLabel}`
                    : `Publish live to ${countLabel}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-(--accent-strong)/20 text-(--accent) flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </div>
              <div>
                <h2 id="pub-title" className="text-lg font-bold text-(--fg)">
                  {result.jobs.length ? `${result.jobs.length} jobs queued` : "Already published"}
                </h2>
                <p className="text-xs text-(--dim) mt-0.5">
                  {result.jobs.length
                    ? "Publishing runs in the background on a Cloudflare Queue. You can close this. Results, live links and errors show up in the publish log."
                    : "No new jobs were queued because selected platforms already have successful publish records. Dashboard republishing does not update live posts yet."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-(--border) bg-(--surface2)/50 space-y-2">
              <span className="text-xs font-mono text-(--dim)">{result.jobs.length ? "Queued destinations:" : "No destinations queued"}</span>
              {result.jobs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.jobs.map((job) => (
                    <span key={job} className="px-2.5 py-1 rounded-md bg-(--surface) border border-(--border) font-mono text-xs text-(--fg2)">
                      {job}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <details className="p-3 rounded-xl border border-(--border) bg-(--surface2)/30 text-xs text-(--dim) space-y-2">
              <summary className="font-mono cursor-pointer hover:text-(--fg)">View API response</summary>
              <pre className="mt-2 font-mono text-[11px] text-(--dim2) overflow-x-auto p-2 bg-(--surface) rounded-lg border border-(--border)">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>

            <p className="text-xs text-(--dim) leading-relaxed">
              Network errors and 5xx responses retry automatically, up to 3 times. A 4xx, such as bad credentials, fails at once and waits for you to retry.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-(--border) bg-transparent text-(--fg) text-xs font-semibold cursor-pointer"
              >
                Back to drafts
              </button>
              <button
                type="button"
                onClick={onDone}
                className="px-5 py-2 rounded-xl bg-(--accent-strong) text-(--on-accent) text-xs font-semibold cursor-pointer"
              >
                Open publish log
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// -------------------------------------------------------------
// PUBLISH LOG VIEW (AppLog.dc.html)
// -------------------------------------------------------------
function formatLogTime(ts: number): string {
  const ms = ts > 1e11 ? ts : ts * 1000
  const diffSec = Math.floor((Date.now() - ms) / 1000)
  if (diffSec < 60) return "just now"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" })
}

function getRowStatus(status: string) {
  const s = status.toLowerCase()
  if (s === "ok" || s === "published" || s === "success" || s === "live") {
    return {
      label: "Live",
      color: "text-(--accent)",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12l5 5L20 6" />
        </svg>
      ),
      canRetry: false,
    }
  }
  if (s === "fail" || s === "failed" || s === "error") {
    return {
      label: "Failed",
      color: "text-(--danger)",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      ),
      canRetry: true,
    }
  }
  if (s === "retry" || s === "retrying" || s === "retryable") {
    return {
      label: "Retrying",
      color: "text-(--warn)",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 4v7h-7" />
        </svg>
      ),
      canRetry: true,
    }
  }
  return {
    label: "Publishing",
    color: "text-(--fg2)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 4" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
    canRetry: false,
  }
}

function getPostStatusChip(rows: HistoryRow[]) {
  const live = rows.filter((r) => ["ok", "published", "success", "live"].includes(r.status.toLowerCase())).length
  const failed = rows.filter((r) => ["fail", "failed", "error"].includes(r.status.toLowerCase())).length
  if (live === rows.length && rows.length > 0) {
    return {
      label: "Published",
      className: "border-transparent bg-(--accent)/15 text-(--accent)",
    }
  }
  if (failed === rows.length && rows.length > 0) {
    return {
      label: "Failed",
      className: "border-(--danger)/40 bg-(--danger)/10 text-(--danger)",
    }
  }
  if (live > 0) {
    return {
      label: `Partial · ${live} of ${rows.length}`,
      className: "border-(--warn)/40 bg-(--warn)/10 text-(--warn)",
    }
  }
  return {
    label: "Queued",
    className: "border-dashed border-(--accent)/60 bg-transparent text-(--accent)",
  }
}

function LogView({
  api,
  toast,
  onRetry,
  onGoToDrafts,
}: {
  api: Api
  toast: (m: string) => void
  onRetry: (draftId: string, platform: string) => Promise<unknown>
  onGoToDrafts?: () => void
}) {
  const [rows, setRows] = React.useState<HistoryRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<"all" | "live" | "retry" | "fail">("all")
  const [retryingKey, setRetryingKey] = React.useState<string | null>(null)

  const loadHistory = React.useCallback(async () => {
    setLoadError(null)
    try {
      const d = (await api("/history")) as unknown as { history: HistoryRow[] }
      setRows(d.history || [])
    } catch (e) {
      setLoadError((e as Error).message)
      toast((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  React.useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleRetryRow = async (draftId: string, platform: string) => {
    setRetryingKey(`${draftId}:${platform}`)
    try {
      await onRetry(draftId, platform)
      toast(`Queued retry for ${platform} (${draftId.slice(0, 8)})`)
      loadHistory()
    } catch (e) {
      toast("Retry failed: " + (e as Error).message)
    } finally {
      setRetryingKey(null)
    }
  }

  const liveCount = rows.filter((r) => r.status === "ok" || r.status === "published" || r.status === "success").length
  const failCount = rows.filter((r) => r.status === "fail" || r.status === "failed" || r.status === "error").length
  const retryCount = rows.filter((r) => r.status === "retry" || r.status === "retrying" || r.status === "retryable" || r.status === "publishing" || r.status === "queued").length

  const filteredRows = rows.filter((r) => {
    const s = r.status.toLowerCase()
    if (filter === "live") return s === "ok" || s === "published" || s === "success"
    if (filter === "fail") return s === "fail" || s === "failed" || s === "error"
    if (filter === "retry") return s === "retry" || s === "retrying" || s === "retryable" || s === "publishing" || s === "queued"
    return true
  })

  const groupedPosts = React.useMemo(() => {
    const map = new Map<string, { draftId: string; canonical: string | null; rows: HistoryRow[] }>()
    for (const r of filteredRows) {
      if (!map.has(r.draft_id)) {
        map.set(r.draft_id, { draftId: r.draft_id, canonical: r.url || null, rows: [] })
      }
      const item = map.get(r.draft_id)!
      if (!item.canonical && r.url) item.canonical = r.url
      item.rows.push(r)
    }
    return [...map.values()]
  }, [filteredRows])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">Publish log</h1>
          <p className="text-sm text-(--dim) mt-1">
            One line per post and platform, with the live link or the error. Shows the latest 200 entries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            loadHistory()
          }}
          className="px-3.5 py-1.5 rounded-xl border border-(--border) hover:border-(--surface4) bg-(--surface) text-xs font-mono text-(--dim) hover:text-(--fg) cursor-pointer transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div role="group" aria-label="Filter log" className="flex flex-wrap gap-2">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="All" count={rows.length} />
        <FilterPill active={filter === "live"} onClick={() => setFilter("live")} label="Live" count={liveCount} />
        {retryCount > 0 && (
          <FilterPill active={filter === "retry"} onClick={() => setFilter("retry")} label="Retrying" count={retryCount} variant="warn" />
        )}
        {failCount > 0 && (
          <FilterPill active={filter === "fail"} onClick={() => setFilter("fail")} label="Failed" count={failCount} variant="warn" />
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-(--border) bg-(--surface) animate-pulse space-y-2">
              <div className="h-4 w-1/4 bg-(--surface2) rounded" />
              <div className="h-3 w-1/2 bg-(--surface2)/60 rounded" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-(--danger)/35 bg-(--surface) p-8 space-y-3">
          <h2 className="font-semibold text-(--fg)">Could not load the publish log</h2>
          <p className="text-sm text-(--dim)">{loadError} Check your connection and try again. If your session expired, sign in again with your instance password.</p>
          <button type="button" onClick={() => { setLoading(true); loadHistory() }} className="text-sm font-semibold text-(--accent)">Try again</button>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="flex flex-col items-start gap-2 p-8 rounded-2xl border border-dashed border-(--border) bg-(--surface) text-left">
          <strong className="text-base font-semibold text-(--fg)">
            {filter === "all" ? "Nothing published yet" : filter === "fail" || filter === "retry" ? "Nothing needs attention" : "No entries match this filter"}
          </strong>
          <span className="text-sm text-(--dim)">
            {filter === "all"
              ? "Publish a draft and each platform's result appears here, with its live link or error."
              : filter === "fail" || filter === "retry"
                ? "No failed or retrying platforms in the latest 200 entries."
                : "Try selecting a different filter pill above to view log entries."}
          </span>
          {filter === "all" && onGoToDrafts && (
            <button
              type="button"
              onClick={onGoToDrafts}
              className="mt-2 inline-flex items-center min-h-10 text-sm font-medium text-(--accent) hover:underline cursor-pointer"
            >
              Go to drafts
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedPosts.map((post) => {
            const chip = getPostStatusChip(post.rows)
            return (
              <section
                key={post.draftId}
                className="rounded-2xl border border-(--border) bg-(--surface) overflow-hidden shadow-xs"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-(--border) bg-(--surface2)/50">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h2 className="text-sm sm:text-base font-semibold text-(--fg) truncate">
                      Draft {post.draftId.slice(0, 8)}
                    </h2>
                    <span className="text-xs text-(--dim) font-mono truncate">
                      Canonical:{" "}
                      <span className="text-(--fg2)">
                        {post.canonical || `urn:openpub:draft:${post.draftId}`}
                      </span>
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center min-h-[26px] px-2.5 py-0.5 rounded-full text-xs font-semibold border ${chip.className}`}
                  >
                    {chip.label}
                  </span>
                </header>

                <div className="overflow-x-auto">
                  <div role="table" aria-label="Platforms" className="min-w-[680px]">
                    <div
                      role="row"
                      className="grid grid-cols-[130px_120px_minmax(0,1fr)_76px_110px_96px] gap-4 px-5 py-2.5 text-xs font-medium text-(--dim) border-b border-(--border)"
                    >
                      <span role="columnheader">Platform</span>
                      <span role="columnheader">Status</span>
                      <span role="columnheader">Result</span>
                      <span role="columnheader">Attempts</span>
                      <span role="columnheader">Updated</span>
                      <span role="columnheader">
                        <span className="sr-only">Action</span>
                      </span>
                    </div>

                    {post.rows.map((r, i) => {
                      const st = getRowStatus(r.status)
                      const isRetrying = retryingKey === `${r.draft_id}:${r.platform}`

                      return (
                        <div
                          role="row"
                          key={`${r.draft_id}-${r.platform}-${i}`}
                          className="grid grid-cols-[130px_120px_minmax(0,1fr)_76px_110px_96px] gap-4 items-center px-5 py-3 border-b border-(--border)/60 last:border-b-0 text-xs hover:bg-(--surface2)/30 transition-colors"
                        >
                          <code
                            role="cell"
                            className="font-mono text-xs font-semibold text-(--fg)"
                          >
                            {PLATFORM_DETAILS[r.platform as PlatformKey]?.name || r.platform}
                          </code>

                          <span
                            role="cell"
                            className={`inline-flex items-center gap-1.5 font-medium ${st.color}`}
                          >
                            {st.icon}
                            {st.label}
                          </span>

                          <div role="cell" className="min-w-0 flex flex-col gap-0.5">
                            {r.url && (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-xs text-(--accent) hover:underline truncate inline-block max-w-full"
                              >
                                {r.url}
                              </a>
                            )}
                            {r.error && (
                              <span className="font-mono text-xs text-(--danger) break-all">
                                {r.error}
                              </span>
                            )}
                            {!r.url && !r.error && (
                              <span className="text-xs text-(--dim)">
                                Queued for publication
                              </span>
                            )}
                          </div>

                          <span
                            role="cell"
                            className="font-mono text-xs text-(--fg3) tabular-nums"
                          >
                            {r.attempts ?? 1}
                          </span>

                          <span
                            role="cell"
                            className="font-mono text-xs text-(--dim) tabular-nums"
                          >
                            {formatLogTime(r.created_at)}
                          </span>

                          <span role="cell" className="text-right">
                            {st.canRetry && (
                              <button
                                type="button"
                                disabled={isRetrying}
                                onClick={() => handleRetryRow(r.draft_id, r.platform)}
                                className="px-3 py-1 rounded-lg border border-(--border) hover:border-(--surface4) bg-transparent text-(--fg) text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
                              >
                                {isRetrying ? "Retrying…" : "Retry"}
                              </button>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="pt-4 border-t border-(--border) grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-(--dim)">
        <span>
          <strong className="font-medium text-(--accent)">Live</strong> · posted. A later Publish skips it.
        </span>
        <span>
          <strong className="font-medium text-(--warn)">Retrying</strong> · network or 5xx. The queue tries again on its own; Retry runs it now.
        </span>
        <span>
          <strong className="font-medium text-(--danger)">Failed</strong> · a 4xx, usually credentials. Fix them in Platforms, then Retry.
        </span>
        <span>
          <strong className="font-medium text-(--fg2)">Publishing</strong> · claimed by the queue. Over 5 minutes, a redelivery can pick it up.
        </span>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// PLATFORMS VIEW (AppPlatforms.dc.html)
// -------------------------------------------------------------
function PlatformsView({
  api,
  toast,
  configured,
  onRefresh,
  embedded = false,
}: {
  embedded?: boolean
  api: Api
  toast: (m: string) => void
  configured: string[]
  onRefresh: () => void
}) {
  const [selected, setSelected] = React.useState<PlatformKey>("devto")
  const [creds, setCreds] = React.useState<Record<string, string>>({})
  const [testStatus, setTestStatus] = React.useState<"idle" | "testing" | "ok" | "fail">("idle")
  const [testError, setTestError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [rawJsonMode, setRawJsonMode] = React.useState(false)
  const [rawJson, setRawJson] = React.useState("")

  const activeMeta = PLATFORM_DETAILS[selected]
  const isConfigured = configured.includes(selected)

  // Reset credential inputs when selected platform changes
  React.useEffect(() => {
    const keys = CRED_KEYS[selected]
    const initial: Record<string, string> = {}
    keys.forEach((k) => (initial[k] = ""))
    setCreds(initial)
    setRawJson("{\n" + keys.map((k) => `  "${k}": ""`).join(",\n") + "\n}")
    setTestStatus("idle")
    setTestError(null)
  }, [selected])

  const handleSave = async () => {
    setSaving(true)
    let payload = creds
    if (rawJsonMode) {
      try {
        payload = JSON.parse(rawJson)
      } catch {
        toast("Invalid JSON format")
        setSaving(false)
        return
      }
    }
    try {
      await api("/platforms/" + selected, "POST", payload)
      toast("Saved credentials for " + activeMeta.name)
      onRefresh()
    } catch (e) {
      toast("Save failed: " + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTestStatus("testing")
    setTestError(null)
    try {
      const res = (await api("/platforms/" + selected + "/test", "POST", {})) as unknown as {
        ok: boolean
        error?: string
      }
      if (res.ok) {
        setTestStatus("ok")
        toast(activeMeta.name + " test passed!")
      } else {
        setTestStatus("fail")
        setTestError(res.error || "Connection rejected by platform")
        toast(activeMeta.name + " test failed")
      }
    } catch (e) {
      setTestStatus("fail")
      setTestError((e as Error).message)
      toast((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">Platforms</h1>
            <p className="text-sm text-(--dim) mt-1">
              {configured.length} of 8 platforms connected on this instance.
            </p>
          </div>
          {configured.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-(--border) bg-(--surface2)/30 space-y-1">
              <strong className="text-sm font-semibold text-(--fg)">No platforms connected</strong>
              <p className="text-xs text-(--dim)">
                You can write and save drafts now. To publish, connect at least one platform below.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Platform List */}
        <div className="md:col-span-5 space-y-2">
          {PLATFORMS.map((p) => {
            const isConn = configured.includes(p)
            const isCur = selected === p
            const meta = PLATFORM_DETAILS[p]

            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelected(p)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isCur
                    ? "border-(--accent) bg-(--surface2) shadow-xs"
                    : "border-(--border) bg-(--surface) hover:border-(--surface4)"
                }`}
              >
                <div>
                  <div className="font-mono text-sm font-semibold text-(--fg)">{meta.name}</div>
                  <div className="text-xs text-(--dim) mt-0.5">{isConn ? "Configured" : "Not connected"}</div>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConn ? "bg-(--accent)" : "bg-(--border)"
                  }`}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>

        {/* Right Column: Platform Configuration Form */}
        <div className="md:col-span-7 p-6 rounded-2xl border border-(--border) bg-(--surface) space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-(--fg)">{activeMeta.name}</h2>
              <p className="text-xs text-(--dim) mt-1">{activeMeta.cap}</p>
            </div>
            <StatusChip status={isConfigured ? "configured" : "not configured"} />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-(--dim)">Required Credentials</span>
              <button
                type="button"
                onClick={() => setRawJsonMode(!rawJsonMode)}
                className="text-xs font-mono text-(--accent) hover:underline cursor-pointer"
              >
                {rawJsonMode ? "Switch to Fields" : "Edit Raw JSON"}
              </button>
            </div>

            {rawJsonMode ? (
              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={6}
                className="w-full bg-(--surface2)/60 border border-(--border) focus:border-(--accent) text-(--fg) p-3 rounded-xl font-mono text-xs outline-none"
              />
            ) : (
              CRED_KEYS[selected].map((k) => (
                <div key={k} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <label htmlFor={`field-${k}`} className="font-medium text-(--fg3)">
                      {activeMeta.fieldLabels[k] || k}
                    </label>
                    <code className="text-(--dim2) font-mono">{k}</code>
                  </div>
                  <input
                    id={`field-${k}`}
                    type={activeMeta.fieldTypes[k] || "text"}
                    placeholder={activeMeta.fieldPlaceholders[k] || ""}
                    value={creds[k] || ""}
                    onChange={(e) => setCreds({ ...creds, [k]: e.target.value })}
                    className="w-full bg-(--surface2)/60 border border-(--border) focus:border-(--accent) text-(--fg) placeholder-(--dim3) px-3.5 py-2.5 rounded-xl font-mono text-xs outline-none transition-colors"
                  />
                </div>
              ))
            )}

            <p className="text-xs text-(--dim)">
              <strong className="text-(--fg3)">Where to find:</strong> {activeMeta.where}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-(--accent-strong) hover:bg-(--accent) text-(--on-accent) font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save credentials"}
            </button>
            <button
              type="button"
              disabled={testStatus === "testing" || !isConfigured}
              onClick={handleTest}
              className="px-4 py-2 rounded-xl border border-(--border) hover:border-(--surface4) bg-transparent text-(--fg) font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {testStatus === "testing" ? "Testing…" : "Test connection"}
            </button>
          </div>

          {/* Test Status Alerts */}
          {testStatus === "ok" && (
            <div role="status" className="p-3.5 rounded-xl border border-(--accent-strong)/30 bg-(--accent-strong)/10 text-xs text-(--fg2) flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-(--accent)" />
              <span>
                <strong className="font-semibold text-(--fg)">Test passed.</strong> {activeMeta.name} accepted credentials.
              </span>
            </div>
          )}

          {testStatus === "fail" && (
            <div role="alert" className="p-3.5 rounded-xl border border-red-500/35 bg-red-500/10 text-xs text-(--fg2) space-y-1">
              <div className="flex items-center gap-2 text-(--danger) font-semibold">
                <span className="w-2 h-2 rounded-full bg-(--danger)" />
                Test failed
              </div>
              <p className="text-(--dim) font-mono">
                {testError || "Platform rejected connection or was unreachable."}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-(--border) text-xs text-(--dim) space-y-2">
            <p>
              Credentials are stored as JSON in your instance's D1 database. Saving does not test them; use Test connection for a separate check.
            </p>
            <p>
              Protect your ADMIN_KEY and restrict access to your Cloudflare account. Credential values are not shown in this console.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// SETTINGS VIEW (AppSettings.dc.html)
// -------------------------------------------------------------
function SettingsView({
  base,
  onSignOut,
  theme,
  toggleTheme,
  toast,
}: {
  base: string
  onSignOut: () => void
  theme: "dark" | "light"
  toggleTheme: (t?: "dark" | "light") => void
  toast: (m: string) => void
}) {
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false)

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        openpub: {
          type: "http",
          url: `${base}/mcp`,
          headers: { Authorization: "Bearer YOUR_ADMIN_KEY" },
        },
      },
    },
    null,
    2,
  )

  const copyMcpConfig = () => {
    navigator.clipboard?.writeText(mcpConfig)
    toast("MCP config copied to clipboard")
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--fg)">Settings</h1>
        <p className="text-sm text-(--dim) mt-1">
          These settings are saved in this browser. Server settings live in your <code className="font-mono text-(--fg2)">wrangler.toml</code>.
        </p>
      </div>

      {/* Account */}
      <section aria-labelledby="account-heading" className="space-y-3 pb-8 border-b border-(--border)">
        <h2 id="account-heading" className="text-lg font-semibold text-(--fg)">Account</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-(--border) bg-(--surface)">
          <div>
            <p className="text-sm font-medium text-(--fg)">Instance password</p>
            <p className="text-xs text-(--dim) mt-0.5">Password hash stored in your D1 database</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="px-3.5 py-2 rounded-xl border border-(--border) hover:border-red-500/40 text-(--dim) hover:text-(--danger) text-xs font-semibold cursor-pointer transition-colors"
          >
            Sign out
          </button>
        </div>

        {showSignOutConfirm && (
          <div
            role="alertdialog"
            aria-label="Confirm sign out"
            className="p-4 rounded-xl border border-red-500/35 bg-red-500/10 flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <span className="text-(--fg2)">
              Sign out of this browser? Your drafts and platform settings stay on the instance.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-(--border) bg-transparent text-(--fg) font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-1.5 rounded-lg bg-(--danger) text-white font-semibold cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

      </section>

      {/* Appearance */}
      <section aria-labelledby="theme-heading" className="space-y-3 pb-8 border-b border-(--border)">
        <h2 id="theme-heading" className="text-lg font-semibold text-(--fg)">Appearance</h2>
        <div role="group" aria-label="Theme selector" className="inline-flex p-1 rounded-xl border border-(--border) bg-(--surface)">
          <button
            type="button"
            onClick={() => toggleTheme("dark")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              theme === "dark" ? "bg-(--surface2) text-(--fg)" : "text-(--dim) hover:text-(--fg)"
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => toggleTheme("light")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              theme === "light" ? "bg-(--surface2) text-(--fg)" : "text-(--dim) hover:text-(--fg)"
            }`}
          >
            Light
          </button>
        </div>
      </section>

      {/* Connect an Agent (MCP) */}
      <section aria-labelledby="mcp-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="mcp-heading" className="text-lg font-semibold text-(--fg)">Connect an agent</h2>
          <button
            type="button"
            onClick={copyMcpConfig}
            className="text-xs font-mono text-(--accent) hover:underline cursor-pointer"
          >
            Copy JSON
          </button>
        </div>
        <p className="text-xs text-(--dim)">
          Your instance serves MCP over HTTP at <code className="font-mono text-(--fg2)">/mcp</code>. Add it to Claude Code or Cursor. Replace <code className="font-mono text-(--fg2)">YOUR_ADMIN_KEY</code> with your Worker's <code className="font-mono text-(--fg2)">ADMIN_KEY</code> secret, not your instance password:
        </p>
        <pre className="p-4 rounded-xl border border-(--border) bg-(--surface) font-mono text-xs text-(--fg2) overflow-x-auto leading-relaxed">
          {mcpConfig}
        </pre>
        <p className="text-xs text-(--dim)">
          Public routes without auth: <code className="font-mono text-(--fg2)">/health</code>, <code className="font-mono text-(--fg2)">/docs</code>, and generated cover images.
        </p>
      </section>
    </div>
  )
}

// -------------------------------------------------------------
// ONBOARDING / LOGIN VIEW (Onboarding.dc.html)
// -------------------------------------------------------------
function OnboardingView({
  base,
  passwordConfigured,
  onAuthenticated,
  theme,
  toggleTheme,
}: {
  base: string
  passwordConfigured: boolean
  onAuthenticated: () => void
  theme: "dark" | "light"
  toggleTheme: () => void
}) {
  const [adminKey, setAdminKey] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      const body: { adminKey?: string; password?: string } = {}
      if (adminKey.trim()) body.adminKey = adminKey
      if (passwordConfigured && password) body.password = password
      if (!body.adminKey && !body.password) {
        setError(passwordConfigured ? "Enter your Admin Key or instance password." : "Enter your Admin Key.")
        setBusy(false)
        return
      }
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) throw new Error(data.error || "Could not sign in")
      setAdminKey("")
      setPassword("")
      onAuthenticated()
    } catch (err) {
      setError((err as Error).message || "Could not reach your OpenPub instance.")
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = passwordConfigured
    ? Boolean(adminKey.trim() || password)
    : Boolean(adminKey.trim())

  return (
    <main className="min-h-screen bg-(--bg) text-(--fg3) font-sans antialiased flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-(--border) bg-(--surface) p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <a href="/" aria-label="OpenPub home"><Logo /></a>
          <button type="button" onClick={toggleTheme} className="text-xs font-mono text-(--dim) hover:text-(--fg) cursor-pointer">
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-(--fg)">Sign in</h1>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-(--dim)">
          Paste the <code className="font-mono text-(--fg2)">ADMIN_KEY</code> Wrangler secret for this Worker.
          {passwordConfigured ? " You can use your instance password instead if you set one in Settings." : ""}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-admin-key" className="text-sm font-medium text-(--fg)">Admin Key</label>
            <input id="login-admin-key" type="password" autoComplete="off" required={!passwordConfigured} value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="w-full rounded-xl border border-(--border) bg-(--bg) px-3.5 py-3 font-mono text-sm text-(--fg) outline-none focus:border-(--accent)" />
          </div>
          {passwordConfigured && <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-(--fg)">Instance password <span className="text-(--dim)">(optional)</span></label>
            <input id="login-password" type="password" autoComplete="current-password" maxLength={1024} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-(--border) bg-(--bg) px-3.5 py-3 font-mono text-sm text-(--fg) outline-none focus:border-(--accent)" />
          </div>}
          {error && <p role="alert" className="rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-(--danger)">{error}</p>}
          <button type="submit" disabled={busy || !canSubmit} className="w-full rounded-xl bg-(--accent) px-5 py-3 font-semibold text-(--on-accent) disabled:opacity-50">
            {busy ? "Please wait…" : "Enter"}
          </button>
        </form>
        <p className="mt-6 text-xs text-(--dim)">Sessions use a secure, HttpOnly cookie on this instance.</p>
      </section>
    </main>
  )
}
