import * as React from 'react'

// OpenPub mark: an "o" ring broken at top-right with an arrow launching out —
// publish outward. One accent, geometric, readable at 16px.
export function Mark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 5.6A10.5 10.5 0 1 0 27.5 13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20.5 5h7v7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark className="h-5 w-5 text-emerald-400" />
      <span className="font-mono text-base font-medium tracking-tight text-zinc-50">
        openpub
      </span>
    </span>
  )
}
