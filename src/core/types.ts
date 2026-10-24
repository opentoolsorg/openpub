export type PlatformName =
  | 'devto' | 'hashnode' | 'wordpress' | 'ghost'
  | 'medium' | 'substack' | 'github-pages' | 'x'

export const PLATFORMS: PlatformName[] = [
  'devto', 'hashnode', 'wordpress', 'ghost',
  'medium', 'substack', 'github-pages', 'x',
]

export interface PublishInput {
  title: string
  markdown: string
  html: string
  tags: string[]
  canonicalUrl?: string
  coverImage?: string
  status: 'draft' | 'published'
  // Set when this file was already published. Adapters update that remote
  // object instead of creating another one.
  remoteId?: string
  remoteStatus?: 'draft' | 'published'
  slug?: string
}

export interface PublishResult {
  url: string
  id?: string
}

export type Creds = Record<string, string>

export interface PlatformAdapter {
  name: PlatformName
  publish(input: PublishInput, creds: Creds): Promise<PublishResult>
  test(creds: Creds): Promise<boolean>
}

export interface Defaults {
  platforms?: PlatformName[]
  status?: 'draft' | 'published'
}

export interface Config {
  platforms: Partial<Record<PlatformName, Creds>>
  defaults?: Defaults
}

export interface Frontmatter {
  title?: string
  tags: string[]
  platforms?: PlatformName[]
  canonical_url?: string
  slug?: string
  description?: string
  cover_image?: string
  status?: 'draft' | 'published'
  primary?: PlatformName
  raw: Record<string, unknown>
}

export interface PublishOutcome {
  platform: PlatformName
  ok: boolean
  url?: string
  error?: string
  skipped?: boolean
  warning?: string
}

export interface PublishReport {
  file: string
  title: string
  canonical?: string
  dryRun: boolean
  outcomes: PublishOutcome[]
  warnings?: string[]
}

export interface StateEntry {
  hash: string
  url: string
  at: number
  id?: string
  remoteStatus?: 'draft' | 'published'
}

export interface State {
  published: Record<string, StateEntry>
}
