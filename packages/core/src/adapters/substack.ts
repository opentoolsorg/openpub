import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { siteBase } from './guard'
import { assertPublishable } from '../limits'
import { UpdateUnsupportedError } from '../errors'
import { fetchRemoteImage, toBase64 } from './remote-image'
import { Lexer } from 'marked'
import { splitInlineMarkdownImages } from './markdown-images'

function base(creds: Record<string, string>): string {
  return siteBase(creds.publication_url)
}

async function uploadImage(url: string, creds: Record<string, string>) {
  const image = await fetchRemoteImage(url)
  const r = await fetch(`${base(creds)}/api/v1/image`, {
    method: 'POST',
    headers: {
      Cookie: `connect.sid=${creds.connect_sid}`,
      'Content-Type': 'application/json',
      'User-Agent': 'openpub/1.0',
    },
    body: JSON.stringify({ image: `data:${image.contentType};base64,${toBase64(image.bytes)}` }),
  })
  if (!r.ok) throw new Error(`substack image upload ${r.status}: ${(await r.text()).slice(0, 300)}`)
  const uploaded = (await r.json()) as {
    url?: string
    contentType?: string
    bytes?: number
    imageWidth?: number
    imageHeight?: number
  }
  if (!uploaded.url || !uploaded.url.startsWith('https://') || !uploaded.url.includes('substack-post-media.s3.amazonaws.com')) {
    throw new Error('substack image upload returned an unusable image URL')
  }
  if (!uploaded.imageWidth || !uploaded.imageHeight || !uploaded.bytes || !uploaded.contentType) {
    throw new Error('substack image upload returned incomplete image metadata')
  }
  return uploaded
}

async function toProseMirror(title: string, markdown: string, creds: Record<string, string>) {
  // Minimal ProseMirror doc: heading + paragraphs. Substack accepts this for drafts.
  const blocks: Record<string, unknown>[] = []
  for (const token of Lexer.lex(markdown)) {
    if (token.type === 'space') continue
    if (token.type === 'code') {
      blocks.push({ type: 'paragraph', content: [{ type: 'text', text: token.raw.trimEnd() }] })
      continue
    }
    const heading = token.type === 'heading'
    const source = heading ? token.text : token.raw.trim()
    let text = ''
    const flushText = () => {
      const value = text.replace(/\n/g, ' ').trim()
      if (value) blocks.push({ type: heading ? 'heading' : 'paragraph', ...(heading ? { attrs: { level: Math.min(token.depth, 3) } } : {}), content: [{ type: 'text', text: value }] })
      text = ''
    }
    for (const part of splitInlineMarkdownImages(source)) {
      if (part.type === 'text') {
        text += part.text
        continue
      }
      flushText()
      const uploaded = await uploadImage(part.url, creds)
      const imageNode = {
        type: 'image2',
        attrs: {
          src: uploaded.url,
          srcNoWatermark: null,
          fullscreen: null,
          imageSize: null,
          width: uploaded.imageWidth,
          height: uploaded.imageHeight,
          resizeWidth: null,
          bytes: uploaded.bytes,
          alt: part.alt || null,
          title: part.title,
          type: uploaded.contentType,
          href: null,
          belowTheFold: false,
          topImage: false,
          internalRedirect: null,
        },
      }
      const captionedImage: Record<string, unknown> = { type: 'captionedImage', content: [imageNode] }
      if (part.title) captionedImage.content = [imageNode, { type: 'caption', content: [{ type: 'text', text: part.title }] }]
      blocks.push(captionedImage)
    }
    flushText()
  }
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
        draft_body: await toProseMirror(input.title, input.markdown, creds),
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
