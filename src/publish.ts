import { marked } from 'marked'
import { adapters } from './platforms'
import * as db from './db'
import type { Env, PlatformName, PublishInput } from './types'

function rid(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function enqueuePublish(env: Env, draftId: string, onlyPlatform?: PlatformName): Promise<string[]> {
  const draft = await db.getDraft(env.DB, draftId)
  if (!draft) throw new Error('draft not found')
  const jobs: string[] = []
  const want = new Set(draft.platforms as string[])
  const targets = onlyPlatform ? [onlyPlatform] : (draft.platforms as PlatformName[])
  for (const platform of targets) {
    if (!adapters[platform]) continue
    if (!want.has(platform)) throw new Error(`${platform} not in draft platforms`)
    const existing = await db.alreadyPublished(env.DB, draftId, platform)
    if (existing) continue // idempotent
    await env.PUBLISH_QUEUE.send({ draftId, platform })
    jobs.push(platform)
  }
  if (jobs.length) await db.setDraftStatus(env.DB, draftId, 'queued')
  return jobs
}

async function refreshDraftStatus(db_: D1Database, draftId: string) {
  const draft = await db.getDraft(db_, draftId)
  if (!draft) return
  const want = new Set(draft.platforms as string[])
  const { results } = await db_.prepare(
    `SELECT platform, status FROM publish_log WHERE draft_id = ?`).bind(draftId).all<{ platform: string; status: string }>()
  const total = want.size
  const done = results.filter(r => r.status === 'success' && want.has(r.platform)).length
  const failed = results.filter(r => r.status === 'failed' && want.has(r.platform)).length
  if (done === total && total > 0) await db.setDraftStatus(db_, draftId, 'published')
  else if (done + failed === total && total > 0) await db.setDraftStatus(db_, draftId, 'partial')
}

// 4xx = permanent: retrying won't help (bad creds, bad request). 5xx/network = transient.
export class HttpError extends Error {
  constructor(public status: number, msg: string) { super(msg) }
}
const permanent = (e: unknown) =>
  (e instanceof HttpError && e.status >= 400 && e.status < 500) ||
  (e instanceof Error && /missing draft or creds|not in draft platforms/.test(e.message))

const sanitize = (e: unknown) =>
  (e instanceof Error ? e.message : String(e))
    .replace(/[A-Za-z0-9_\-]{24,}/g, '***') // strip token-looking strings from upstream bodies
    .slice(0, 300)

export async function publishConsumer(batch: MessageBatch<{ draftId: string; platform: PlatformName }>, env: Env): Promise<void> {
  for (const msg of batch.messages) {
    const { draftId, platform } = msg.body
    try {
      // atomic claim: prevents double-publish on queue redelivery / concurrent triggers
      const claimed = await db.claimPublish(env.DB, rid(), draftId, platform)
      if (!claimed) { msg.ack(); continue }

      const draft = await db.getDraft(env.DB, draftId)
      const creds = await db.getCreds(env.DB, platform)
      if (!draft || !creds) throw new Error(`missing draft or creds for ${platform}`)

      const input: PublishInput = {
        title: draft.title ?? 'Untitled',
        markdown: draft.content,
        html: marked.parse(draft.content) as string,
        tags: extractTags(draft.content),
        canonicalUrl: draft.canonical_url ?? undefined,
        coverImage: draft.cover_image ?? undefined,
        status: 'published',
      }
      const result = await adapters[platform].publish(input, creds)
      try {
        await db.finishPublish(env.DB, draftId, platform, 'success', result.url)
        if (!draft.canonical_url) await db.setCanonical(env.DB, draftId, result.url)
        await refreshDraftStatus(env.DB, draftId)
      } catch { /* post is live; log write failed — leave 'publishing' so a retry reports honestly */ }
      msg.ack()
    } catch (e) {
      const perm = permanent(e)
      try {
        await db.finishPublish(env.DB, draftId, platform, 'failed', undefined, sanitize(e))
        await refreshDraftStatus(env.DB, draftId)
      } catch { /* ignore log failure */ }
      if (perm) msg.ack() // don't burn retries on a request that will never succeed
      else msg.retry()
    }
  }
}

function extractTags(content: string): string[] {
  const m = content.match(/^---[\s\S]*?tags:\s*\[([^\]]*)\][\s\S]*?---/)
  if (!m) return []
  return m[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean).slice(0, 6)
}
