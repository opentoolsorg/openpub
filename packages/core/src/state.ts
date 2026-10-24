import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import type { State } from './types'
import { openpubHome, statePath } from './config'

export function hashContent(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 16)
}

export function loadState(): State {
  const path = statePath()
  if (!existsSync(path)) return { published: {} }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as State
  } catch {
    return { published: {} }
  }
}

export function saveState(s: State): void {
  mkdirSync(openpubHome(), { recursive: true })
  writeFileSync(statePath(), JSON.stringify(s, null, 2) + '\n')
}

export function stateKey(file: string, platform: string): string {
  return `${file}::${platform}`
}
