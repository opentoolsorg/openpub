import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

const DEFAULT_BASE = 'https://openpost.princslabs.workers.dev'

const PLATFORMS = [
  'devto',
  'hashnode',
  'wordpress',
  'ghost',
  'medium',
  'substack',
  'github-pages',
] as const

const CRED_KEYS: Record<string, string[]> = {
  devto: ['api_key'],
  hashnode: ['token', 'publication_id'],
  wordpress: ['site_url', 'username', 'app_password'],
  ghost: ['site_url', 'admin_key'],
  medium: ['integration_token'],
  substack: ['connect_sid', 'publication_url'],
  'github-pages': ['token', 'repo', 'dir', 'branch'],
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

type Tab = 'drafts' | 'platforms' | 'history'

function useApi() {
  const [base, setBaseState] = React.useState(
    () => localStorage.getItem('op-base') || DEFAULT_BASE,
  )
  const [key, setKeyState] = React.useState(
    () => localStorage.getItem('op-key') || '',
  )

  const setBase = (b: string) => {
    const v = b.replace(/\/$/, '')
    localStorage.setItem('op-base', v)
    setBaseState(v)
  }
  const setKey = (k: string) => {
    localStorage.setItem('op-key', k)
    setKeyState(k)
  }

  const api = React.useCallback<Api>(
    async (path, method = 'GET', body) => {
      const res = await fetch(base + '/api' + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + key,
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
  const [msg, setMsg] = React.useState('')
  const toast = React.useCallback((m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg(''), 3000)
  }, [])
  return { msg, toast }
}

function App() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div className="wrap">
        <h1>OpenPost</h1>
        <p className="sub">write once, publish everywhere</p>
      </div>
    )
  }
  return <Main />
}

