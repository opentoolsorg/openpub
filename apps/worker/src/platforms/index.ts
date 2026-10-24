export { adapters, getAdapter } from '@openpub/core/adapters/index'
import { adapters } from '@openpub/core/adapters/index'
import type { PlatformName } from '../types'

export const platformNames = Object.keys(adapters) as PlatformName[]
