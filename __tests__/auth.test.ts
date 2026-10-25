import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { api } from '../apps/worker/src/api'
import type { Env } from '../apps/worker/src/types'

function authEnv() {
  let settings: { id: number; password_salt: string; password_hash: string; password_iterations: number } | null = null
  const sessions = new Map<string, number>()
  const attempts = new Map<string, { count: number; started: number }>()
  const DB = {
    prepare(sql: string) {
      let args: unknown[] = []
      return {
        bind(...values: unknown[]) { args = values; return this },
        first: async () => {
          if (sql.includes('FROM auth_settings') && sql.includes('password_salt')) return settings
          if (sql.includes('FROM auth_settings')) return settings ? { id: 1 } : null
          if (sql.includes('FROM auth_sessions')) {
            const hash = args[0] as string
            const expires = sessions.get(hash)
            return expires && expires > Math.floor(Date.now() / 1000) ? { token_hash: hash } : null
          }
          if (sql.includes('INSERT INTO auth_login_attempts')) {
            const ipHash = args[0] as string
            const previous = attempts.get(ipHash)
            const now = Math.floor(Date.now() / 1000)
            const expired = !previous || previous.started <= now - (args[1] as number)
            if (!expired && previous.count >= (args[4] as number)) return null
            const attempt = expired ? { count: 1, started: now } : { count: previous.count + 1, started: previous.started }
            attempts.set(ipHash, attempt)
            return { attempts: attempt.count }
          }
          return null
        },
        all: async () => ({ results: [] }),
        run: async () => {
              if (sql.startsWith('INSERT INTO auth_settings')) {
                if (settings) return { meta: { changes: 0 } }
                settings = { id: 1, password_salt: args[0] as string, password_hash: args[1] as string, password_iterations: args[2] as number }
                return { meta: { changes: 1 } }
              }
              if (sql.startsWith('INSERT INTO auth_sessions')) {
                sessions.set(args[0] as string, Math.floor(Date.now() / 1000) + (args[1] as number))
              } else if (sql.startsWith('DELETE FROM auth_sessions WHERE token_hash')) {
                sessions.delete(args[0] as string)
              } else if (sql.includes('DELETE FROM auth_login_attempts')) {
                attempts.delete(args[0] as string)
              }
              return { meta: { changes: 1 } }
        },
      }
    },
  } as unknown as D1Database
  const env = { ADMIN_KEY: 'bootstrap-secret', DASHBOARD_URL: 'https://openpub.example', DB } as unknown as Env
  const app = new Hono().route('/api', api)
  const request = (path: string, method = 'GET', body?: unknown, cookie?: string, adminKey?: string, origin = 'https://openpub.example') => app.request(new URL(`/api${path}`, 'https://openpub.example').toString(), {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(adminKey ? { Authorization: `Bearer ${adminKey}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, env)
  return { request }
}

describe('dashboard password authentication', () => {
  it('requires the ADMIN_KEY to initialize a password and stores only a salted hash', async () => {
    const { request } = authEnv()
    expect(await (await request('/auth/status')).json()).toEqual({ setupRequired: true, authenticated: false })

    const rejected = await request('/auth/setup', 'POST', { adminKey: 'wrong', password: 'a long test password' })
    expect(rejected.status).toBe(401)

    const response = await request('/auth/setup', 'POST', { adminKey: 'bootstrap-secret', password: 'a long test password' })
    expect(response.status).toBe(200)
    expect((await request('/auth/setup', 'POST', { adminKey: 'bootstrap-secret', password: 'another long password' })).status).toBe(409)
    expect(response.headers.get('set-cookie')).toMatch(/HttpOnly/)
    expect(response.headers.get('set-cookie')).toMatch(/SameSite=Strict/)
    expect(response.headers.get('set-cookie')).toMatch(/Secure/)
    const setCookie = response.headers.get('set-cookie') || ''
    const cookie = setCookie.split(';')[0]
    const authStatus = await request('/auth/status', 'GET', undefined, cookie)
    expect((await authStatus.json() as { authenticated: boolean }).authenticated).toBe(true)

    const unauthenticated = await request('/status')
    expect(unauthenticated.status).toBe(401)
    expect((await request('/drafts', 'POST', { content: 'post', platforms: ['devto'] }, cookie, undefined, 'https://attacker.example')).status).toBe(403)
    const sessionAccess = await request('/status', 'GET', undefined, cookie)
    expect(sessionAccess.status).toBe(200)
  })

  it('limits repeated password failures for each source address', async () => {
    const { request } = authEnv()
    await request('/auth/setup', 'POST', { adminKey: 'bootstrap-secret', password: 'a long test password' })

    const wrong = await request('/auth/login', 'POST', { password: 'incorrect password' })
    expect(wrong.status).toBe(401)
    for (let i = 0; i < 9; i++) await request('/auth/login', 'POST', { password: 'incorrect password' })
    expect((await request('/auth/login', 'POST', { password: 'incorrect password' })).status).toBe(429)
    const loggedIn = await request('/auth/login', 'POST', { password: 'a long test password' })
    expect(loggedIn.status).toBe(429)
  })

  it('reserves login attempts before verifying concurrent passwords', async () => {
    const { request } = authEnv()
    await request('/auth/setup', 'POST', { adminKey: 'bootstrap-secret', password: 'a long test password' })
    const responses = await Promise.all(Array.from({ length: 20 }, () =>
      request('/auth/login', 'POST', { password: 'incorrect password' }),
    ))
    expect(responses.filter((response) => response.status === 401)).toHaveLength(10)
    expect(responses.filter((response) => response.status === 429)).toHaveLength(10)
  })

  it('rejects JSON values that are not request objects', async () => {
    const { request } = authEnv()
    for (const body of [null, [], 'password', 42]) {
      expect((await request('/auth/setup', 'POST', body)).status).toBe(400)
    }
    await request('/auth/setup', 'POST', { adminKey: 'bootstrap-secret', password: 'a long test password' })
    for (const body of [null, [], 'password', 42]) {
      expect((await request('/auth/login', 'POST', body)).status).toBe(400)
    }
  })

  it('logs in with the saved password, rejects wrong passwords, and revokes sessions on logout', async () => {
    const { request } = authEnv()
    await request('/auth/setup', 'POST', { adminKey: 'bootstrap-secret', password: 'a long test password' })
    const login = await request('/auth/login', 'POST', { password: 'a long test password' })
    expect(login.status).toBe(200)
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0]
    expect((await request('/status', 'GET', undefined, cookie)).status).toBe(200)

    const logout = await request('/auth/logout', 'POST', undefined, cookie)
    expect(logout.status).toBe(200)
    expect((await request('/status', 'GET', undefined, cookie)).status).toBe(401)
  })

  it('rejects a cross-origin first-time setup attempt', async () => {
    const { request } = authEnv()
    const response = await request('/auth/setup', 'POST', {
      adminKey: 'bootstrap-secret',
      password: 'a long test password',
    }, undefined, undefined, 'https://attacker.example')
    expect(response.status).toBe(403)
  })
})
