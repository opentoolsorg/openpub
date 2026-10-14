import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Config, PlatformName, Creds } from './types'

export const HOME = process.env.OPENPUB_HOME || join(homedir(), '.openpub')
export const CONFIG_PATH = join(HOME, 'config.json')
export const STATE_PATH = join(HOME, 'state.json')

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return { platforms: {} }
  try {
    const c = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Config
    return { platforms: c.platforms ?? {}, defaults: c.defaults }
  } catch (e) {
    throw new Error(`cannot parse ${CONFIG_PATH}: ${e instanceof Error ? e.message : e}`)
  }
}

export function saveConfig(c: Config): void {
  mkdirSync(HOME, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2) + '\n', { mode: 0o600 })
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
