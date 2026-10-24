import { Marked } from 'marked'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Preview is a local HTML file. Markdown still renders, but raw HTML in the
// source and the title must not execute.
const preview = new Marked()
preview.use({
  renderer: {
    html({ text }) {
      return escapeHtml(text)
    },
  },
})

export async function renderPreviewPage(title: string, markdown: string): Promise<string> {
  const html = await preview.parse(markdown)
  return `<!doctype html><html><head><meta charset="utf8"><title>${escapeHtml(title)}</title>
<style>body{max-width:42rem;margin:4rem auto;font-family:system-ui;line-height:1.7;padding:0 1rem}
pre{background:#f5f5f5;padding:1rem;overflow:auto}img{max-width:100%}</style></head><body>${html}</body></html>`
}
