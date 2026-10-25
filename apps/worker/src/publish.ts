import { preparePost, publishPost } from '@openpub/core'
import { adapters } from './platforms'
import * as db from './db'
import type { Env, PlatformName, PublishInput } from './types'
import { resolvePostMetadata } from '@openpub/core/post'
import { isPublicCanonicalUrl } from '@openpub/core/url'

function rid(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function enqueuePublish(env: Env, draftId: string, onlyPlatform?: PlatformName | PlatformName[]): Promise<string[]> {
  const draft = await db.getDraft(env.DB, draftId)
  if (!draft) throw new Error('draft not found')
  const jobs: PlatformName[] = []
  const want = new Set(draft.platforms as string[])
  const targets: PlatformName[] = onlyPlatform
    ? (Array.isArray(onlyPlatform) ? onlyPlatform : [onlyPlatform])
    : (draft.platforms as PlatformName[])
  for (const platform of targets) {
    if (!Object.prototype.hasOwnProperty.call(adapters, platform)) continue
    if (!want.has(platform)) throw new Error(`${platform} not in draft platforms`)
    const existing = await db.alreadyPublished(env.DB, draftId, platform)
    if (!existing) jobs.push(platform)
  }
  const newMarkers = new Set<PlatformName>()
  for (const platform of jobs) {
    if (await db.markPublishQueued(env.DB, rid(), draftId, platform)) newMarkers.add(platform)
  }
  if (jobs.length) await db.setDraftStatus(env.DB, draftId, 'queued')
  const sent: PlatformName[] = []
  try {
    for (const platform of jobs) {
      await env.PUBLISH_QUEUE.send({ draftId, platform })
      sent.push(platform)
    }
  } catch (error) {
    try {
      for (const platform of jobs) {
        if (!sent.includes(platform) && newMarkers.has(platform)) await db.clearQueuedPublish(env.DB, draftId, platform)
      }
      if (!sent.length) await db.setDraftStatus(env.DB, draftId, draft.status)
    } catch { /* preserve the queue error */ }
    throw error
  }
  return jobs
}

// 4xx = permanent: retrying won't help (bad creds, bad request). 5xx/network = transient.
const permanent = (e: unknown) =>
  e instanceof Error && (/missing draft or creds|not in draft platforms/.test(e.message) || /\b4\d{2}\b/.test(e.message))

// strip secrets: long tokens AND any configured credential values
const sanitize = (e: unknown, creds?: Record<string, string> | null) => {
  let s = (e instanceof Error ? e.message : String(e)).replace(/[A-Za-z0-9_\-]{24,}/g, '***')
  if (creds) for (const v of Object.values(creds)) if (v && v.length >= 6) s = s.split(v).join('***')
  return s.slice(0, 300)
}

export async function publishConsumer(batch: MessageBatch<{ draftId: string; platform: PlatformName }>, env: Env): Promise<void> {
  for (const msg of batch.messages) {
    const { draftId, platform } = msg.body
    try {
      // atomic claim: prevents double-publish on queue redelivery / concurrent triggers
      const claimed = await db.claimPublish(env.DB, rid(), draftId, platform)
      if (!claimed) { msg.ack(); continue }

      const draft = await db.getDraft(env.DB, draftId)
      if (draft && !(draft.platforms as string[]).includes(platform)) {
        await db.finishPublish(env.DB, draftId, platform, 'failed', undefined, 'platform no longer selected')
        await db.refreshDraftStatus(env.DB, draftId)
        msg.ack()
        continue
      }
      const creds = await db.getCreds(env.DB, platform)
      if (!draft || !creds) throw new Error(`missing draft or creds for ${platform}`)

      const metadata = resolvePostMetadata(draft.content, {
        title: draft.title,
        coverImage: draft.cover_image,
        canonicalUrl: draft.canonical_url,
        status: 'published',
        fallbackTitle: 'Untitled',
      })
      const input: PublishInput = await preparePost({
        title: metadata.title ?? 'Untitled',
        markdown: metadata.body,
        tags: metadata.tags.slice(0, 6),
        canonicalUrl: metadata.canonicalUrl,
        coverImage: metadata.coverImage,
        status: metadata.status ?? 'published',
      })
      const result = await publishPost(platform, input, creds)
      try {
        await db.finishPublish(env.DB, draftId, platform, 'success', result.url)
        if (!draft.canonical_url && isPublicCanonicalUrl(result.url)) await db.setCanonical(env.DB, draftId, result.url)
        await db.refreshDraftStatus(env.DB, draftId)
      } catch { /* post is live; log write failed — leave 'publishing' so a retry reports honestly */ }
      msg.ack()
    } catch (e) {
      const perm = permanent(e)
      const creds = await db.getCreds(env.DB, platform).catch(() => null)
      try {
        // transient -> 'retryable' so queue redelivery re-claims; permanent -> 'failed'
        await db.finishPublish(env.DB, draftId, platform, perm ? 'failed' : 'retryable', undefined, sanitize(e, creds))
        await db.refreshDraftStatus(env.DB, draftId)
      } catch { /* ignore log failure */ }
      if (perm) msg.ack() // don't burn retries on a request that will never succeed
      else msg.retry()
    }
  }
}
