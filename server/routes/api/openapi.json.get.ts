// OpenAPI 3.1 description of the public read-only API.
// Served at /api/openapi.json with Content-Type: application/openapi+json
// (also accepted as application/json by tools that don't yet recognise the
// dedicated media type).
const SITE_URL = 'https://cake47.art'

const LOCALIZED_TEXT_SCHEMA = {
  type: 'object',
  description: 'Localised text. Pick the locale matching the user\'s request; fall back to English.',
  properties: {
    'zh-CN': { type: 'string' },
    'en': { type: 'string' },
    'ja': { type: 'string' },
  },
  required: ['en'],
} as const

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/openapi+json')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    openapi: '3.1.0',
    info: {
      title: 'cake47.art public API',
      version: '1.0.0',
      summary: 'Read-only HTTP API for the snowcake47 / 私期 illustration portfolio.',
      description: 'No authentication is required for any of the endpoints listed here. Admin endpoints under /api/admin/* are private and are intentionally not described in this document.',
      contact: {
        name: 'snowcake47',
        url: 'https://x.com/snowcake47',
      },
      license: {
        name: 'All rights reserved (artwork). API metadata is public.',
        url: 'https://cake47.art/llms.txt',
      },
    },
    servers: [
      { url: SITE_URL, description: 'Production' },
    ],
    externalDocs: {
      description: 'Agent index (llms.txt)',
      url: `${SITE_URL}/llms.txt`,
    },
    tags: [
      { name: 'home', description: 'Curated home page slots.' },
      { name: 'gallery', description: 'Gallery taxonomy and artwork listings.' },
      { name: 'files', description: 'Versioned image binaries.' },
    ],
    paths: {
      '/api/home/layout': {
        get: {
          tags: ['home'],
          summary: 'Get curated home page layout.',
          description: 'Returns the hero feature, per-category showcases, the manually curated "selected" list, and the carousel.',
          operationId: 'getHomeLayout',
          responses: {
            200: {
              description: 'Layout payload.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HomeLayout' },
                },
              },
            },
          },
        },
      },
      '/api/gallery': {
        get: {
          tags: ['gallery'],
          summary: 'Get gallery taxonomy.',
          description: 'Returns the three fixed categories and the series taxonomy, including artwork counts per series.',
          operationId: 'getGalleryTaxonomy',
          responses: {
            200: {
              description: 'Gallery taxonomy.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GalleryTaxonomy' },
                },
              },
            },
          },
        },
      },
      '/api/gallery/artworks': {
        get: {
          tags: ['gallery'],
          summary: 'List artworks.',
          description: 'List artworks. Filter by category or series; paginate with limit + offset.',
          operationId: 'listArtworks',
          parameters: [
            {
              name: 'categoryId',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['fan-works', 'original-oc', 'commercial-commission'] },
            },
            {
              name: 'seriesId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            },
            {
              name: 'offset',
              in: 'query',
              required: false,
              schema: { type: 'integer', minimum: 0, default: 0 },
            },
          ],
          responses: {
            200: {
              description: 'Paginated artwork list.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ArtworkPage' },
                },
              },
            },
          },
        },
      },
      '/api/files/{path}': {
        get: {
          tags: ['files'],
          summary: 'Fetch image binary.',
          description: 'Streams the image binary identified by the path. URLs are versioned via ?v=<bytes> for cache busting.',
          operationId: 'getFile',
          parameters: [
            {
              name: 'path',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Object path under the blob store, e.g. gallery/snowcake47/anime-fanart/...',
            },
            {
              name: 'v',
              in: 'query',
              required: false,
              schema: { type: 'integer' },
              description: 'Cache-busting version token (size in bytes).',
            },
          ],
          responses: {
            200: {
              description: 'Image binary.',
              content: {
                'image/jpeg': {},
                'image/png': {},
                'image/webp': {},
              },
            },
            404: { $ref: '#/components/responses/Error' },
          },
        },
      },
    },
    components: {
      schemas: {
        LocalizedText: LOCALIZED_TEXT_SCHEMA,
        Slot: {
          type: 'object',
          required: ['url', 'categoryId'],
          properties: {
            url: { type: 'string', format: 'uri', description: 'Versioned URL of the artwork image.' },
            categoryId: { type: 'string', enum: ['fan-works', 'original-oc', 'commercial-commission'] },
            seriesNameZh: { type: 'string' },
            seriesNameEn: { type: 'string' },
            seriesNameJa: { type: 'string' },
            titleZh: { type: 'string' },
            titleEn: { type: 'string' },
            titleJa: { type: 'string' },
            objectPosition: { type: 'string', nullable: true, description: 'CSS object-position value used when cropping.' },
            thumbHash: { type: 'string', nullable: true, description: 'Base64-encoded ThumbHash blur-up placeholder.' },
          },
        },
        HomeLayout: {
          type: 'object',
          required: ['slots', 'selected'],
          properties: {
            slots: {
              type: 'object',
              additionalProperties: { $ref: '#/components/schemas/Slot' },
              description: 'Map of slot key → slot payload. Keys include "hero", "category.<id>", "ekac.<index>".',
            },
            selected: {
              type: 'array',
              items: { $ref: '#/components/schemas/Slot' },
            },
            carousel: {
              type: 'array',
              items: { $ref: '#/components/schemas/Slot' },
            },
          },
        },
        Category: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
            sortOrder: { type: 'integer' },
            nameZh: { type: 'string' },
            nameEn: { type: 'string' },
            nameJa: { type: 'string' },
          },
        },
        Series: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            categoryId: { type: 'string' },
            nameZh: { type: 'string' },
            nameEn: { type: 'string' },
            nameJa: { type: 'string' },
            descriptionZh: { type: 'string', nullable: true },
            descriptionEn: { type: 'string', nullable: true },
            descriptionJa: { type: 'string', nullable: true },
            artworkCount: { type: 'integer', minimum: 0 },
            coverUrl: { type: 'string', nullable: true, format: 'uri' },
            coverThumbHash: { type: 'string', nullable: true },
          },
        },
        GalleryTaxonomy: {
          type: 'object',
          required: ['categories', 'series'],
          properties: {
            categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            series: { type: 'array', items: { $ref: '#/components/schemas/Series' } },
          },
        },
        Artwork: {
          type: 'object',
          required: ['id', 'url'],
          properties: {
            id: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            categoryId: { type: 'string' },
            seriesId: { type: 'string', nullable: true },
            titleZh: { type: 'string', nullable: true },
            titleEn: { type: 'string', nullable: true },
            titleJa: { type: 'string', nullable: true },
            width: { type: 'integer', nullable: true },
            height: { type: 'integer', nullable: true },
            thumbHash: { type: 'string', nullable: true },
          },
        },
        ArtworkPage: {
          type: 'object',
          required: ['items'],
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/Artwork' } },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
            total: { type: 'integer' },
          },
        },
        ProblemDetails: {
          type: 'object',
          description: 'RFC 9457 problem details.',
          properties: {
            type: { type: 'string', format: 'uri' },
            title: { type: 'string' },
            status: { type: 'integer' },
            detail: { type: 'string' },
            instance: { type: 'string' },
          },
        },
      },
      responses: {
        Error: {
          description: 'Error.',
          content: {
            'application/problem+json': {
              schema: { $ref: '#/components/schemas/ProblemDetails' },
            },
            'application/json': {
              schema: { $ref: '#/components/schemas/ProblemDetails' },
            },
          },
        },
      },
    },
  }
})
