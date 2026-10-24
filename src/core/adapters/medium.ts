import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { assertPublishable } from '../limits'
import { UpdateUnsupportedError } from '../errors'

async function userId(token: string): Promise<string> {
  const r = await fetch('https://api.medium.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(`medium /me ${r.status}`)
  const j = (await r.json()) as { data?: { id?: string } }
  if (!j.data?.id) throw new Error('medium /me: no user id in response')
  return j.data.id
}

export const medium: PlatformAdapter = {
  name: 'medium',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    assertPublishable('medium', input)
    if (input.remoteId) {
      throw new UpdateUnsupportedError('medium: the Medium API cannot edit an existing post; skipped to avoid publishing a duplicate')
    }
    const uid = await userId(creds.integration_token)
    const r = await fetch(`https://api.medium.com/v1/users/${uid}/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.integration_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        contentFormat: 'markdown',
        content: input.markdown,
        tags: input.tags.slice(0, 5),
        publishStatus: input.status === 'published' ? 'public' : 'draft',
        canonicalUrl: input.canonicalUrl,
      }),
    })
    if (!r.ok) throw new Error(`medium ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j = (await r.json()) as { data?: { url?: string; id?: string } }
    if (!j.data?.url || !j.data?.id) throw new Error('medium: no post in response')
    return { url: j.data.url, id: j.data.id }
  },
  async test(creds) {
    try { await userId(creds.integration_token); return true } catch { return false }
  },
}
