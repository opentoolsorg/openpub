import { createHash } from 'node:crypto'

// GitHub Contents API rejects a single path segment over 255 bytes. 80 Unicode
// characters stays under that even for CJK, and leaves room for a hash suffix.
const MAX_SLUG_CHARS = 80

export function shortHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12)
}

// Keep letters and numbers from any script. An empty result falls back to a
// hash so two punctuation-only titles cannot share content/posts/.md.
export function slugify(input: string, fallbackSeed = input): string {
  const folded = input.normalize('NFKD').replace(/\p{M}+/gu, '')
  let slug = folded.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
  const seed = fallbackSeed || input || 'post'
  if (!slug) slug = `post-${shortHash(seed).slice(0, 8)}`
  const chars = [...slug]
  if (chars.length > MAX_SLUG_CHARS) {
    const suffix = `-${shortHash(seed).slice(0, 8)}`
    const keep = MAX_SLUG_CHARS - [...suffix].length
    slug = chars.slice(0, Math.max(keep, 1)).join('').replace(/-+$/g, '') + suffix
  }
  return slug
}

export function tagSlug(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
