import { createFileRoute } from '@tanstack/react-router'
import { DocsPage } from '@openpub/ui/docs-page'
import '../styles/docs.css'

export const Route = createFileRoute('/docs')({
  head: () => ({
    meta: [
      { title: 'Documentation - OpenPub' },
      {
        name: 'description',
        content: 'OpenPub self-hosting deployment guide, platform setup matrix, CLI reference and MCP documentation.',
      },
    ],
  }),
  component: () => <DocsPage dashboardHref="https://openpub.princslabs.workers.dev/app" />,
})
