// Length caps the platform documents. Unknown platforms are not guessed.
const TITLE_MAX: Record<string, number> = {
  devto: 128,
  x: 250,
}

export function assertPublishable(platform: string, input: { title: string; markdown: string }): void {
  if (!input.title.trim()) throw new Error(`${platform}: title is empty`)
  if (!input.markdown.trim()) throw new Error(`${platform}: post body is empty`)
  const max = TITLE_MAX[platform]
  const length = [...input.title].length
  if (max !== undefined && length > max) {
    throw new Error(`${platform}: title is ${length} characters; the maximum is ${max}`)
  }
}
