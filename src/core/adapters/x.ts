import type { PlatformAdapter, PublishInput, PublishResult } from '../types'

// X Articles API (v2). Two-step: create draft then publish.
// Auth: OAuth2 user-context Bearer token with tweet.write scope.
// Requires X Premium on the publishing account.
// Creds: { access_token }

type Block = { key?: string; text: string; type: string; entity_ranges?: { key: number; offset: number; length: number }[]; inline_style_ranges?: { style: string; offset: number; length: number }[] }
type Entity = { type: string; value?: { url?: string } }

// markdown -> X content_state (DraftJS-ish, snake_case).
// Handles headings, lists, quotes, code, bold/italic/links inline.
function toContentState(md: string) {
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
        ranges.push({ key: entities.length, offset: out.length, length: lt.length })
        entities.push({ type: 'LINK', value: { url: lu } })
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

  for (const line of md.split('\n')) {
    if (!line.trim()) continue
    let type = 'unstyled'
    let text = line
    if (/^#{1} /.test(line)) { type = 'header-one'; text = line.slice(2) }
    else if (/^#{2} /.test(line)) { type = 'header-two'; text = line.slice(3) }
    else if (/^#{3,} /.test(line)) { type = 'header-three'; text = line.replace(/^#+ /, '') }
    else if (/^[-*] /.test(line)) { type = 'unordered-list-item'; text = line.slice(2) }
    else if (/^\d+\. /.test(line)) { type = 'ordered-list-item'; text = line.replace(/^\d+\. /, '') }
    else if (/^> /.test(line)) { type = 'blockquote'; text = line.slice(2) }
    else if (/^```/.test(line)) continue // fence markers dropped; code lines stay unstyled
    const { text: t, styles, ranges } = inline(text)
    const blk: Block = { key: `b${k++}`, text: t, type }
    if (styles.length) blk.inline_style_ranges = styles
    if (ranges.length) blk.entity_ranges = ranges
    blocks.push(blk)
  }
  return { blocks, entityMap: entities.reduce((m, e, i) => ({ ...m, [i]: { type: e.type, mutability: 'MUTABLE', data: e.value ?? {} } }), {} as Record<number, unknown>) }
}

export const x: PlatformAdapter = {
  name: 'x',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    const token = creds.access_token
    if (!token) throw new Error('x: access_token required')
    const content_state = toContentState(input.markdown)
    const dr = await fetch('https://api.x.com/2/articles/draft', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input.title.slice(0, 250), content_state }),
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
