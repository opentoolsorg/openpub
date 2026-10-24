export { adapters, getAdapter } from '../core/adapters'
import { adapters } from '../core/adapters'
import type { PlatformName } from '../types'

export const platformNames = Object.keys(adapters) as PlatformName[]
