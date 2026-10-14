import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import type { State } from './types'
import { HOME, STATE_PATH } from './config'

export function hashContent(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 16)
}

export function loadState(): State {
  if (!existsSync(STATE_PATH)) return { published: {} }
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as State
  } catch {
    return { published: {} }
  }
}

export function saveState(s: State): void {
  mkdirSync(HOME, { recursive: true })
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 2) + '\n')
}

export function stateKey(file: string, platform: string): string {
  return `${file}::${platform}`
}
