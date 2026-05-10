// Modular llms.txt for the API surface. Lets agents fetch a focused
// context about the public API without pulling the full site index.
import { defineEventHandler, setResponseHeader } from 'h3'

const SITE_URL = 'https://cake47.art'

const BODY = `# cake47.art — public API

> Read-only HTTP API behind the snowcake47 / 私期 illustration portfolio. No authentication required for public endpoints.

## Base URL

${SITE_URL}

## Service description

- OpenAPI 3.1: ${SITE_URL}/api/openapi.json (Content-Type: application/openapi+json)
- API catalog: ${SITE_URL}/.well-known/api-catalog (RFC 9727 linkset)

## Endpoints

GET /api/home/layout
  Returns curated home-page slots: featured "hero", category showcases, "selected" carousel.
  Response: { slots: Record<string, Slot>, selected: Slot[], carousel: Slot[] }
  Slot fields: url, categoryId, seriesNameZh|En|Ja, titleZh|En|Ja, objectPosition, thumbHash.

GET /api/gallery
  Returns categories (3 fixed: fan-works, original-oc, commercial-commission) and the series taxonomy.
  Response: { categories: Category[], series: Series[] }

GET /api/gallery/artworks?categoryId=&seriesId=&limit=&offset=
  Returns paginated artworks for the requested category or series.

GET /api/files/{path}
  Streams the underlying image binary. URLs are versioned via ?v=<sizeBytes> for cache-busting.

## Conventions

- All responses are JSON unless otherwise noted.
- All text fields ship with locale variants (zh-CN, en, ja). Pick by the user's locale; fall back to en.
- Rate limit: best effort. Agents should self-throttle to <= 60 req/min and observe Retry-After when present.
- Errors: standard HTTP status codes; bodies are JSON when produced by /api/*.

## Authentication

Public endpoints require no auth. Admin endpoints under /api/admin/* are off-limits to third-party agents.

## When to call this API

- Building a third-party showcase or aggregation that lists snowcake47's portfolio with proper attribution.
- Surfacing portfolio images in answers about the artist.

## When NOT to call this API

- For training large language models — see Content-Signal: ai-train=no in /robots.txt.
- For any write operation — there are no public write endpoints.
`

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
