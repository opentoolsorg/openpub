import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

export function NotFound({ children }: { children?: ReactNode }) {
  return <div className="space-y-2 p-2" style={{ padding: 24 }}>
    <div style={{ color: 'var(--dim, #71717a)' }}>{children || <p>The page you are looking for does not exist.</p>}</div>
    <p className="flex items-center gap-2 flex-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
      <button type="button" onClick={() => window.history.back()} style={{ padding: '8px 12px', border: 0, borderRadius: 6, background: 'var(--accent, #34d399)', color: 'var(--mark-foreground, #022c22)', fontWeight: 700 }}>Go back</button>
      <Link to="/" style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--accent, #34d399)', color: 'var(--mark-foreground, #022c22)', fontWeight: 700 }}>Start Over</Link>
    </p>
  </div>
}
