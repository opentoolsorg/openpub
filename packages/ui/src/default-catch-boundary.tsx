import { ErrorComponent, Link, useLocation, useRouter, type ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useLocation({ select: location => location.pathname === '/' })
  return <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6" style={{ padding: 24 }}>
    <ErrorComponent error={error} />
    <div className="flex gap-2 items-center flex-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
      <button type="button" onClick={() => { void router.invalidate() }} style={{ padding: '8px 12px', border: 0, borderRadius: 6, background: 'var(--surface3, var(--card, #3f3f46))', color: 'var(--fg, #fafafa)', fontWeight: 700 }}>Try Again</button>
      {isRoot ? <Link to="/" style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--surface3, var(--card, #3f3f46))', color: 'var(--fg, #fafafa)', fontWeight: 700 }}>Home</Link> : <Link to="/" style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--surface3, var(--card, #3f3f46))', color: 'var(--fg, #fafafa)', fontWeight: 700 }} onClick={event => { event.preventDefault(); window.history.back() }}>Go Back</Link>}
    </div>
  </div>
}
