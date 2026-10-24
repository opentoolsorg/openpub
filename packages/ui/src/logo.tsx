import type { SVGProps } from 'react'

export function Mark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true" {...props}>
      <rect x="1" y="1" width="26" height="26" rx="8" fill="currentColor" />
      <circle cx="9" cy="14" r="2.5" fill="var(--mark-foreground, #022c22)" />
      <path d="M11.5 14 20 8M11.5 14h8.5m-8.5 0L20 20" stroke="var(--mark-foreground, #022c22)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className = '', markClassName = '' }: { className?: string; markClassName?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Mark className={markClassName} style={{ width: 24, height: 24, color: 'var(--accent, #34d399)' }} />
      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--fg, #fafafa)' }}>OpenPub</span>
    </span>
  )
}
