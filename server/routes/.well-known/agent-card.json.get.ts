// A2A (Agent-to-Agent) Agent Card.
// Spec: https://a2aproject.github.io/A2A/specification/
// Lives at /.well-known/agent-card.json so peer agents can discover this site's capabilities.
const SITE_URL = 'https://cake47.art'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    name: 'snowcake47-portfolio',
    displayName: 'snowcake47 / 私期 portfolio',
    description: 'Read-only access to snowcake47\'s illustration portfolio: fan works, original characters, and commercial commission samples.',
    version: '1.0.0',
    protocolVersion: '0.2.0',
    url: SITE_URL,
    documentationUrl: `${SITE_URL}/llms.txt`,
    serviceEndpoint: `${SITE_URL}/api`,
    iconUrl: `${SITE_URL}/api/files/brand/avatar.jpg`,
    provider: {
      organization: 'snowcake47',
      url: SITE_URL,
    },
    contact: {
      email: null,
      url: 'https://x.com/snowcake47',
    },
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ['application/json', 'text/plain'],
    defaultOutputModes: ['application/json', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'],
    skills: [
      {
        id: 'browse-portfolio',
        name: 'Browse portfolio',
        description: 'Fetch the curated home layout, categories, series, and artworks of snowcake47.',
        tags: ['illustration', 'portfolio', 'anime', 'fan-art', 'character-design'],
        examples: [
          'List all original characters by snowcake47.',
          'Show me snowcake47\'s commercial commission samples.',
          'Find Vocaloid fan art on cake47.art.',
        ],
        inputModes: ['text/plain'],
        outputModes: ['application/json'],
      },
      {
        id: 'fetch-artwork-image',
        name: 'Fetch artwork image',
        description: 'Resolve an artwork URL to its versioned image binary.',
        tags: ['image'],
        inputModes: ['text/plain'],
        outputModes: ['image/jpeg', 'image/png', 'image/webp'],
      },
    ],
    securitySchemes: {},
    security: [],
    additionalInterfaces: [
      {
        url: `${SITE_URL}/api/openapi.json`,
        transport: 'rest',
        description: 'OpenAPI 3.1 description of the public REST API.',
      },
      {
        url: `${SITE_URL}/.well-known/mcp/server-card.json`,
        transport: 'mcp',
        description: 'MCP server card.',
      },
    ],
  }
})
