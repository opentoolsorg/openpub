import type { PlatformAdapter, PublishInput, PublishResult } from '../types'

function base(creds: Record<string, string>): string {
  return creds.site_url.replace(/\/+$/, '')
}

function auth(creds: Record<string, string>): string {
  return 'Basic ' + btoa(`${creds.username}:${creds.app_password}`)
}

export const wordpress: PlatformAdapter = {
  name: 'wordpress',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    const r = await fetch(`${base(creds)}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: { Authorization: auth(creds), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        content: input.html,
        status: input.status === 'published' ? 'publish' : 'draft',
        tags: input.tags.slice(0, 10),
        meta: input.canonicalUrl ? { canonical_url: input.canonicalUrl } : undefined,
      }),
    })
    if (!r.ok) throw new Error(`wordpress ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const p = (await r.json()) as { link: string; id: number }
    return { url: p.link, id: String(p.id) }
  },
  async test(creds) {
    const r = await fetch(`${base(creds)}/wp-json/wp/v2/users/me`, { headers: { Authorization: auth(creds) } })
    return r.ok
  },
}
