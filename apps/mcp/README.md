# openpub-mcp

stdio MCP server for OpenPub. A thin surface over the local publishing engine in packages/core. Credentials stay in ~/.openpub/config.json. Transport is stdio only.

Requires Node 20 or newer.

## Install

From this repo:

    npm install
    npm run mcp:build

From npm, once published:

    npm install -g openpub-mcp

## Claude Code

Project config (.mcp.json):

    {
      "mcpServers": {
        "openpub": {
          "command": "node",
          "args": ["./apps/mcp/dist/index.js"]
        }
      }
    }

After a global install, use command openpub-mcp with an empty args array. User-level Claude Code config uses the same mcpServers.openpub shape.

## Tools

Each tool returns JSON. Unknown arguments are rejected, so `dry_run` does not silently publish. A publish report with any failed platform is returned with `isError: true`. Other failures come back as an error object rather than crashing the server.

### publish

Fan out a Markdown file.

Arguments:

- file (string, required)
- platforms (string array, optional)
- status (draft or published, optional; omitted means draft)
- canonical (string, optional)
- dryRun (boolean, optional)
- force (boolean, optional)

Returns a PublishReport: file, title, canonical, dryRun, outcomes.

Platform selection matches the core engine: tool platforms beats frontmatter platforms beats config defaults beats every configured platform.

### cross_publish

Write title and content to a temp .md file (with frontmatter), publish it, then delete the temp file.

Arguments:

- title (string, required)
- content (string, required)
- platforms (string array, optional)
- status (draft or published, optional; omitted means draft)

Returns a PublishReport.

### list_published

No arguments. Returns entries from ~/.openpub/state.json (content-hash ledger keyed by file::platform).

### setup

Store credentials, then verify them.

Arguments:

- platform (one of devto, hashnode, wordpress, ghost, medium, substack, github-pages, x)
- credentials (object of string values)

Returns ok true or ok false. Credentials are stored even when verification fails.

### status

No arguments. Returns platforms as an array of {platform, ok} for every configured platform.

### test_platform

Arguments: platform. Returns ok true or ok false.

### content_audit

Arguments: file. Returns score (number) and issues (string array) using the same scoring as the OpenPub CLI audit command (floor 20, minus 9 per issue).

### check_links

Arguments: file. Returns results as an array of {url, status, ok}. Unreachable URLs use status 0 and ok false.

### frontmatter

Rewrite the file in place via buildFrontmatter().

Arguments:

- file (string, required)
- format (one of openpub, hugo, jekyll, astro, nextjs, devto, hashnode, ghost)

Returns file and format.

### x_article

Publish to the x platform only.

Arguments:

- file (string, required)
- status (draft or published, optional; omitted means draft)

Returns a PublishReport.

## Platforms and credentials

Same shapes as the CLI. This server does not reimplement publishing, credential storage, frontmatter parsing, or hashing.

- devto: api_key
- hashnode: token, publication_id
- wordpress: site_url, username, app_password
- ghost: site_url, admin_key (id:secret)
- medium: integration_token
- substack: publication_url, connect_sid
- github-pages: token, repo (owner/name), dir (content/posts), branch (main)
- x: access_token (OAuth2 user token, tweet.write and media.write, X Premium required)

