import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { siteBase } from './guard'
import { assertPublishable } from '../limits'
import { UpdateUnsupportedError } from '../errors'

function base(creds: Record<string, string>): string {
  return siteBase(creds.publication_url)
}

function toProseMirror(title: string, markdown: string) {
  // Minimal ProseMirror doc: heading + paragraphs. Substack accepts this for drafts.
  const blocks = markdown.split(/\n{2,}/).filter(Boolean).map(p => {
    const m = p.match(/^(#{1,6})\s+(.*)/)
    if (m) return { type: 'heading', attrs: { level: Math.min(m[1].length, 3) }, content: [{ type: 'text', text: m[2] }] }
    return { type: 'paragraph', content: [{ type: 'text', text: p.replace(/\n/g, ' ') }] }
  })
  return { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: title }] }, ...blocks] }
}

async function cookieUserId(creds: Record<string, string>): Promise<string> {
  const r = await fetch(`${base(creds)}/api/v1/user/profile/self`, {
    headers: { Cookie: `connect.sid=${creds.connect_sid}`, 'User-Agent': 'openpub/1.0' },
  })
  if (!r.ok) throw new Error(`substack auth ${r.status}`)
  const j = (await r.json()) as { id: number }
  return String(j.id)
}

export const substack: PlatformAdapter = {
  name: 'substack',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    assertPublishable('substack', input)
    // Substack has no public API. Creating another draft on edit would fork
    // the post, and there is no documented update call to aim at the old id.
    if (input.remoteId) {
      throw new UpdateUnsupportedError('substack: drafts cannot be edited through the API; skipped to avoid creating another draft. Update the draft in the Substack dashboard.')
    }
    const uid = await cookieUserId(creds)
    const r = await fetch(`${base(creds)}/api/v1/drafts`, {
      method: 'POST',
      headers: {
        Cookie: `connect.sid=${creds.connect_sid}`,
        'Content-Type': 'application/json',
        'User-Agent': 'openpub/1.0',
      },
      body: JSON.stringify({
        draft_title: input.title,
        draft_subtitle: '',
        draft_body: toProseMirror(input.title, input.markdown),
        user_id: Number(uid),
        type: 'newsletter',
      }),
    })
    if (!r.ok) throw new Error(`substack draft ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const d = (await r.json()) as { id: number; slug?: string }
    return { url: `${base(creds)}/publish/post/${d.id}`, id: String(d.id) }
  },
  async test(creds) {
    try { await cookieUserId(creds); return true } catch { return false }
  },
}
