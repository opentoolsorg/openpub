const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

export interface RemoteImage {
  bytes: Uint8Array
  contentType: string
}

function assertPublicHttpsUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('image URL must be an absolute HTTPS URL')
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('image URL must be HTTPS and must not contain credentials')
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || /^\d+(?:\.\d+){3}$/.test(host) || host.includes(':')) {
    throw new Error('image URL must use a public hostname')
  }
  return url
}

export async function fetchRemoteImage(value: string): Promise<RemoteImage> {
  let url = assertPublicHttpsUrl(value)
  let response: Response | undefined

  for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
    response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20_000) })
    if (![301, 302, 303, 307, 308].includes(response.status)) break
    const location = response.headers.get('location')
    if (!location || redirectCount === 3) throw new Error('image URL redirected too many times')
    url = assertPublicHttpsUrl(new URL(location, url).toString())
  }

  if (!response?.ok) throw new Error(`image download failed (${response?.status ?? 'no response'})`)
  const contentType = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase()
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error('image must be JPEG, PNG, GIF, or WebP')
  const length = Number(response.headers.get('content-length'))
  if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) throw new Error('image exceeds the 5 MB upload limit')
  if (!response.body) throw new Error('image response had no body')

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value: chunk } = await reader.read()
      if (done) break
      total += chunk.byteLength
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel()
        throw new Error('image exceeds the 5 MB upload limit')
      }
      chunks.push(chunk)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { bytes, contentType }
}

export function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}
