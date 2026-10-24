# MCP Setup

OpenPub exposes an MCP server over Streamable HTTP at `POST /mcp`. Stateless JSON mode: it answers `initialize`, `tools/list`, `tools/call`, `ping`, and ignores `notifications/*`. Auth is the same `ADMIN_KEY` as the REST API, sent as `Authorization: Bearer <ADMIN_KEY>`. Because `?key=` query authentication only works on GET requests, all MCP POST requests must use the `Authorization: Bearer` header.

Prerequisite: a deployed worker (see [DEPLOY.md](DEPLOY.md)) and your `ADMIN_KEY`.

Replace `https://openpub.<subdomain>.workers.dev` with your worker URL and `<ADMIN_KEY>` with your secret in every example below.

## Available tools

`publish`, `cross_publish`, `save_draft`, `list_drafts`, `get_draft`, `delete_draft`, `setup`, `status`, `test_platform`, `generate_cover`, `list_posts`, `check_links`, `frontmatter`.

Verify the endpoint before wiring a client:

```bash
curl -X POST https://openpub.<subdomain>.workers.dev/mcp \
  -H "Authorization: Bearer <ADMIN_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

A 401 means the key is wrong; a JSON-RPC response with the 13 tools means you are good.

## Claude Code

Use the built-in HTTP transport:

```bash
claude mcp add --transport http openpub \
  https://openpub.<subdomain>.workers.dev/mcp \
  --header "Authorization: Bearer <ADMIN_KEY>"
```

Equivalent `.mcp.json` (project-scoped) or `~/.claude.json` (user-scoped):

```json
{
  "mcpServers": {
    "openpub": {
      "type": "http",
      "url": "https://openpub.<subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <ADMIN_KEY>"
      }
    }
  }
}
```

Verify inside Claude Code: run `/mcp` and confirm `openpub` shows connected with its tools listed.

If your Claude Code version predates HTTP transport support, use `mcp-remote` as a stdio bridge:

```json
{
  "mcpServers": {
    "openpub": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://openpub.<subdomain>.workers.dev/mcp",
        "--header", "Authorization: Bearer <ADMIN_KEY>"
      ]
    }
  }
}
```

## Cursor

Cursor supports remote MCP servers natively. Edit `~/.cursor/mcp.json` (global) or `<project>/.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "openpub": {
      "url": "https://openpub.<subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <ADMIN_KEY>"
      }
    }
  }
}
```

Then: Settings, Cursor Settings, MCP. Toggle `openpub` on if it is not auto-enabled; it should show a green status dot and list tools. The `headers` block with `Authorization: Bearer <ADMIN_KEY>` is required because POST endpoints do not accept `?key=` query authentication.

## Windsurf

Windsurf MCP config lives at `~/.codeium/windsurf/mcp_config.json` (Cascade: Customize, MCP, or Command Palette, "Windsurf: Open MCP config").

Native HTTP where supported:

```json
{
  "mcpServers": {
    "openpub": {
      "serverUrl": "https://openpub.<subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <ADMIN_KEY>"
      }
    }
  }
}
```

Windsurf versions that only accept stdio servers need the `mcp-remote` bridge:

```json
{
  "mcpServers": {
    "openpub": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://openpub.<subdomain>.workers.dev/mcp",
        "--header", "Authorization: Bearer <ADMIN_KEY>"
      ]
    }
  }
}
```

After saving, reload Cascade (Command Palette, "Windsurf: Reload Window") so the server registers.

## Generic Streamable HTTP client

Any MCP client speaking Streamable HTTP can connect. Requirements:

- `POST https://openpub.<subdomain>.workers.dev/mcp`
- Header: `Authorization: Bearer <ADMIN_KEY>`
- Header: `Content-Type: application/json`
- Body: JSON-RPC 2.0, single object or batch array

Notes for client implementers:

- Responses are plain JSON-RPC (no SSE stream, no session id handshake). `Accept: application/json` is sufficient.
- `initialize` returns protocol version `2025-03-26`. `notifications/initialized` may be sent but is ignored; nothing breaks if omitted.
- Batched requests return a batched array of responses.
- `tools/call` results come back as `content: [{type: "text", text: "<json string>"}]`; parse the inner JSON for structured data.

Minimal raw session:

```bash
BASE=https://openpub.<subdomain>.workers.dev
KEY=<ADMIN_KEY>

# 1. initialize
curl -X POST $BASE/mcp -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0", "id": 1, "method": "initialize",
  "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "raw", "version": "0"}}
}'

# 2. list tools
curl -X POST $BASE/mcp -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0", "id": 2, "method": "tools/list"
}'

# 3. call status
curl -X POST $BASE/mcp -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0", "id": 3, "method": "tools/call",
  "params": {"name": "status", "arguments": {}}
}'
```

## Typical first session

Once connected, ask the agent (or call):

1. `setup` with `{platform: "devto", credentials: {api_key: "..."}}` for each platform (see [PLATFORMS.md](../../../docs/PLATFORMS.md) for exact keys).
2. `test_platform` per platform, expect `{ok: true}`.
3. `save_draft` with markdown content and platform list.
4. `cross_publish` with the returned `draftId`, or `publish` for a single platform.
5. `list_posts` to see per-platform URLs and failures; retry failures via `POST /api/history/<draftId>/<platform>/retry`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `401 unauthorized` | Wrong/missing `ADMIN_KEY`, or header name typo. Test with the curl above. |
| Tools not listed | Client never sent `tools/list`, or response blocked. Check client MCP logs. |
| `fetch failed` / ECONNRESET | Worker URL wrong, or client forcing SSE. OpenPub is POST-only JSON. |
| `method not found: notifications/...` | Harmless only if the client treats it as fatal; OpenPub skips `notifications/initialized` and `notifications/cancelled` silently. |
| `test_platform` returns `ok:false` | Credentials are stored but rejected by the platform. Re-check keys in PLATFORMS.md. |
