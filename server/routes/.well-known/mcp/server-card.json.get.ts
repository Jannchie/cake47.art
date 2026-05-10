// MCP server card preview. Lets clients evaluate the server before opening a transport.
// Convention: https://modelcontextprotocol.io/
import { defineEventHandler, setResponseHeader } from 'h3'

const SITE_URL = 'https://cake47.art'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    name: 'cake47-portfolio',
    displayName: 'snowcake47 portfolio',
    description: 'Read-only MCP server exposing the public REST API of cake47.art (snowcake47 illustration portfolio) as agent tools.',
    version: '1.0.0',
    protocolVersion: '2025-06-18',
    serverUrl: `${SITE_URL}/mcp`,
    transport: 'streamable-http',
    documentationUrl: `${SITE_URL}/llms.txt`,
    contact: {
      url: 'https://x.com/snowcake47',
    },
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
    },
    tools: [
      {
        name: 'get_home_layout',
        description: 'Return the curated home page layout (hero, category showcases, selected list, carousel).',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'list_gallery',
        description: 'Return the gallery taxonomy: categories and series with localized names and artwork counts.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'list_artworks',
        description: 'List artworks, optionally filtered by categoryId or seriesId.',
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
      },
    ],
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
  }
})
