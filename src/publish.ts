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
  const targets = onlyPlatform ? [onlyPlatform] : (draft.platforms as PlatformName[])
  for (const platform of targets) {
    if (!adapters[platform]) continue
    const existing = await db.alreadyPublished(env.DB, draftId, platform)
    if (existing) continue // idempotent
    await env.PUBLISH_QUEUE.send({ draftId, platform })
    jobs.push(platform)
  }
  if (jobs.length) await db.setDraftStatus(env.DB, draftId, 'queued')
  return jobs
}

async function refreshDraftStatus(db_: D1Database, draftId: string) {
  const { results } = await db_.prepare(
    `SELECT platform, status FROM publish_log WHERE draft_id = ?`).bind(draftId).all<{ platform: string; status: string }>()
  const draft = await db.getDraft(db_, draftId)
  if (!draft) return
  const total = (draft.platforms as string[]).length
  const done = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed').length
  if (done === total && total > 0) await db.setDraftStatus(db_, draftId, 'published')
  else if (done + failed === total && total > 0) await db.setDraftStatus(db_, draftId, 'partial')
}

export async function publishConsumer(batch: MessageBatch<{ draftId: string; platform: PlatformName }>, env: Env): Promise<void> {
  for (const msg of batch.messages) {
    const { draftId, platform } = msg.body
    try {
      const existing = await db.alreadyPublished(env.DB, draftId, platform)
      if (existing) { msg.ack(); continue }

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
        await db.upsertLog(env.DB, { id: rid(), draft_id: draftId, platform, status: 'success', url: result.url })
        if (!draft.canonical_url) await db.setCanonical(env.DB, draftId, result.url)
        await refreshDraftStatus(env.DB, draftId)
      } catch { /* log failure must not re-run publish */ }
      msg.ack()
    } catch (e) {
      try {
        await db.upsertLog(env.DB, {
          id: rid(), draft_id: draftId, platform,
          status: 'failed', error: e instanceof Error ? e.message.slice(0, 500) : String(e),
        })
        await refreshDraftStatus(env.DB, draftId)
      } catch { /* ignore log failure */ }
      msg.retry()
    }
  }
}

function extractTags(content: string): string[] {
  const m = content.match(/^---[\s\S]*?tags:\s*\[([^\]]*)\][\s\S]*?---/)
  if (!m) return []
  return m[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean).slice(0, 6)
}
