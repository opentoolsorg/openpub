import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { assertPublishable } from '../limits'
import { UpdateUnsupportedError } from '../errors'
import { fetchRemoteImage, toBase64 } from './remote-image'

// X Articles API (v2). Two-step: create draft then publish.
// Auth: OAuth2 user-context Bearer token with tweet.write scope.
// Requires X Premium on the publishing account.
// Creds: { access_token }

type Block = { key?: string; text: string; type: string; entity_ranges?: { key: number; offset: number; length: number }[]; inline_style_ranges?: { style: string; offset: number; length: number }[] }
type Entity = { key: string; value: { data: Record<string, unknown> } }

// markdown -> X content_state (DraftJS-ish, snake_case).
// Handles headings, lists, quotes, code, bold/italic/links inline.
async function uploadImage(url: string, token: string): Promise<string> {
  const image = await fetchRemoteImage(url)
  const r = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ media: toBase64(image.bytes), media_category: 'tweet_image' }),
  })
  if (!r.ok) throw new Error(`x image upload ${r.status}: ${(await r.text()).slice(0, 300)}`)
  const result = (await r.json()) as { data?: { id?: string; media_id?: string }; media_id?: string }
  const id = result.data?.id ?? result.data?.media_id ?? result.media_id
  if (!id) throw new Error('x image upload returned no media id')
  return id
}

async function toContentState(md: string, token: string) {
  const blocks: Block[] = []
  const entities: Entity[] = []
  let k = 0
  const inline = (text: string): { text: string; styles: NonNullable<Block['inline_style_ranges']>; ranges: NonNullable<Block['entity_ranges']> } => {
    const styles: NonNullable<Block['inline_style_ranges']> = []
    const ranges: NonNullable<Block['entity_ranges']> = []
    let out = ''
    let i = 0
    const s = text
    while (i < s.length) {
      const rest = s.slice(i)
      const m = rest.match(/^(?:\[(.+?)\]\((https?:\/\/[^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|~~(.+?)~~)/)
      if (!m) { out += s[i]; i++; continue }
      const [full, lt, lu, b, it, code, strike] = m
      if (lt && lu) {
        const entityKey = entities.length
        ranges.push({ key: entityKey, offset: out.length, length: lt.length })
        entities.push({ key: String(entityKey), value: { data: { entity_key: 'LINK', url: lu } } })
        out += lt
      } else {
        const inner = b ?? it ?? code ?? strike ?? ''
        const style = b ? 'BOLD' : it ? 'ITALIC' : code ? 'CODE' : 'STRIKETHROUGH'
        styles.push({ style, offset: out.length, length: inner.length })
        out += inner
      }
      i += full.length
    }
    return { text: out, styles, ranges }
  }

  let inFence = false
  for (const line of md.split('\n')) {
    // Fence contents are literal. A leading `#` or `-` inside a code block
    // must not become a heading or a list item.
    if (/^```/.test(line.trim())) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      blocks.push({ key: `b${k++}`, text: line, type: 'code-block' })
      continue
    }
    if (!line.trim()) continue
    let type = 'unstyled'
    let text = line
    if (/^#{1} /.test(line)) { type = 'header-one'; text = line.slice(2) }
    else if (/^#{2} /.test(line)) { type = 'header-two'; text = line.slice(3) }
    else if (/^#{3,} /.test(line)) { type = 'header-three'; text = line.replace(/^#+ /, '') }
    else if (/^[-*] /.test(line)) { type = 'unordered-list-item'; text = line.slice(2) }
    else if (/^\d+\. /.test(line)) { type = 'ordered-list-item'; text = line.replace(/^\d+\. /, '') }
    else if (/^> /.test(line)) { type = 'blockquote'; text = line.slice(2) }
    const appendText = (part: string) => {
      if (!part) return
      const { text: t, styles, ranges } = inline(part)
      const blk: Block = { key: `b${k++}`, text: t, type }
      if (styles.length) blk.inline_style_ranges = styles
      if (ranges.length) blk.entity_ranges = ranges
      blocks.push(blk)
    }
    const imagePattern = /!\[([^\]]*)\]\((https:\/\/[^)\s]+)(?:\s+["']([^"']*)["'])?\)/g
    let cursor = 0
    let match: RegExpExecArray | null
    while ((match = imagePattern.exec(text))) {
      appendText(text.slice(cursor, match.index))
      const mediaId = await uploadImage(match[2], token)
      const entityKey = entities.length
      entities.push({
        key: String(entityKey),
        value: { data: { entity_key: 'IMAGE', caption: match[1], media_items: [{ media_category: 'tweet_image', media_id: mediaId }] } },
      })
      blocks.push({ key: `b${k++}`, text: ' ', type: 'atomic', entity_ranges: [{ key: entityKey, offset: 0, length: 1 }] })
      cursor = match.index + match[0].length
    }
    appendText(text.slice(cursor))
  }
  return { blocks, entities }
}

export const x: PlatformAdapter = {
  name: 'x',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    assertPublishable('x', input)
    const token = creds.access_token
    if (!token) throw new Error('x: access_token required')
    if (input.remoteId) {
      throw new UpdateUnsupportedError('x: the Articles API has no edit endpoint; skipped to avoid creating another draft or post')
    }
    const content_state = await toContentState(input.markdown, token)
    const dr = await fetch('https://api.x.com/2/articles/draft', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input.title, content_state }),
    })
    if (!dr.ok) throw new Error(`x draft ${dr.status}: ${(await dr.text()).slice(0, 300)}`)
    const dj = (await dr.json()) as { data?: { id?: string } }
    const draftId = dj.data?.id
    if (!draftId) throw new Error('x: no draft id returned')
    if (input.status === 'draft') return { url: `https://x.com/compose/articles/${draftId}`, id: draftId }
    const pr = await fetch(`https://api.x.com/2/articles/${draftId}/publish`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    })
    if (!pr.ok) throw new Error(`x publish ${pr.status}: ${(await pr.text()).slice(0, 300)}`)
    const pj = (await pr.json()) as { data?: { post_id?: string } }
    if (!pj.data?.post_id) throw new Error('x: no post_id returned')
    return { url: `https://x.com/i/articles/${pj.data.post_id}`, id: pj.data.post_id }
  },
  async test(creds) {
    if (!creds.access_token) return false
    try {
      const r = await fetch('https://api.x.com/2/users/me', { headers: { Authorization: `Bearer ${creds.access_token}` } })
      return r.ok
    } catch { return false }
  },
}
