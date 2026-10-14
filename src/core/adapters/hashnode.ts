import type { PlatformAdapter, PublishInput, PublishResult } from '../types'

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

export const hashnode: PlatformAdapter = {
  name: 'hashnode',
  async publish(input: PublishInput, creds): Promise<PublishResult> {
    const pubId = await publicationId(creds)
    const data = await gql(creds, `mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) { post { id url } }
    }`, {
      input: {
        publicationId: pubId,
        title: input.title,
        contentMarkdown: input.markdown,
        tags: input.tags.slice(0, 5).map(t => ({ name: t })),
        coverImageOptions: input.coverImage ? { coverImageURL: input.coverImage } : undefined,
        originalArticleURL: input.canonicalUrl,
        publishAs: 'LIVE',
      },
    })
    const post = data?.publishPost?.post
    if (!post) throw new Error('hashnode: publish returned no post')
    return { url: post.url, id: post.id }
  },
  async test(creds) {
    try { await gql(creds, `query { me { id } }`, {}); return true } catch { return false }
  },
}
