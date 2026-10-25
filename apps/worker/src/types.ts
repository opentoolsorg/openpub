export interface Env {
  DB: D1Database
  KEYS: KVNamespace
  MEDIA: R2Bucket
  PUBLISH_QUEUE: Queue
  AI: Ai
  ASSETS: Fetcher
  ADMIN_KEY: string
  BASE_URL: string
  DASHBOARD_URL?: string
}

import type { PlatformName } from '@openpub/core/types'
export type { PlatformName, PublishInput, PublishResult, PlatformAdapter } from '@openpub/core/types'

export interface Draft {
  id: string
  title: string | null
  content: string
  platforms: string[]
  cover_image: string | null
  canonical_url: string | null
  status: 'draft' | 'queued' | 'published' | 'partial' | 'failed'
  created_at: number
}

export interface PublishLogRow {
  id: string
  draft_id: string
  platform: PlatformName
  status: 'pending' | 'queued' | 'publishing' | 'retryable' | 'success' | 'failed'
  url: string | null
  error: string | null
  attempts: number
  created_at: number
}
