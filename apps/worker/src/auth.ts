import { Hono } from 'hono'
import type { Env } from './types'

const COOKIE = 'openpub_session'
const SESSION_SECONDS = 60 * 60 * 24 * 14
const PASSWORD_ITERATIONS = 310_000
const LOGIN_WINDOW_SECONDS = 15 * 60
const MAX_LOGIN_ATTEMPTS = 10
const encoder = new TextEncoder()

export const auth = new Hono<{ Bindings: Env }>()

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(value: string): Promise<string> {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
}

async function adminKeyMatches(provided: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)])
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return bytesToHex(new Uint8Array(bits))
}

function fromHex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function readCookie(request: Request): string | null {
  const value = request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))
  return value ? value.slice(COOKIE.length + 1) : null
}

export async function hasValidSession(db: D1Database, request: Request): Promise<boolean> {
  const token = readCookie(request)
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return false
  const tokenHash = await sha256(token)
  const session = await db.prepare(
    'SELECT token_hash FROM auth_sessions WHERE token_hash = ? AND expires_at > unixepoch()',
  ).bind(tokenHash).first<{ token_hash: string }>()
  return !!session
}

export function trustedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  const host = new URL(request.url).hostname
  if (origin === 'http://localhost:3000' && (host === 'localhost' || host === '127.0.0.1')) return true
  const allowed = env.DASHBOARD_URL || new URL(request.url).origin
  try { return new URL(origin).origin === new URL(allowed).origin } catch { return false }
}

function cookieValue(request: Request, token: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

async function createSession(db: D1Database, request: Request): Promise<{ token: string; cookie: string }> {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32))
  const token = toBase64Url(tokenBytes)
  const tokenHash = await sha256(token)
  await db.prepare('DELETE FROM auth_sessions WHERE expires_at <= unixepoch()').run()
  await db.prepare('INSERT INTO auth_sessions (token_hash, expires_at) VALUES (?, unixepoch() + ?)')
    .bind(tokenHash, SESSION_SECONDS).run()
  return { token, cookie: cookieValue(request, token, SESSION_SECONDS) }
}

function passwordInput(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 10 && value.length <= 1024 && !value.includes('\0')
}

auth.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
  c.header('Pragma', 'no-cache')
})

auth.get('/status', async (c) => {
  const configured = await c.env.DB.prepare('SELECT id FROM auth_settings WHERE id = 1').first<{ id: number }>()
  const authenticated = configured ? await hasValidSession(c.env.DB, c.req.raw) : false
  return c.json({ setupRequired: !configured, authenticated })
})

auth.post('/setup', async (c) => {
  if (!trustedOrigin(c.req.raw, c.env)) return c.json({ error: 'request origin not allowed' }, 403)
  if (!c.env.ADMIN_KEY) return c.json({ error: 'ADMIN_KEY is not configured on this Worker' }, 503)
  const configured = await c.env.DB.prepare('SELECT id FROM auth_settings WHERE id = 1').first<{ id: number }>()
  if (configured) return c.json({ error: 'password login is already set up' }, 409)

  let body: { adminKey?: unknown; password?: unknown }
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON body' }, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'invalid request body' }, 400)
  if (typeof body.adminKey !== 'string' || !(await adminKeyMatches(body.adminKey, c.env.ADMIN_KEY))) {
    return c.json({ error: 'Admin key did not match' }, 401)
  }
  if (!passwordInput(body.password)) return c.json({ error: 'Password must be 10–1024 characters' }, 400)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = bytesToHex(salt)
  const passwordHash = await derivePassword(body.password, salt, PASSWORD_ITERATIONS)
  const result = await c.env.DB.prepare(
    'INSERT INTO auth_settings (id, password_salt, password_hash, password_iterations) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
  ).bind(saltHex, passwordHash, PASSWORD_ITERATIONS).run()
  if (result.meta?.changes !== 1) return c.json({ error: 'password login was initialized by another request' }, 409)

  const session = await createSession(c.env.DB, c.req.raw)
  c.header('Set-Cookie', session.cookie)
  return c.json({ ok: true })
})

auth.post('/login', async (c) => {
  if (!trustedOrigin(c.req.raw, c.env)) return c.json({ error: 'request origin not allowed' }, 403)
  const settings = await c.env.DB.prepare(
    'SELECT password_salt, password_hash, password_iterations FROM auth_settings WHERE id = 1',
  ).first<{ password_salt: string; password_hash: string; password_iterations: number }>()
  if (!settings) return c.json({ error: 'password setup required' }, 409)

  let body: { password?: unknown }
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON body' }, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'invalid request body' }, 400)
  if (typeof body.password !== 'string' || body.password.length > 1024) return c.json({ error: 'Invalid password' }, 401)

  const clientIp = c.req.header('CF-Connecting-IP') || 'unknown'
  const ipHash = await sha256(clientIp)
  await c.env.DB.prepare('DELETE FROM auth_login_attempts WHERE window_started_at <= unixepoch() - ?')
    .bind(LOGIN_WINDOW_SECONDS).run()
  // Reserve before hashing so concurrent requests cannot bypass the attempt limit.
  const attempt = await c.env.DB.prepare(`
    INSERT INTO auth_login_attempts (ip_hash, attempts, window_started_at) VALUES (?, 1, unixepoch())
    ON CONFLICT(ip_hash) DO UPDATE SET
      attempts = CASE WHEN window_started_at <= unixepoch() - ? THEN 1 ELSE attempts + 1 END,
      window_started_at = CASE WHEN window_started_at <= unixepoch() - ? THEN unixepoch() ELSE window_started_at END
    WHERE window_started_at <= unixepoch() - ? OR attempts < ?
    RETURNING attempts
  `).bind(ipHash, LOGIN_WINDOW_SECONDS, LOGIN_WINDOW_SECONDS, LOGIN_WINDOW_SECONDS, MAX_LOGIN_ATTEMPTS).first<{ attempts: number }>()
  if (!attempt) {
    return c.json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429)
  }

  const passwordHash = await derivePassword(body.password, fromHex(settings.password_salt), settings.password_iterations)
  const left = encoder.encode(passwordHash)
  const right = encoder.encode(settings.password_hash)
  let mismatch = left.length ^ right.length
  for (let i = 0; i < Math.min(left.length, right.length); i++) mismatch |= left[i] ^ right[i]
  if (mismatch !== 0) return c.json({ error: 'Incorrect password' }, 401)

  await c.env.DB.prepare('DELETE FROM auth_login_attempts WHERE ip_hash = ?').bind(ipHash).run()
  const session = await createSession(c.env.DB, c.req.raw)
  c.header('Set-Cookie', session.cookie)
  return c.json({ ok: true })
})

auth.post('/logout', async (c) => {
  if (!trustedOrigin(c.req.raw, c.env)) return c.json({ error: 'request origin not allowed' }, 403)
  const token = readCookie(c.req.raw)
  if (token) await c.env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await sha256(token)).run()
  c.header('Set-Cookie', cookieValue(c.req.raw, '', 0))
  return c.json({ ok: true })
})
