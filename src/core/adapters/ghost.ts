import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { siteBase } from './guard'

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

export const ghost: PlatformAdapter = {
  name: 'ghost',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    const jwt = await ghostJwt(creds.admin_key)
    // source=html is critical — without it Ghost parses html as mobiledoc and content is empty
    const r = await fetch(`${base(creds)}/ghost/api/admin/posts/?source=html`, {
      method: 'POST',
      headers: { Authorization: `Ghost ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posts: [{
          title: input.title,
          html: input.html,
          status: input.status === 'published' ? 'published' : 'draft',
          tags: input.tags.slice(0, 10).map(t => ({ name: t })),
          feature_image: input.coverImage,
          canonical_url: input.canonicalUrl,
        }],
      }),
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
