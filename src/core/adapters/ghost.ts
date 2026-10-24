import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { siteBase } from './guard'
import { assertPublishable } from '../limits'

function base64url(input: ArrayBuffer | string): string {
  const s = typeof input === 'string' ? btoa(input) : btoa(String.fromCharCode(...new Uint8Array(input)))
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function ghostJwt(key: string): Promise<string> {
  const [id, secret] = key.split(':')
  if (!id || !secret) throw new Error('ghost: key must be id:secret format')
  if (!/^[0-9a-f]+$/i.test(secret)) throw new Error('ghost: admin_key secret must be hex')
  const keyBytes = new Uint8Array((secret.match(/.{2}/g) ?? []).map(h => parseInt(h, 16)))
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id }))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }))
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`${header}.${payload}`))
  return `${header}.${payload}.${base64url(sig)}`
}

function base(creds: Record<string, string>): string {
  return siteBase(creds.site_url)
}

function postBody(input: PublishInput, updatedAt?: string) {
  return {
    ...(updatedAt ? { updated_at: updatedAt } : {}),
    title: input.title,
    html: input.html,
    status: input.status === 'published' ? 'published' : 'draft',
    tags: input.tags.slice(0, 10).map(t => ({ name: t })),
    feature_image: input.coverImage,
    canonical_url: input.canonicalUrl,
  }
}

export const ghost: PlatformAdapter = {
  name: 'ghost',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    assertPublishable('ghost', input)
    const id = input.remoteId
    if (id && !/^[A-Za-z0-9]+$/.test(id)) throw new Error('ghost: stored post id is not usable')
    const jwt = await ghostJwt(creds.admin_key)
    const headers = { Authorization: `Ghost ${jwt}`, 'Content-Type': 'application/json' }
    // Ghost rejects a PUT that omits the post's current updated_at.
    let updatedAt: string | undefined
    if (id) {
      const cur = await fetch(`${base(creds)}/ghost/api/admin/posts/${id}/`, { headers })
      if (!cur.ok) throw new Error(`ghost ${cur.status}: ${(await cur.text()).slice(0, 300)}`)
      const current = (await cur.json()) as { posts?: { updated_at?: string }[] }
      updatedAt = current.posts?.[0]?.updated_at
      if (!updatedAt) throw new Error('ghost: cannot update post without updated_at')
    }
    // source=html is required. Without it Ghost parses html as mobiledoc and content is empty.
    const path = id
      ? `/ghost/api/admin/posts/${id}/?source=html`
      : '/ghost/api/admin/posts/?source=html'
    const r = await fetch(`${base(creds)}${path}`, {
      method: id ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify({ posts: [postBody(input, updatedAt)] }),
    })
    if (!r.ok) throw new Error(`ghost ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j = (await r.json()) as { posts?: { url?: string; id?: string }[] }
    const p = j.posts?.[0]
    if (!p?.url || !p?.id) throw new Error('ghost: no post in response')
    return { url: p.url, id: p.id }
  },
  async test(creds) {
    try {
      const jwt = await ghostJwt(creds.admin_key)
      const r = await fetch(`${base(creds)}/ghost/api/admin/site/`, { headers: { Authorization: `Ghost ${jwt}` } })
      return r.ok
    } catch { return false }
  },
}
