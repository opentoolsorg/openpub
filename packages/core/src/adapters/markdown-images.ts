import { Lexer } from 'marked'

export type MarkdownImagePart =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; alt: string; title: string | null }

export function splitInlineMarkdownImages(source: string): MarkdownImagePart[] {
  const parts: MarkdownImagePart[] = []
  for (const token of Lexer.lexInline(source)) {
    if (token.type === 'image' && token.href.startsWith('https://')) {
      parts.push({ type: 'image', url: token.href, alt: token.text, title: token.title ?? null })
      continue
    }
    const raw = token.raw
    const previous = parts.at(-1)
    if (previous?.type === 'text') previous.text += raw
    else parts.push({ type: 'text', text: raw })
  }
  return parts
}
