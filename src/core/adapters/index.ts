import type { PlatformAdapter, PlatformName } from '../types'
import { devto } from './devto'
import { hashnode } from './hashnode'
import { wordpress } from './wordpress'
import { ghost } from './ghost'
import { medium } from './medium'
import { substack } from './substack'
import { githubPages } from './github-pages'
import { x } from './x'

export const adapters: Record<PlatformName, PlatformAdapter> = {
  devto,
  hashnode,
  wordpress,
  ghost,
  medium,
  substack,
  'github-pages': githubPages,
  x,
}

export function getAdapter(name: PlatformName): PlatformAdapter | undefined {
  return adapters[name]
}