function Main() {
  const { base, key, setBase, setKey, api } = useApi()
  const { msg, toast } = useToast()
  const [tab, setTab] = React.useState<Tab>('drafts')

  if (!key) {
    return (
      <div className="center">
        <h1>OpenPost</h1>
        <p className="sub" style={{ margin: '0.5rem 0 1.5rem' }}>
          enter admin key to continue
        </p>
        <LoginForm base={base} setBase={setBase} onKey={setKey} />
        {msg && <div className="toast">{msg}</div>}
      </div>
    )
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <h1>OpenPost</h1>
          <p className="sub">write once, publish everywhere</p>
        </div>
        <div className="right">
          <span className="muted" style={{ fontSize: '0.75rem' }}>
            {base.replace('https://', '')}
          </span>
          <button
            className="ghost"
            onClick={() => {
              const b = window.prompt('API base URL', base)
              if (b) setBase(b)
            }}
          >
            Config
          </button>
          <button
            className="ghost"
            onClick={() => {
              localStorage.removeItem('op-key')
              setKey('')
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="tabs">
        {(['drafts', 'platforms', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            className={'tab' + (tab === t ? ' active' : '')}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'drafts' && <Drafts api={api} toast={toast} />}
      {tab === 'platforms' && <Platforms api={api} toast={toast} />}
      {tab === 'history' && <History api={api} toast={toast} />}

      {msg && <div className="toast">{msg}</div>}
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
  const [k, setK] = React.useState('')
  return (
    <>
      <input
        type="password"
        placeholder="Admin key"
        value={k}
        onChange={(e) => setK(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && k && onKey(k)}
      />
      <input
        placeholder="API base URL"
        defaultValue={base}
        onBlur={(e) => setBase(e.target.value)}
      />
      <button onClick={() => k && onKey(k)} style={{ width: '100%' }}>
        Continue
      </button>
    </>
  )
}

function Drafts({ api, toast }: { api: Api; toast: (m: string) => void }) {
  const [md, setMd] = React.useState('')
  const [sel, setSel] = React.useState<Set<string>>(new Set())
  const [drafts, setDrafts] = React.useState<Draft[]>([])
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const d = (await api('/drafts')) as unknown as { drafts: Draft[] }
      setDrafts(d.drafts || [])
    } catch (e) {
      toast('load failed: ' + (e as Error).message)
    }
  }, [api, toast])

  React.useEffect(() => {
    load()
  }, [load])

  const title = () =>
    md
      .split('\n')
      .find((l) => l.startsWith('#'))
      ?.replace(/^#+\s*/, '')
      .trim() || undefined

  const tog = (p: string) => {
    const s = new Set(sel)
    if (s.has(p)) s.delete(p)
    else s.add(p)
    setSel(s)
  }

  const save = async () => {
    if (!md.trim()) return toast('write something first')
    setBusy(true)
    try {
      await api('/drafts', 'POST', { title: title(), content: md, platforms: [...sel] })
      toast('draft saved')
      load()
    } catch (e) {
      toast((e as Error).message)
    }
    setBusy(false)
  }

  const publish = async () => {
    if (!md.trim() || !sel.size) return toast('write + pick platforms')
    setBusy(true)
    try {
      const d = (await api('/drafts', 'POST', {
        title: title(),
        content: md,
        platforms: [...sel],
      })) as unknown as { id: string }
      await api('/publish', 'POST', { draftId: d.id })
      toast('queued for publish')
      load()
    } catch (e) {
      toast((e as Error).message)
    }
    setBusy(false)
  }

  const pub = async (id: string) => {
    try {
      await api('/publish', 'POST', { draftId: id })
      toast('queued')
    } catch (e) {
      toast((e as Error).message)
    }
  }

  const del = async (id: string) => {
    try {
      await api('/drafts/' + id, 'DELETE')
      load()
    } catch (e) {
      toast((e as Error).message)
    }
  }

  return (
    <div>
      <div className="card">
        <textarea
          placeholder={'# Title\n\nMarkdown content...'}
          value={md}
          onChange={(e) => setMd(e.target.value)}
        />
        <div className="chips">
          {PLATFORMS.map((p) => (
            <span
              key={p}
              className={'chip' + (sel.has(p) ? ' sel' : '')}
              onClick={() => tog(p)}
            >
              {p}
            </span>
          ))}
        </div>
        <button onClick={publish} disabled={busy}>
          Publish
        </button>{' '}
        <button className="ghost" onClick={save} disabled={busy}>
          Save Draft
        </button>
      </div>
      {drafts.length === 0 && <p className="muted">No drafts</p>}
      {drafts.map((d) => (
        <div className="card" key={d.id}>
          <h3>{d.title || 'Untitled'}</h3>
          <p>
            {d.platforms.join(', ')} · {d.status} ·{' '}
            {new Date(d.created_at).toLocaleDateString()}
          </p>
          <div className="row">
            <button className="ghost" onClick={() => setMd(d.content)}>
              Load
            </button>
            <button className="ghost" onClick={() => pub(d.id)}>
              Publish
            </button>
            <button className="ghost" onClick={() => del(d.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Platforms({ api, toast }: { api: Api; toast: (m: string) => void }) {
  const [configured, setConfigured] = React.useState<string[]>([])
  const [setup, setSetup] = React.useState<string | null>(null)
  const [json, setJson] = React.useState('')
  const [testing, setTesting] = React.useState<Record<string, string>>({})

  const load = React.useCallback(async () => {
    try {
      const d = (await api('/status')) as unknown as {
        platforms: { platform: string }[]
        available: string[]
      }
      setConfigured((d.platforms || []).map((p) => p.platform))
    } catch (e) {
      toast((e as Error).message)
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
      return toast('invalid JSON')
    }
    try {
      await api('/platforms/' + setup, 'POST', creds)
      toast('saved ' + setup)
      setSetup(null)
      setJson('')
      load()
    } catch (e) {
      toast((e as Error).message)
    }
  }

  const test = async (name: string) => {
    setTesting((t) => ({ ...t, [name]: 'testing' }))
    try {
      const r = (await api('/platforms/' + name + '/test', 'POST', {})) as unknown as {
        ok: boolean
        error?: string
      }
      setTesting((t) => ({ ...t, [name]: r.ok ? 'ok' : 'fail' }))
      if (!r.ok) toast(name + ' test failed' + (r.error ? ': ' + r.error : ''))
    } catch (e) {
      setTesting((t) => ({ ...t, [name]: 'fail' }))
      toast((e as Error).message)
    }
  }

  return (
    <div className="grid">
      {PLATFORMS.map((p) => {
        const ok = configured.includes(p)
        const t = testing[p]
        return (
          <div className="card" key={p}>
            <h3>{p}</h3>
            <div className="row">
              <span className={'badge ' + (ok ? 'ok' : 'off')}>
                {ok ? 'configured' : 'not configured'}
              </span>
              {t === 'ok' && <span className="badge ok">test ok</span>}
              {t === 'testing' && <span className="badge pending">testing</span>}
              {t === 'fail' && <span className="badge err">test failed</span>}
            </div>
            <div className="row">
              <button
                className="ghost"
                onClick={() => {
                  setSetup(p)
                  setJson(
                    '{\n' + CRED_KEYS[p].map((k) => `  "${k}": ""`).join(',\n') + '\n}',
                  )
                }}
              >
                Setup
              </button>
              <button className="ghost" onClick={() => test(p)}>
                Test
              </button>
            </div>
          </div>
        )
      })}
      {setup && (
        <div className="modal-bg" onClick={() => setSetup(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{setup} credentials</h3>
            <p className="hint">keys: {CRED_KEYS[setup].join(', ')}</p>
            <textarea
              className="short"
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
            <div className="actions">
              <button onClick={saveSetup}>Save</button>
              <button className="ghost" onClick={() => setSetup(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function History({ api, toast }: { api: Api; toast: (m: string) => void }) {
  const [rows, setRows] = React.useState<HistoryRow[]>([])

  const load = React.useCallback(async () => {
    try {
      const d = (await api('/history')) as unknown as { history: HistoryRow[] }
      setRows(d.history || [])
    } catch (e) {
      toast((e as Error).message)
    }
  }, [api, toast])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      {rows.length === 0 && <p className="muted">No publishes yet</p>}
      {rows.map((r, i) => (
        <div className="card" key={i}>
          <div className="row" style={{ marginTop: 0 }}>
            <strong style={{ fontSize: '0.85rem' }}>{r.platform}</strong>
            <span
              className={
                'badge ' +
                (r.status === 'success'
                  ? 'ok'
                  : r.status === 'pending'
                    ? 'pending'
                    : 'err')
              }
            >
              {r.status}
            </span>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem' }}
              >
                view
              </a>
            )}
          </div>
          <p>
            draft {r.draft_id.slice(0, 8)} · {new Date(r.created_at).toLocaleString()}
            {r.error ? ' · ' + r.error : ''}
          </p>
        </div>
      ))}
    </div>
  )
}
