import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { NotFound } from '@openpub/ui/not-found'
import { DefaultCatchBoundary } from '@openpub/ui/default-catch-boundary'
import stylesheet from '../styles/site.css?url'

const themeScript = `(function(){try{var t=localStorage.getItem('op-theme');var l=t==='light'||(!t&&matchMedia('(prefers-color-scheme: light)').matches);document.documentElement.classList.toggle('light',l);document.querySelector('meta[name="theme-color"]').content=l?'#fafaf9':'#0a0c0b'}catch{}})()`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OpenPub · Write once. Let your agent publish.' },
      { name: 'description', content: 'Publish one Markdown file to eight platforms. Open-source, local-first CLI and MCP server. Drafts by default, credentials on your machine.' },
      { name: 'theme-color', content: '#0a0c0b' },
    ],
    links: [
      { rel: 'stylesheet', href: stylesheet },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap' },
    ],
  }),
  component: Outlet,
  shellComponent: Document,
  notFoundComponent: () => <NotFound />,
  errorComponent: DefaultCatchBoundary,
})

function Document({ children }: { children: ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><HeadContent /><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><a className="skip" href="#main">Skip to content</a>{children}<Scripts /></body></html>
}
