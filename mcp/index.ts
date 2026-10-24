#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { TOOLS, callTool, toolResult } from './handlers'

const VERSION = '0.1.0'

const server = new Server(
  { name: 'openpub', version: VERSION },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

// Clients treat a thrown tool error as a transport failure, so every outcome stays JSON.
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const args = request.params.arguments
    const raw = args && typeof args === 'object' && !Array.isArray(args) ? args : {}
    const result = await callTool(request.params.name, raw as Record<string, unknown>)
    return toolResult(result)
  } catch (e) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
