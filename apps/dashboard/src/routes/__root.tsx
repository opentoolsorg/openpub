/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import * as React from 'react'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OpenPub - Write once. Your agent ships it everywhere.' },
      {
        name: 'description',
        content:
          'Self-hosted cross-posting on Cloudflare. One markdown file to dev.to, Hashnode, Medium, Ghost, WordPress, Substack, X Articles, and your own site. MCP + CLI + REST.',
      },
      { property: 'og:title', content: 'OpenPub' },
      {
        property: 'og:description',
        content: 'One markdown file. Every platform. Driven by any agent over MCP.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'theme-color', content: '#0a0c0b' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('op-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.classList.toggle('light',t==='light')}catch(e){}`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
