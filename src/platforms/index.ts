import type { PlatformAdapter, PlatformName } from '../types'
import { devto } from './devto'
import { hashnode } from './hashnode'
import { wordpress } from './wordpress'
import { ghost } from './ghost'
import { medium } from './medium'
import { substack } from './substack'
import { githubPages } from './github-pages'

export const adapters: Record<PlatformName, PlatformAdapter> = {
  devto,
  hashnode,
  wordpress,
  ghost,
  medium,
  substack,
  'github-pages': githubPages,
}

export const platformNames = Object.keys(adapters) as PlatformName[]
