export interface Env {
  DB: D1Database
  KEYS: KVNamespace
  MEDIA: R2Bucket
  PUBLISH_QUEUE: Queue
  AI: Ai
  ADMIN_KEY: string
  BASE_URL: string
  DASHBOARD_URL?: string
}

export type PlatformName =
  | 'devto' | 'hashnode' | 'wordpress' | 'ghost'
  | 'medium' | 'substack' | 'github-pages' | 'x'

export interface PublishInput {
  title: string
  markdown: string
  html: string
  tags: string[]
  canonicalUrl?: string
  coverImage?: string
  status: 'draft' | 'published'
}

export interface PublishResult {
  url: string
  id?: string
}

export interface PlatformAdapter {
  name: PlatformName
  publish(input: PublishInput, creds: Record<string, string>): Promise<PublishResult>
  test(creds: Record<string, string>): Promise<boolean>
}

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
  status: 'pending' | 'success' | 'failed'
  url: string | null
  error: string | null
  attempts: number
  created_at: number
}
