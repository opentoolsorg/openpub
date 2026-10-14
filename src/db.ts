import type { Draft, PublishLogRow, PlatformName } from './types'

export async function getCreds(db: D1Database, platform: string): Promise<Record<string, string> | null> {
  const row = await db.prepare('SELECT credentials, enabled FROM platform_config WHERE platform = ?').bind(platform).first<{ credentials: string; enabled: number }>()
  if (!row || !row.enabled) return null
  try { return JSON.parse(row.credentials) } catch { return null }
}

export async function setCreds(db: D1Database, platform: string, creds: Record<string, string>) {
  await db.prepare('INSERT INTO platform_config (platform, credentials, enabled) VALUES (?, ?, 1) ON CONFLICT(platform) DO UPDATE SET credentials = excluded.credentials, enabled = 1')
    .bind(platform, JSON.stringify(creds)).run()
}

export async function createDraft(db: D1Database, d: { id: string; title?: string; content: string; platforms: string[]; cover_image?: string }) {
  await db.prepare('INSERT INTO drafts (id, title, content, platforms, cover_image) VALUES (?, ?, ?, ?, ?)')
    .bind(d.id, d.title ?? null, d.content, JSON.stringify(d.platforms), d.cover_image ?? null).run()
}

export async function getDraft(db: D1Database, id: string): Promise<Draft | null> {
  const row = await db.prepare('SELECT * FROM drafts WHERE id = ?').bind(id).first<Record<string, unknown>>()
  if (!row) return null
  let platforms: unknown = []
  try { platforms = JSON.parse((row.platforms as string) ?? '[]') } catch { /* corrupt row */ }
  return { ...row, platforms: Array.isArray(platforms) ? platforms : [] } as Draft
}

export async function listDrafts(db: D1Database): Promise<Draft[]> {
  const { results } = await db.prepare('SELECT * FROM drafts ORDER BY created_at DESC LIMIT 100').all<Record<string, unknown>>()
  return results.map(r => {
    let platforms: unknown = []
    try { platforms = JSON.parse((r.platforms as string) ?? '[]') } catch { /* corrupt row */ }
    return { ...r, platforms: Array.isArray(platforms) ? platforms : [] }
  }) as Draft[]
}

export async function deleteDraft(db: D1Database, id: string) {
  await db.prepare('DELETE FROM drafts WHERE id = ?').bind(id).run()
  await db.prepare('DELETE FROM publish_log WHERE draft_id = ?').bind(id).run()
}

export async function setDraftStatus(db: D1Database, id: string, status: string) {
  await db.prepare('UPDATE drafts SET status = ? WHERE id = ?').bind(status, id).run()
}

export async function setCanonical(db: D1Database, id: string, url: string) {
  await db.prepare('UPDATE drafts SET canonical_url = ? WHERE id = ? AND canonical_url IS NULL').bind(url, id).run()
}

export async function upsertLog(db: D1Database, l: { id: string; draft_id: string; platform: PlatformName; status: string; url?: string; error?: string }) {
  await db.prepare(`INSERT INTO publish_log (id, draft_id, platform, status, url, error, attempts)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(draft_id, platform) DO UPDATE SET status = excluded.status, url = excluded.url, error = excluded.error, attempts = publish_log.attempts + 1`)
    .bind(l.id, l.draft_id, l.platform, l.status, l.url ?? null, l.error ?? null).run()
}

// Atomic claim: one 'publishing' row per (draft,platform). Returns false if already
// claimed/succeeded — prevents duplicate platform POSTs on queue redelivery.
export async function claimPublish(db: D1Database, id: string, draftId: string, platform: string): Promise<boolean> {
  const r = await db.prepare(
    `INSERT OR IGNORE INTO publish_log (id, draft_id, platform, status, attempts) VALUES (?, ?, ?, 'publishing', 0)`)
    .bind(id, draftId, platform).run()
  if (r.meta.changes === 1) return true
  // row exists: re-claim only a stale 'publishing' claim (worker crashed mid-publish >5min ago);
  // 'success', 'failed', or a live claim all mean this redelivery is a dup
  const cur = await db.prepare('SELECT status, created_at FROM publish_log WHERE draft_id = ? AND platform = ?')
    .bind(draftId, platform).first<{ status: string; created_at: number }>()
  return cur?.status === 'publishing' && cur.created_at < Math.floor(Date.now() / 1000) - 300
}

export async function finishPublish(db: D1Database, draftId: string, platform: string, status: string, url?: string, error?: string) {
  await db.prepare(
    `UPDATE publish_log SET status = ?, url = ?, error = ?, attempts = attempts + 1 WHERE draft_id = ? AND platform = ?`)
    .bind(status, url ?? null, error ?? null, draftId, platform).run()
}

export async function alreadyPublished(db: D1Database, draftId: string, platform: string): Promise<string | null> {
  const row = await db.prepare("SELECT url FROM publish_log WHERE draft_id = ? AND platform = ? AND status = 'success'").bind(draftId, platform).first<{ url: string }>()
  return row?.url ?? null
}

export async function listHistory(db: D1Database): Promise<PublishLogRow[]> {
  const { results } = await db.prepare('SELECT * FROM publish_log ORDER BY created_at DESC LIMIT 200').all<PublishLogRow>()
  return results
}

export async function listConfiguredPlatforms(db: D1Database) {
  const { results } = await db.prepare('SELECT platform, enabled FROM platform_config').all<{ platform: string; enabled: number }>()
  return results
}
