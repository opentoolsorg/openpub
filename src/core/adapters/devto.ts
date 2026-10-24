import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { assertPublishable } from '../limits'

// dev.to tags are lowercase letters and numbers. Map the symbols people
// actually write (`c++`, `c#`) to the tags the community already uses, and
// keep letters from other scripts instead of deleting them.
export function devtoTag(raw: string): string {
  const folded = raw.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase()
  const mapped = folded.replace(/\+\+/g, 'pp').replace(/#/g, 'sharp').replace(/\+/g, 'plus')
  return mapped.replace(/[^\p{L}\p{N}]+/gu, '')
}

export function devtoTags(tags: string[]): string[] {
  return tags.slice(0, 4).map(devtoTag).filter(Boolean)
}

export const devto: PlatformAdapter = {
  name: 'devto',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    assertPublishable('devto', input)
    const id = input.remoteId
    if (id && !/^\d+$/.test(id)) throw new Error('devto: stored article id is not usable')
    const r = await fetch(id ? `https://dev.to/api/articles/${id}` : 'https://dev.to/api/articles', {
      method: id ? 'PUT' : 'POST',
      headers: { 'api-key': creds.api_key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article: {
          title: input.title,
          body_markdown: input.markdown,
          published: input.status === 'published',
          tags: devtoTags(input.tags),
          canonical_url: input.canonicalUrl,
          main_image: input.coverImage,
        },
      }),
    })
    if (!r.ok) throw new Error(`devto ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const a = (await r.json()) as { url: string; id: number }
    return { url: a.url, id: String(a.id ?? id) }
  },
  async test(creds) {
    const r = await fetch('https://dev.to/api/articles/me?per_page=1', { headers: { 'api-key': creds.api_key } })
    return r.ok
  },
}
