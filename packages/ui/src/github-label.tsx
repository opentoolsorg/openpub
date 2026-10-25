import { useEffect, useState } from 'react'

let starCount: Promise<number | null> | undefined

function loadStars() {
  return starCount ??= fetch('https://api.github.com/repos/princepal9120/openpub', {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(5000),
  }).then(async response => {
    if (!response.ok) return null
    const data = await response.json()
    return Number.isSafeInteger(data.stargazers_count) && data.stargazers_count >= 0 ? data.stargazers_count as number : null
  }).catch(() => null)
}

export function GitHubLabel({ label = 'GitHub' }: { label?: string }) {
  const [stars, setStars] = useState<number | null>(null)
  useEffect(() => {
    let mounted = true
    void loadStars().then(count => { if (mounted) setStars(count) })
    return () => { mounted = false }
  }, [])

  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.558 21.923c.563.104.768-.244.768-.542 0-.267-.01-.974-.015-1.912-3.13.68-3.791-1.508-3.791-1.508-.512-1.3-1.25-1.646-1.25-1.646-1.022-.699.078-.685.078-.685 1.13.08 1.725 1.16 1.725 1.16 1.005 1.722 2.637 1.225 3.278.937.102-.728.393-1.225.715-1.507-2.498-.284-5.125-1.249-5.125-5.562 0-1.229.439-2.234 1.16-3.022-.116-.285-.503-1.43.11-2.98 0 0 .945-.303 3.094 1.155A10.8 10.8 0 0 1 12 6.183c.956.004 1.919.129 2.819.378 2.148-1.458 3.092-1.155 3.092-1.155.615 1.55.228 2.695.112 2.98.722.788 1.158 1.793 1.158 3.022 0 4.324-2.631 5.275-5.137 5.553.404.348.765 1.034.765 2.084 0 1.505-.014 2.719-.014 3.088 0 .3.203.65.774.54A11.252 11.252 0 0 0 12 .75Z" /></svg>
    {label}
    {stars !== null && <span aria-label={`${stars.toLocaleString('en-US')} GitHub stars`} style={{ fontSize: '0.85em', opacity: 0.8 }}><span aria-hidden="true">☆ </span>{stars.toLocaleString('en-US')}</span>}
  </span>
}
