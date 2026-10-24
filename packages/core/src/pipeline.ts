import { marked } from 'marked'
import { adapters } from './adapters'
import { isPublicCanonicalUrl } from './url'
import type { Creds, PlatformName, PublishInput, PublishResult } from './types'

// Runtime-neutral: callers own credentials, persistence, retries and progress.
export async function preparePost(post: Omit<PublishInput, 'html'>): Promise<PublishInput> {
  if (!post.title.trim()) throw new Error('refusing to publish: title is empty')
  if (!post.markdown.trim()) throw new Error('refusing to publish: post body is empty')
  return {
    ...post,
    canonicalUrl: post.canonicalUrl && isPublicCanonicalUrl(post.canonicalUrl) ? post.canonicalUrl : undefined,
    html: await marked.parse(post.markdown),
  }
}

export async function publishPost(platform: PlatformName, post: PublishInput, creds: Creds): Promise<PublishResult> {
  if (!Object.prototype.hasOwnProperty.call(adapters, platform)) throw new Error('unknown platform')
  return adapters[platform].publish(post, creds)
}
