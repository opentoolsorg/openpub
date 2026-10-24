import type { PlatformAdapter, PublishInput, PublishResult } from '../types'
import { assertPublishable } from '../limits'
import { tagSlug } from '../slug'

const GQL = 'https://gql.hashnode.com'

async function gql(creds: Record<string, string>, query: string, variables: Record<string, unknown>) {
  const r = await fetch(GQL, {
    method: 'POST',
    headers: { Authorization: creds.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!r.ok) throw new Error(`hashnode http ${r.status}`)
  const j = (await r.json()) as { data?: any; errors?: { message: string }[] }
  if (j.errors?.length) throw new Error(`hashnode: ${j.errors[0].message}`)
  return j.data
}

async function publicationId(creds: Record<string, string>): Promise<string> {
  if (creds.publication_id) return creds.publication_id
  const data = await gql(creds, `query { me { publications(first: 1) { edges { node { id } } } } }`, {})
  const id = data?.me?.publications?.edges?.[0]?.node?.id
  if (!id) throw new Error('hashnode: no publication found for token')
  return id
}

function tags(input: PublishInput): { name: string; slug: string }[] {
  return input.tags.slice(0, 5).flatMap(name => {
    const slug = tagSlug(name)
    return slug ? [{ name, slug }] : []
  })
}

function fields(input: PublishInput, publicationId?: string): Record<string, unknown> {
  const list = tags(input)
  return {
    ...(publicationId ? { publicationId } : {}),
    title: input.title,
    contentMarkdown: input.markdown,
    ...(list.length ? { tags: list } : {}),
    ...(input.coverImage ? { coverImageOptions: { coverImageURL: input.coverImage } } : {}),
    ...(input.canonicalUrl ? { originalArticleURL: input.canonicalUrl } : {}),
  }
}

function draftUrl(id: string): string {
  return `https://hashnode.com/draft/${id}`
}

export const hashnode: PlatformAdapter = {
  name: 'hashnode',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    assertPublishable('hashnode', input)
    const remoteId = input.remoteId
    if (remoteId && !/^[A-Za-z0-9]+$/.test(remoteId)) throw new Error('hashnode: stored post id is not usable')

    // publishPost always goes live. Drafts use createDraft / updateDraft and
    // never fall back to publishPost. Hashnode gates those mutations on Pro;
    // a rejection is returned as an error instead of a live post.
    if (remoteId && (input.remoteStatus ?? 'published') === 'published') {
      if (input.status === 'draft') {
        throw new Error('hashnode: this post is already live and the API cannot turn it back into a draft')
      }
      const data = await gql(creds, `mutation UpdatePost($input: UpdatePostInput!) {
        updatePost(input: $input) { post { id url } }
      }`, { input: { id: remoteId, ...fields(input) } })
      const post = data?.updatePost?.post
      if (!post?.url || !post?.id) throw new Error('hashnode: update returned no post')
      return { url: post.url, id: post.id }
    }

    if (remoteId && input.remoteStatus === 'draft') {
      const updated = await gql(creds, `mutation UpdateDraft($input: UpdateDraftInput!) {
        updateDraft(input: $input) { draft { id } }
      }`, { input: { draftId: remoteId, ...fields(input) } })
      if (!updated?.updateDraft?.draft?.id) throw new Error('hashnode: draft update returned no draft')
      if (input.status === 'draft') return { url: draftUrl(remoteId), id: remoteId }
      const data = await gql(creds, `mutation PublishDraft($input: PublishDraftInput!) {
        publishDraft(input: $input) { post { id url } }
      }`, { input: { draftId: remoteId } })
      const post = data?.publishDraft?.post
      if (!post?.url || !post?.id) throw new Error('hashnode: publishing the draft returned no post')
      return { url: post.url, id: post.id }
    }

    const pubId = await publicationId(creds)
    if (input.status === 'draft') {
      try {
        const data = await gql(creds, `mutation CreateDraft($input: CreateDraftInput!) {
          createDraft(input: $input) { draft { id } }
        }`, { input: fields(input, pubId) })
        const id = data?.createDraft?.draft?.id
        if (!id) throw new Error('hashnode: draft was not created')
        return { url: draftUrl(id), id }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`${msg}. Hashnode draft was not created, and the post was not published live.`)
      }
    }

    const data = await gql(creds, `mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) { post { id url } }
    }`, { input: fields(input, pubId) })
    const post = data?.publishPost?.post
    if (!post?.url || !post?.id) throw new Error('hashnode: publish returned no post')
    return { url: post.url, id: post.id }
  },
  async test(creds) {
    try { await gql(creds, `query { me { id } }`, {}); return true } catch { return false }
  },
}
