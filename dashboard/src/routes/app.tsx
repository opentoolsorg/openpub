import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import { Logo } from "~/components/Logo"

export const Route = createFileRoute("/app")({
  component: App,
})

const DEFAULT_BASE = "https://openpost.princslabs.workers.dev"

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

const CRED_KEYS: Record<string, string[]> = {
  devto: ["api_key"],
  hashnode: ["token", "publication_id"],
  wordpress: ["site_url", "username", "app_password"],
  ghost: ["site_url", "admin_key"],
  medium: ["integration_token"],
  substack: ["connect_sid", "publication_url"],
  "github-pages": ["token", "repo", "dir", "branch"],
  x: ["access_token"],
}

type Draft = {
  id: string
  title: string | null
  content: string
  platforms: string[]
  status: string
  canonical_url: string | null
  created_at: number
}

type HistoryRow = {
  draft_id: string
  platform: string
  status: string
  url: string | null
  error: string | null
  created_at: number
}

type Api = (p: string, m?: string, b?: unknown) => Promise<Record<string, unknown>>

type Tab = "drafts" | "platforms" | "history"

function useApi() {
  const [base, setBaseState] = React.useState(
    () => localStorage.getItem("op-base") || DEFAULT_BASE,
  )
  const [key, setKeyState] = React.useState(
    () => localStorage.getItem("op-key") || "",
  )

  const setBase = (b: string) => {
    const v = b.replace(/\/$/, "")
    localStorage.setItem("op-base", v)
    setBaseState(v)
  }
  const setKey = (k: string) => {
    localStorage.setItem("op-key", k)
    setKeyState(k)
  }

  const api = React.useCallback<Api>(
    async (path, method = "GET", body) => {
      const res = await fetch(base + "/api" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (!res.ok) throw new Error((data.error as string) || res.statusText)
      return data
    },
    [base, key],
  )

  return { base, key, setBase, setKey, api }
}

function useToast() {
  const [msg, setMsg] = React.useState("")
  const toast = React.useCallback((m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg(""), 3000)
  }, [])
  return { msg, toast }
}

function getStatusBadgeStyle(status: string) {
  const s = status.toLowerCase()
  if (
    s === "success" ||
    s === "ok" ||
    s === "published" ||
    s === "configured" ||
    s === "test ok"
  ) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
  if (
    s === "failed" ||
    s === "fail" ||
    s === "error" ||
    s === "test failed"
  ) {
    return "bg-red-500/10 text-red-400 border-red-500/20"
  }
  return "bg-zinc-800/80 text-zinc-400 border-zinc-700/60"
}

