// Minimal Model Context Protocol (MCP) endpoint over Streamable HTTP.
//
// Exposes the public read-only API (home layout, gallery taxonomy, artwork
// listing) as MCP tools so that Claude / ChatGPT-style agents can call them
// without scraping HTML.
//
// Spec references:
//   - https://modelcontextprotocol.io/specification (2025-06-18)
//   - JSON-RPC 2.0
//
// We implement:
//   - GET  /mcp                 → MCP server card (also linked from /.well-known/mcp/server-card.json)
//   - POST /mcp                 → JSON-RPC: initialize, tools/list, tools/call, ping
//   - DELETE /mcp               → no-op (no persistent session state)
//
// Tools are kept synchronous and stateless; each call dispatches to the
// existing internal handlers via $fetch.

import { defineEventHandler, readBody, setResponseHeader, setResponseStatus } from 'h3'
import { z } from 'zod'

const PROTOCOL_VERSION = '2025-06-18'
const SITE_URL = 'https://cake47.art'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: unknown
}

interface JsonRpcSuccess {
  jsonrpc: '2.0'
  id: string | number | null
  result: unknown
}

interface JsonRpcError {
  jsonrpc: '2.0'
  id: string | number | null
  error: { code: number, message: string, data?: unknown }
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError

const ListArtworksParams = z.object({
  categoryId: z.enum(['fan-works', 'original-oc', 'commercial-commission']).optional(),
  seriesId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})

interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  call: (args: unknown) => Promise<unknown>
}

const tools: ToolDefinition[] = [
  {
    name: 'get_home_layout',
    description: 'Return the curated home page layout (hero, category showcases, selected list, carousel).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    call: async () => $fetch('/api/home/layout'),
  },
  {
    name: 'list_gallery',
    description: 'Return the gallery taxonomy: categories and series with localized names and artwork counts.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    call: async () => $fetch('/api/gallery'),
  },
  {
    name: 'list_artworks',
    description: 'List artworks. Filter by categoryId or seriesId; paginate with limit + offset.',
    inputSchema: {
      type: 'object',
      properties: {
        categoryId: { type: 'string', enum: ['fan-works', 'original-oc', 'commercial-commission'] },
        seriesId: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        offset: { type: 'integer', minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
    call: async (raw) => {
      const params = ListArtworksParams.parse(raw ?? {})
      return $fetch('/api/gallery/artworks', { query: params })
    },
  },
]

function serverCard() {
  return {
    name: 'cake47-portfolio',
    displayName: 'snowcake47 portfolio',
    description: 'Read-only MCP server exposing the public REST API of cake47.art (snowcake47 illustration portfolio) as agent tools.',
    version: '1.0.0',
    protocolVersion: PROTOCOL_VERSION,
    serverUrl: `${SITE_URL}/mcp`,
    transport: 'streamable-http',
    documentationUrl: `${SITE_URL}/llms.txt`,
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
    },
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }
}

function rpcSuccess(id: string | number | null | undefined, result: unknown): JsonRpcSuccess {
  return { jsonrpc: '2.0', id: id ?? null, result }
}

function rpcError(id: string | number | null | undefined, code: number, message: string, data?: unknown): JsonRpcError {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, data } }
}

async function dispatch(req: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const { id, method, params } = req

  // Notifications (no id) get no response body.
  const isNotification = id === undefined || id === null

  switch (method) {
    case 'initialize': {
      return rpcSuccess(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          prompts: { listChanged: false },
        },
        serverInfo: { name: 'cake47-portfolio', version: '1.0.0' },
        instructions: 'Read /llms.txt for context. Use list_gallery to get the taxonomy, then list_artworks to drill into a series.',
      })
    }
    case 'notifications/initialized':
    case 'notifications/cancelled':
    case 'notifications/progress': {
      return null
    }
    case 'ping': {
      return rpcSuccess(id, {})
    }
    case 'tools/list': {
      return rpcSuccess(id, {
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      })
    }
    case 'tools/call': {
      const callParams = (params ?? {}) as { name?: string, arguments?: unknown }
      const tool = tools.find(t => t.name === callParams.name)
      if (!tool) {
        return rpcError(id, -32602, `Unknown tool: ${String(callParams.name)}`)
      }
      try {
        const result = await tool.call(callParams.arguments)
        return rpcSuccess(id, {
          content: [
            { type: 'text', text: JSON.stringify(result) },
          ],
          structuredContent: result,
          isError: false,
        })
      }
      catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return rpcSuccess(id, {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        })
      }
    }
    case 'resources/list': {
      return rpcSuccess(id, {
        resources: [
          {
            uri: `${SITE_URL}/llms.txt`,
            name: 'llms.txt',
            description: 'Plain-text agent index for the site.',
            mimeType: 'text/plain',
          },
          {
            uri: `${SITE_URL}/api/openapi.json`,
            name: 'openapi.json',
            description: 'OpenAPI 3.1 description of the public REST API.',
            mimeType: 'application/openapi+json',
          },
        ],
      })
    }
    case 'prompts/list': {
      return rpcSuccess(id, { prompts: [] })
    }
    default: {
      if (isNotification) {
        return null
      }
      return rpcError(id, -32601, `Method not found: ${method}`)
    }
  }
}

export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase()

  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, MCP-Session-Id, MCP-Protocol-Version')

  if (method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }

  if (method === 'GET') {
    setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    return serverCard()
  }

  if (method === 'DELETE') {
    setResponseStatus(event, 204)
    return ''
  }

  if (method !== 'POST') {
    setResponseStatus(event, 405)
    return rpcError(null, -32600, `Method not allowed: ${method}`)
  }

  let body: unknown
  try {
    body = await readBody(event)
  }
  catch {
    setResponseStatus(event, 400)
    setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    return rpcError(null, -32700, 'Parse error')
  }

  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')

  if (Array.isArray(body)) {
    const responses: JsonRpcResponse[] = []
    for (const entry of body) {
      const res = await dispatch(entry as JsonRpcRequest)
      if (res) {
        responses.push(res)
      }
    }
    return responses
  }

  if (!body || typeof body !== 'object') {
    return rpcError(null, -32600, 'Invalid Request')
  }

  const res = await dispatch(body as JsonRpcRequest)
  if (!res) {
    setResponseStatus(event, 204)
    return ''
  }
  return res
})
