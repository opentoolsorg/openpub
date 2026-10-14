---
title: "Hello World: Cross-Posting with openpost"
tags: ["openpost", "blogging", "automation"]
platforms: [devto, hashnode, github-pages]
status: published
---

This is a sample post for **openpost** — write once in markdown, publish
everywhere with a canonical URL pointing back to your own site.

## How it works

1. Save this file as a draft (`save_draft`).
2. Store platform credentials once (`setup`).
3. Publish to every platform in `platforms` (`cross_publish`).

## Markdown support

- **Bold**, *italic*, `inline code`
- Lists, links, images
- Fenced code blocks:

```ts
export function greet(name: string): string {
  return `hello, ${name}`
}
```

> Frontmatter `platforms` picks the targets. Omit it to publish everywhere
> configured. `status: draft` keeps posts unpublished on platforms that
> support drafts.
