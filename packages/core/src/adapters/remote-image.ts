const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

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
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (!host || !host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || /^[\d.]+$/.test(host) || host.includes(':')) {
    throw new Error('image URL must use a public hostname')
  }
  return url
}

function isPublicIpv4(value: string): boolean {
  const octets = value.split('.').map(Number)
  if (octets.length !== 4 || octets.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [a, b, c] = octets
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 2 || (b === 88 && c === 99) || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && c === 113))
}

async function fetchNodeImage(url: URL): Promise<Response> {
  // Resolve and pin a public IPv4 address before connecting. Keeping the URL
  // hostname in the request preserves HTTP Host and TLS SNI while the lookup
  // callback prevents DNS rebinding between validation and connection.
  const dnsModule = 'node:dns/promises'
  const httpsModule = 'node:https'
  const dns = await import(dnsModule) as typeof import('node:dns/promises')
  const https = await import(httpsModule) as typeof import('node:https')
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true })
  const address = addresses.find((candidate: import('node:dns').LookupAddress) => candidate.family === 4 && isPublicIpv4(candidate.address))
  if (!address) throw new Error('image hostname must resolve to a public IPv4 address')

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    let total = 0
    const request = https.request(url.toString(), {
      agent: false,
      servername: url.hostname,
      lookup: ((
        _hostname: string,
        options: { all?: boolean },
        callback: (error: NodeJS.ErrnoException | null, address: string | Array<{ address: string; family: number }>, family?: number) => void,
      ) => {
        if (options.all) callback(null, [{ address: address.address, family: 4 }])
        else callback(null, address.address, 4)
      }) as import('node:net').LookupFunction,
      timeout: 20_000,
    }, response => {
      response.on('data', (chunk: Uint8Array) => {
        total += chunk.byteLength
        if (total > MAX_IMAGE_BYTES) {
          request.destroy(new Error('image exceeds the 5 MB upload limit'))
          return
        }
        chunks.push(chunk)
      })
      response.on('error', reject)
      response.on('end', () => {
        resolve(new Response(Buffer.concat(chunks), {
          status: response.statusCode ?? 502,
          headers: response.headers as HeadersInit,
        }))
      })
    })
    request.on('timeout', () => request.destroy(new Error('image download timed out')))
    request.on('error', reject)
    request.end()
  })
}

async function fetchImage(url: URL): Promise<Response> {
  const runtime = globalThis.process as (typeof process | undefined)
  if (runtime?.release?.name === 'node' && runtime.versions?.node) return fetchNodeImage(url)
  // Cloudflare Workers' outbound fetch proxy rejects requests to private and
  // local addresses; Node callers use the pinned DNS path above.
  return fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20_000) })
}

export async function fetchRemoteImage(value: string): Promise<RemoteImage> {
  let url = assertPublicHttpsUrl(value)
  let response: Response | undefined

  for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
    response = await fetchImage(url)
    if (!REDIRECT_STATUSES.has(response.status)) break
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
