// Shared creds guards: creds are admin-set, but still don't let them point auth headers
// at plaintext or internal hosts.
export function siteBase(raw: string, { httpsOnly = true } = {}): string {
  let u: URL
  try { u = new URL(raw.startsWith('http') ? raw : `https://${raw}`) } catch { throw new Error('invalid site url') }
  if (httpsOnly && u.protocol !== 'https:') throw new Error('site url must be https')
  if (u.username || u.password) throw new Error('site url must not embed credentials')
  const h = u.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (h === 'localhost' || h === '::1' || h.endsWith('.internal') || h.endsWith('.local')) throw new Error('site url must be public')
  const v4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const [a, b] = v4.slice(1).map(Number)
    if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      throw new Error('site url must be public')
    }
  } else if (Number.isInteger(Number(h)) && Number(h) <= 0xffffffff) {
    throw new Error('site url must be public')
  }
  return u.origin + u.pathname.replace(/\/+$/, '')
}
