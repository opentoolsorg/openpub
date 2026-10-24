// Canonical URLs are copied onto every later platform. A draft, editor, or
// preview link must never leak out as that public address.
export function isPublicCanonicalUrl(raw: string | undefined | null): boolean {
  if (!raw) return false
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return false
  }
  if ((host === 'x.com' || host === 'twitter.com' || host === 'mobile.x.com') && url.pathname.startsWith('/compose')) {
    return false
  }
  if (url.pathname.includes('/publish/post/')) return false
  if (host === 'hashnode.com' && (url.pathname.startsWith('/draft') || url.pathname.startsWith('/edit'))) {
    return false
  }
  if (url.searchParams.has('preview') || url.searchParams.has('preview_nonce')) return false
  return true
}
