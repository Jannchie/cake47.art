// RFC 9727 — API Catalog. Linkset format pointing at OpenAPI + service docs.
const SITE_URL = 'https://cake47.art'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    linkset: [
      {
        anchor: SITE_URL,
        'service-desc': [
          {
            href: `${SITE_URL}/api/openapi.json`,
            type: 'application/openapi+json',
            title: 'cake47.art public API (OpenAPI 3.1)',
          },
        ],
        'service-doc': [
          {
            href: `${SITE_URL}/llms.txt`,
            type: 'text/plain',
            title: 'llms.txt — agent index',
          },
          {
            href: `${SITE_URL}/api/llms.txt`,
            type: 'text/plain',
            title: 'API-scoped llms.txt',
          },
        ],
        'service-meta': [
          {
            href: `${SITE_URL}/.well-known/agent-card.json`,
            type: 'application/json',
            title: 'A2A Agent Card',
          },
          {
            href: `${SITE_URL}/.well-known/mcp/server-card.json`,
            type: 'application/json',
            title: 'MCP Server Card',
          },
          {
            href: `${SITE_URL}/.well-known/oauth-protected-resource`,
            type: 'application/json',
            title: 'OAuth Protected Resource Metadata (RFC 9728)',
          },
        ],
        item: [
          {
            href: `${SITE_URL}/api/home/layout`,
            title: 'Home layout',
            type: 'application/json',
          },
          {
            href: `${SITE_URL}/api/gallery`,
            title: 'Gallery taxonomy',
            type: 'application/json',
          },
          {
            href: `${SITE_URL}/api/gallery/artworks`,
            title: 'Artwork list',
            type: 'application/json',
          },
        ],
      },
    ],
  }
})
