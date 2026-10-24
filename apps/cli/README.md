# OpenPub CLI

Write once, publish everywhere, from your terminal.

Publish one Markdown file to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, GitHub Pages, and X Articles. Credentials live in `~/.openpub/config.json` on your machine and go nowhere except the platform you are publishing to.

## Install

```bash
npm install -g openpub-cli
```

## Quick start

```bash
# Store credentials for a platform. They never leave your machine.
openpub setup devto '{"api_key": "dv1_..."}'

# See what is configured and reachable.
openpub status

# Publish. Platforms come from --to, or from the file's frontmatter.
openpub publish post.md --to devto,hashnode,github-pages
```

## Commands

| Command | What it does |
|---|---|
| `openpub setup <platform> '<json>'` | Store credentials for one platform |
| `openpub status` | Show configured platforms and whether they respond |
| `openpub publish <file.md>` | Fan out to every selected platform |
| `openpub preview <file.md>` | Render to HTML in `~/.openpub/preview/` |
| `openpub frontmatter <file.md> --format <f>` | Emit frontmatter for Hugo, Jekyll, Astro, Next.js, dev.to, Hashnode, or Ghost |
| `openpub audit <file.md>` | Score the post and list what is missing |
| `openpub check-links <file.md>` | Validate every URL in the post |
| `openpub forget <platform>` | Remove stored credentials |

`publish` flags: `--to a,b,c`, `--status draft|published`, `--canonical <url>`, `--dry-run`, `--force`.

Full docs: https://openpub.princslabs.workers.dev/docs

## License

MIT.
