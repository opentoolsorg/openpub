import * as React from 'react'

function currentTheme(): 'dark' | 'light' {
  return typeof document !== 'undefined' &&
    document.documentElement.classList.contains('light')
    ? 'light'
    : 'dark'
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = React.useState<'dark' | 'light'>(currentTheme)

  React.useEffect(() => setTheme(currentTheme()), [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('light', next === 'light')
    try {
      localStorage.setItem('op-theme', next)
    } catch {}
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta)
      meta.setAttribute('content', next === 'light' ? '#fafaf9' : '#0a0c0b')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-(--border) text-(--dim2) transition-colors hover:text-(--fg3) hover:border-(--surface4) ${className}`}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
