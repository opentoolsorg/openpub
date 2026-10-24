import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Config, PlatformName, Creds } from './types'

// Read on each call so tests and subprocesses can point OPENPUB_HOME elsewhere
// after this module has already loaded.
export function openpubHome(): string {
  return process.env.OPENPUB_HOME || join(homedir(), '.openpub')
}

export function configPath(): string {
  return join(openpubHome(), 'config.json')
}

export function statePath(): string {
  return join(openpubHome(), 'state.json')
}

const REQUIRED_CREDS: Record<PlatformName, string[]> = {
  devto: ['api_key'],
  hashnode: ['token'],
  wordpress: ['site_url', 'username', 'app_password'],
  ghost: ['site_url', 'admin_key'],
  medium: ['integration_token'],
  substack: ['publication_url', 'connect_sid'],
  'github-pages': ['token', 'repo'],
  x: ['access_token'],
}

export function validateCreds(platform: PlatformName, value: unknown): Creds {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('credentials must be a JSON object of string values')
  }
  const creds: Creds = {}
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`credential "${key}" must be a non-empty string`)
    }
    creds[key] = item
  }
  for (const key of REQUIRED_CREDS[platform]) {
    if (!creds[key]) throw new Error(`${platform} credentials require "${key}"`)
  }
  return creds
}

// Validates first. Invalid JSON shapes never replace credentials that work.
export function storeCreds(platform: PlatformName, value: unknown): Creds {
  const creds = validateCreds(platform, value)
  setCreds(platform, creds)
  return creds
}

export function loadConfig(): Config {
  const path = configPath()
  if (!existsSync(path)) return { platforms: {} }
  try {
    const c = JSON.parse(readFileSync(path, 'utf8')) as Config
    return { platforms: c.platforms ?? {}, defaults: c.defaults }
  } catch (e) {
    throw new Error(`cannot parse ${path}: ${e instanceof Error ? e.message : e}`)
  }
}

export function saveConfig(c: Config): void {
  const home = openpubHome()
  mkdirSync(home, { recursive: true })
  writeFileSync(configPath(), JSON.stringify(c, null, 2) + '\n', { mode: 0o600 })
}

export function getCreds(platform: PlatformName): Creds | undefined {
  return loadConfig().platforms[platform]
}

export function setCreds(platform: PlatformName, creds: Creds): void {
  const c = loadConfig()
  c.platforms[platform] = creds
  saveConfig(c)
}

export function removeCreds(platform: PlatformName): void {
  const c = loadConfig()
  delete c.platforms[platform]
  saveConfig(c)
}

export function configuredPlatforms(): PlatformName[] {
  const c = loadConfig()
  return Object.keys(c.platforms) as PlatformName[]
}
