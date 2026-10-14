import type { PlatformAdapter, PublishInput, PublishResult } from '../types'

function slugify(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const githubPages: PlatformAdapter = {
  name: 'github-pages',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    const repo = creds.repo // owner/name
    const dir = creds.dir || 'content/posts'
    const branch = creds.branch || 'main'
    const slug = slugify(input.title || 'post')
    const path = `${dir}/${slug}.md`
    const fm = [
      '---',
      `title: "${input.title.replace(/"/g, '\\"')}"`,
      `date: ${new Date().toISOString()}`,
      input.tags.length ? `tags: [${input.tags.map(t => `"${t}"`).join(', ')}]` : null,
      input.canonicalUrl ? `canonical: ${input.canonicalUrl}` : null,
      '---',
      '',
    ].filter(l => l !== null).join('\n')
    const content = btoa(unescape(encodeURIComponent(fm + input.markdown)))
    // check existing (update in place)
    let sha: string | undefined
    const cur = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `Bearer ${creds.token}`, 'User-Agent': 'openpost/1.0', Accept: 'application/vnd.github+json' },
    })
    if (cur.ok) sha = ((await cur.json()) as { sha: string }).sha
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${creds.token}`, 'User-Agent': 'openpost/1.0', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `post: ${input.title}`, content, branch, sha }),
    })
    if (!r.ok) throw new Error(`github ${r.status}: ${(await r.text()).slice(0, 300)}`)
    return { url: `https://github.com/${repo}/blob/${branch}/${path}` }
  },
  async test(creds) {
    const r = await fetch(`https://api.github.com/repos/${creds.repo}`, {
      headers: { Authorization: `Bearer ${creds.token}`, 'User-Agent': 'openpost/1.0' },
    })
    return r.ok
  },
}
