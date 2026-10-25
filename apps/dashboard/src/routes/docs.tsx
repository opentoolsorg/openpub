import { createFileRoute } from '@tanstack/react-router'
import { DocsPage } from '@openpub/ui/docs-page'

export const Route = createFileRoute('/docs')({
  head: () => ({
    meta: [
      { title: 'Documentation - OpenPub' },
      {
        name: 'description',
        content:
          'OpenPub self-hosting deployment guide, platform setup matrix, CLI reference and MCP documentation.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600&display=swap',
      },
    ],
  }),
  component: DocsPageRoute,
})

function DocsPageRoute() {
  return <DocsPage />
}
