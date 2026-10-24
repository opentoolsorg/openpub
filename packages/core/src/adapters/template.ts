// Copy this file, rename, implement, add to adapters/index.ts.
// Also add your platform name to the PlatformName union in src/types.ts.

import type { PlatformAdapter, PublishInput, PublishResult } from '../types'

const API = 'https://api.example.com'

// ---------------------------------------------------------------------------
// Auth. Pick the pattern your platform uses; `creds` holds whatever the user
// stored for this platform (see KEYS/credentials in src/api.ts).
// ---------------------------------------------------------------------------
//
// api-key header (dev.to style):
//   headers: { 'api-key': creds.api_key }
//
// Bearer token (most OAuth2 / PAT APIs):
//   headers: { Authorization: `Bearer ${creds.token}` }
//
// Basic auth (WordPress app passwords):
//   headers: { Authorization: `Basic ${btoa(`${creds.username}:${creds.password}`)}` }
//
// Session cookie:
//   headers: { Cookie: `session=${creds.session}` }
//
// Fail fast when a required credential is missing:
function requireCred(creds: Record<string, string>, key: string): string {
  const v = creds[key]
  if (!v) throw new Error(`template: missing credential '${key}'`)
  return v
}

// Normalize tags to what most platforms accept: lowercase alphanumeric,
// no spaces, capped count. Adjust regex/limit to your platform's rules.
function normalizeTags(tags: string[]): string[] {
  return tags
    .slice(0, 5)
    .map(t => t.replace(/[^a-z0-9]/gi, '').toLowerCase())
    .filter(Boolean)
}

/**
 * The exported adapter. `name` must match a member of the PlatformName
 * union in src/types.ts. Register it in src/platforms/index.ts.
 */
export const template: PlatformAdapter = {
  name: 'devto', // TODO: change to your PlatformName (e.g. 'ghost')

  /**
   * Publish a post to the platform.
   *
   * @param input - Normalized post data.
   *   - input.title / input.markdown / input.html: content (most APIs take
   *     either markdown or html — send whichever the platform prefers).
   *   - input.tags: raw user tags; run through normalizeTags() first.
   *   - input.canonicalUrl: pass through when set so cross-posts point back
   *     at the original (dev.to `canonical_url`, hashnode `originalArticleURL`).
   *     Map it to the platform's equivalent field; omit when undefined.
   *   - input.coverImage: public URL of the cover image, if any.
   *   - input.status: 'draft' | 'published' — map to the platform's flag.
   * @param creds - Platform credentials stored by the user.
   * @returns { url, id } — canonical URL of the post and platform object id.
   * @throws Error with `platform status: detail` on any failure; the caller
   *   records `error` in publish_log, so keep messages descriptive.
   */
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    const token = requireCred(creds, 'token')
    const r = await fetch(`${API}/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        body_markdown: input.markdown,
        published: input.status === 'published',
        tags: normalizeTags(input.tags),
        canonical_url: input.canonicalUrl,
        cover_image: input.coverImage,
      }),
    })
    if (!r.ok) throw new Error(`template ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const p = (await r.json()) as { url: string; id: string | number }
    if (!p.url) throw new Error('template: publish returned no url')
    return { url: p.url, id: String(p.id) }
  },

  /**
   * Validate credentials without publishing. Hit the cheapest authenticated
   * endpoint (me/profile/whoami). Return boolean — never throw.
   */
  async test(creds) {
    try {
      const token = requireCred(creds, 'token')
      const r = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      return r.ok
    } catch {
      return false
    }
  },
}
