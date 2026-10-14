import type { PlatformAdapter, PublishInput, PublishResult } from '../types'

export const devto: PlatformAdapter = {
  name: 'devto',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    const r = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: { 'api-key': creds.api_key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article: {
          title: input.title,
          body_markdown: input.markdown,
          published: input.status === 'published',
          tags: input.tags.slice(0, 4).map(t => t.replace(/[^a-z0-9]/gi, '').toLowerCase()).filter(Boolean),
          canonical_url: input.canonicalUrl,
          main_image: input.coverImage,
        },
      }),
    })
    if (!r.ok) throw new Error(`devto ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const a = (await r.json()) as { url: string; id: number }
    return { url: a.url, id: String(a.id) }
  },
  async test(creds) {
    const r = await fetch('https://dev.to/api/articles/me?per_page=1', { headers: { 'api-key': creds.api_key } })
    return r.ok
  },
}
