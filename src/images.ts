import { Hono } from 'hono'
import type { Env } from './types'

export const images = new Hono<{ Bindings: Env }>()

images.post('/generate', async (c) => {
  const { prompt, draftId } = await c.req.json<{ prompt: string; draftId?: string }>()
  if (!prompt) return c.json({ error: 'prompt required' }, 400)
  try {
    const res = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt })
    const b64 = (res as { image?: string }).image
    if (!b64) throw new Error('no image returned')
    const key = `covers/${crypto.randomUUID()}.png`
    await c.env.MEDIA.put(key, Uint8Array.from(atob(b64), ch => ch.charCodeAt(0)), { httpMetadata: { contentType: 'image/png' } })
    const url = `${c.env.BASE_URL}/api/images/${key}`
    if (draftId) await c.env.DB.prepare('UPDATE drafts SET cover_image = ? WHERE id = ?').bind(url, draftId).run()
    return c.json({ url })
  } catch (e) {
    // fallback: unsplash source
    const q = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '))
    return c.json({ url: `https://source.unsplash.com/1200x630/?${q}`, fallback: 'unsplash', warning: e instanceof Error ? e.message : 'AI gen failed' })
  }
})

images.get('/covers/:key{.+}', async (c) => {
  const obj = await c.env.MEDIA.get(`covers/${c.req.param('key')}`)
  if (!obj) return c.notFound()
  return new Response(obj.body, { headers: { 'Content-Type': 'image/png' } })
})