function StatusBadge({
  status,
  label,
  pulse = false,
}: {
  status: string
  label?: string
  pulse?: boolean
}) {
  const badgeStyle = getStatusBadgeStyle(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${pulse ? "animate-pulse" : ""}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          badgeStyle.includes("text-emerald-400")
            ? "bg-emerald-400"
            : badgeStyle.includes("text-red-400")
              ? "bg-red-400"
              : "bg-zinc-500"
        }`}
      />
      {label || status}
    </span>
  )
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 sm:p-10 text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function App() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0c0b] text-zinc-200 font-sans antialiased selection:bg-emerald-500/30">
        <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 sm:py-8 w-full animate-pulse">
          <div className="flex justify-between items-center pb-6">
            <div className="space-y-1">
              <div className="h-6 w-32 bg-zinc-800 rounded" />
              <div className="h-3.5 w-48 bg-zinc-800/60 rounded" />
            </div>
            <div className="h-8 w-24 bg-zinc-800/60 rounded-lg" />
          </div>
          <div className="flex gap-2 border-b border-zinc-800 pb-2 mb-6">
            <div className="h-8 w-20 bg-zinc-800 rounded-lg" />
            <div className="h-8 w-24 bg-zinc-800/60 rounded-lg" />
            <div className="h-8 w-20 bg-zinc-800/60 rounded-lg" />
          </div>
          <div className="h-48 bg-zinc-900/50 rounded-xl border border-zinc-800" />
        </div>
      </div>
    )
  }

  return <Main />
}

function Main() {
  const { base, key, setBase, setKey, api } = useApi()
  const { msg, toast } = useToast()
  const [tab, setTab] = React.useState<Tab>("drafts")

  if (!key) {
    return (
      <div className="min-h-screen bg-[#0a0c0b] text-zinc-200 font-sans antialiased selection:bg-emerald-500/30 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <a href="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
              <Logo />
            </a>
            <p className="text-xs text-zinc-400 mt-1.5">
              enter admin key to continue
            </p>
          </div>
          <LoginForm base={base} setBase={setBase} onKey={setKey} />
          <div className="mt-5 flex items-center justify-center gap-4 text-xs font-mono text-zinc-500">
            <a href="/docs" className="hover:text-zinc-300 transition-colors">
              Docs
            </a>
            <span>·</span>
            <a href="/" className="hover:text-zinc-300 transition-colors">
              Home
            </a>
          </div>
          {msg && (
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-lg text-xs shadow-xl z-50">
              {msg}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c0b] text-zinc-200 font-sans antialiased selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 sm:py-8 w-full">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <a href="/" className="hover:opacity-90 transition-opacity">
                <Logo />
              </a>
              <span className="font-sans text-[11px] px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900/90 text-zinc-400">
                console
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">write once, publish everywhere</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <a
              href="/docs"
              className="font-mono text-xs text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 hover:text-emerald-400 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              Docs
            </a>
            <span
              className="font-mono text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg truncate max-w-[150px] sm:max-w-xs"
              title={base}
            >
              {base.replace("https://", "")}
            </span>
            <button
              type="button"
              className="bg-zinc-800/80 hover:bg-zinc-700 hover:text-zinc-100 text-zinc-300 border border-zinc-700/60 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              onClick={() => {
                const b = window.prompt("API base URL", base)
                if (b) setBase(b)
              }}
            >
              Config
            </button>
            <button
              type="button"
              className="bg-zinc-800/80 hover:bg-zinc-700 hover:text-zinc-100 text-zinc-300 border border-zinc-700/60 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              onClick={() => {
                localStorage.removeItem("op-key")
                setKey("")
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <nav className="flex items-center gap-1 border-b border-zinc-800 mb-6 overflow-x-auto pb-px">
          {(["drafts", "platforms", "history"] as Tab[]).map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                type="button"
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </nav>

        <main>
          {tab === "drafts" && <Drafts api={api} toast={toast} />}
          {tab === "platforms" && <Platforms api={api} toast={toast} />}
          {tab === "history" && <History api={api} toast={toast} />}
        </main>

        {msg && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-2.5 rounded-lg text-xs sm:text-sm shadow-xl z-50 flex items-center gap-2 max-w-[90vw] text-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">{msg}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function LoginForm({
  base,
  setBase,
  onKey,
}: {
  base: string
  setBase: (b: string) => void
  onKey: (k: string) => void
}) {
  const [k, setK] = React.useState("")
  return (
    <div className="w-full p-5 sm:p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3.5 text-left">
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">Admin Key</label>
        <input
          type="password"
          placeholder="Admin key"
          value={k}
          onChange={(e) => setK(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && k && onKey(k)}
          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg px-3.5 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">API Base URL</label>
        <input
          placeholder="API base URL"
          defaultValue={base}
          onBlur={(e) => setBase(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg px-3.5 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-colors"
        />
      </div>
      <button
        type="button"
        onClick={() => k && onKey(k)}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium py-2.5 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
        disabled={!k}
      >
        Continue
      </button>
    </div>
  )
}

function DraftsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 animate-pulse space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-zinc-800 rounded w-1/3 min-w-[120px]" />
              <div className="h-3 bg-zinc-800/60 rounded w-1/2 min-w-[180px]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-14 bg-zinc-800/60 rounded-lg" />
              <div className="h-7 w-16 bg-zinc-800/60 rounded-lg" />
              <div className="h-7 w-14 bg-zinc-800/60 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Drafts({ api, toast }: { api: Api; toast: (m: string) => void }) {
  const [md, setMd] = React.useState("")
  const [sel, setSel] = React.useState<Set<string>>(new Set())
  const [drafts, setDrafts] = React.useState<Draft[]>([])
  const [busy, setBusy] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    try {
      const d = (await api("/drafts")) as unknown as { drafts: Draft[] }
      setDrafts(d.drafts || [])
    } catch (e) {
      toast("load failed: " + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  React.useEffect(() => {
    load()
  }, [load])

  const title = () =>
    md
      .split("\n")
      .find((l) => l.startsWith("#"))
      ?.replace(/^#+\s*/, "")
      .trim() || undefined

  const tog = (p: string) => {
    const s = new Set(sel)
    if (s.has(p)) s.delete(p)
    else s.add(p)
    setSel(s)
  }

  const save = async () => {
    if (!md.trim()) return toast("write something first")
    setBusy(true)
    try {
      await api("/drafts", "POST", { title: title(), content: md, platforms: [...sel] })
      toast("draft saved")
      load()
    } catch (e) {
      toast((e as Error).message)
    }
    setBusy(false)
  }

  const publish = async () => {
    if (!md.trim() || !sel.size) return toast("write + pick platforms")
    setBusy(true)
    try {
      const d = (await api("/drafts", "POST", {
        title: title(),
        content: md,
        platforms: [...sel],
      })) as unknown as { id: string }
      await api("/publish", "POST", { draftId: d.id })
      toast("queued for publish")
      load()
    } catch (e) {
      toast((e as Error).message)
    }
    setBusy(false)
  }

  const pub = async (id: string) => {
    try {
      await api("/publish", "POST", { draftId: id })
      toast("queued")
    } catch (e) {
      toast((e as Error).message)
    }
  }

  const del = async (id: string) => {
    try {
      await api("/drafts/" + id, "DELETE")
      load()
    } catch (e) {
      toast((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-300">Post content (Markdown)</label>
          <textarea
            placeholder={"# Title\n\nMarkdown content..."}
            value={md}
            onChange={(e) => setMd(e.target.value)}
            className="w-full min-h-[10rem] bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 text-zinc-100 placeholder-zinc-500 rounded-lg p-3.5 font-mono text-sm leading-relaxed transition-colors outline-none resize-y"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Target platforms</span>
            <span className="text-[11px] text-zinc-500">
              {sel.size} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const selected = sel.has(p)
              return (
                <button
                  key={p}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none ${
                    selected
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                  onClick={() => tog(p)}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      selected ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={publish}
            disabled={busy}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Publish
          </button>
          <button
            type="button"
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700/60 font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            onClick={save}
            disabled={busy}
          >
            Save Draft
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
            Saved Drafts
          </h2>
          {!loading && (
            <span className="text-xs text-zinc-500 font-mono">
              {drafts.length} total
            </span>
          )}
        </div>

        {loading ? (
          <DraftsSkeleton />
        ) : drafts.length === 0 ? (
          <EmptyState
            title="No drafts yet"
            description="Write your post in markdown above, choose target platforms, and save or publish to get started."
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
          />
        ) : (
          drafts.map((d) => (
            <div
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              key={d.id}
            >
              <div className="space-y-2 min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-100 break-words">
                  {d.title || "Untitled"}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <StatusBadge status={d.status} />
                  {d.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.platforms.map((plat) => (
                        <span
                          key={plat}
                          className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-zinc-950 border border-zinc-800 text-zinc-300"
                        >
                          {plat}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-zinc-500 font-mono">
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="bg-zinc-800/80 hover:bg-zinc-700 hover:text-zinc-100 text-zinc-300 border border-zinc-700/60 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                  onClick={() => setMd(d.content)}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="bg-zinc-800/80 hover:bg-zinc-700 hover:text-zinc-100 text-zinc-300 border border-zinc-700/60 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                  onClick={() => pub(d.id)}
                >
                  Publish
                </button>
                <button
                  type="button"
                  className="bg-zinc-800/80 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/60 text-zinc-400 border border-zinc-700/60 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                  onClick={() => del(d.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PlatformsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-5 w-24 bg-zinc-800/60 rounded-full" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-7 w-16 bg-zinc-800/60 rounded-lg" />
            <div className="h-7 w-14 bg-zinc-800/60 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Platforms({ api, toast }: { api: Api; toast: (m: string) => void }) {
  const [configured, setConfigured] = React.useState<string[]>([])
  const [setup, setSetup] = React.useState<string | null>(null)
  const [json, setJson] = React.useState("")
  const [testing, setTesting] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    try {
      const d = (await api("/status")) as unknown as {
        platforms: { platform: string }[]
        available: string[]
      }
      setConfigured((d.platforms || []).map((p) => p.platform))
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  React.useEffect(() => {
    load()
  }, [load])

  const saveSetup = async () => {
    if (!setup) return
    let creds: Record<string, string>
    try {
      creds = JSON.parse(json)
    } catch {
      return toast("invalid JSON")
    }
    try {
      await api("/platforms/" + setup, "POST", creds)
      toast("saved " + setup)
      setSetup(null)
      setJson("")
      load()
    } catch (e) {
      toast((e as Error).message)
    }
  }

  const test = async (name: string) => {
    setTesting((t) => ({ ...t, [name]: "testing" }))
    try {
      const r = (await api("/platforms/" + name + "/test", "POST", {})) as unknown as {
        ok: boolean
        error?: string
      }
      setTesting((t) => ({ ...t, [name]: r.ok ? "ok" : "fail" }))
      if (!r.ok) toast(name + " test failed" + (r.error ? ": " + r.error : ""))
    } catch (e) {
      setTesting((t) => ({ ...t, [name]: "fail" }))
      toast((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
          Platforms ({configured.length}/{PLATFORMS.length} configured)
        </h2>
      </div>

      {loading ? (
        <PlatformsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PLATFORMS.map((p) => {
            const ok = configured.includes(p)
            const t = testing[p]
            return (
              <div
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all space-y-3.5"
                key={p}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-zinc-100 text-sm font-mono">{p}</h3>
                    <StatusBadge
                      status={ok ? "configured" : "not configured"}
                      label={ok ? "configured" : "not configured"}
                    />
                  </div>
                  {t && (
                    <div className="pt-0.5">
                      {t === "ok" && <StatusBadge status="test ok" label="test ok" />}
                      {t === "testing" && <StatusBadge status="testing" label="testing..." pulse />}
                      {t === "fail" && <StatusBadge status="test failed" label="test failed" />}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
                  <button
                    type="button"
                    className="bg-zinc-800/80 hover:bg-zinc-700 hover:text-zinc-100 text-zinc-300 border border-zinc-700/60 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    onClick={() => {
                      setSetup(p)
                      setJson(
                        "{\n" + CRED_KEYS[p].map((k) => `  "${k}": ""`).join(",\n") + "\n}",
                      )
                    }}
                  >
                    Setup
                  </button>
                  <button
                    type="button"
                    className="bg-zinc-800/80 hover:bg-zinc-700 hover:text-zinc-100 text-zinc-300 border border-zinc-700/60 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                    onClick={() => test(p)}
                    disabled={t === "testing"}
                  >
                    Test
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {setup && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setSetup(null)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-100">Setup credentials</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {setup}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSetup(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1 text-sm rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Required credential keys:</label>
              <div className="flex flex-wrap gap-1.5">
                {CRED_KEYS[setup].map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] bg-zinc-950 border border-zinc-800 text-zinc-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Credentials JSON</label>
              <textarea
                className="w-full min-h-[7.5rem] bg-zinc-950 text-zinc-100 font-mono text-xs p-3 rounded-lg border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-y"
                value={json}
                onChange={(e) => setJson(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={saveSetup}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-medium px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                onClick={() => setSetup(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 animate-pulse space-y-2.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-5 w-16 bg-zinc-800/60 rounded-full" />
            <div className="h-4 w-10 bg-zinc-800/40 rounded ml-auto" />
          </div>
          <div className="h-3 bg-zinc-800/40 rounded w-2/3 max-w-sm" />
        </div>
      ))}
    </div>
  )
}

function History({ api, toast }: { api: Api; toast: (m: string) => void }) {
  const [rows, setRows] = React.useState<HistoryRow[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    try {
      const d = (await api("/history")) as unknown as { history: HistoryRow[] }
      setRows(d.history || [])
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
          Publish History
        </h2>
        {!loading && (
          <span className="text-xs text-zinc-500 font-mono">
            {rows.length} total
          </span>
        )}
      </div>

      {loading ? (
        <HistorySkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No publish history"
          description="Published posts and delivery logs will appear here once you publish a draft."
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 hover:border-zinc-700/80 transition-all space-y-2"
              key={i}
            >
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-semibold text-zinc-100 font-mono">
                    {r.platform}
                  </strong>
                  <StatusBadge status={r.status} />
                </div>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    view link ↗
                  </a>
                )}
              </div>
              <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono">
                <span>draft {r.draft_id.slice(0, 8)}</span>
                <span className="text-zinc-600">·</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
                {r.error && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-red-400 font-sans break-all">{r.error}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
