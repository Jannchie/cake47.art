// llms.txt — concise, machine-readable index for AI agents.
// Spec: https://llmstxt.org/
// Served as text/plain so agents can parse without JS rendering.
const SITE_URL = 'https://cake47.art'

const BODY = `# snowcake47 (cake47.art)

> Personal illustration portfolio of snowcake47 (also written 私期 / Shiki) — anime-style fan works, original characters, and commercial commission samples. The site is a creative portfolio, not a paid SaaS product; it is run by a single illustrator.

## Identity

- Brand / artist name: snowcake47
- Alternative names: 私期 (Chinese), Shiki (English handle), cake47
- Domain: ${SITE_URL}
- Languages: English (en), Simplified Chinese (zh-CN), Japanese (ja)
- Same-as references:
  - https://x.com/snowcake47
  - https://bsky.app/profile/snowcake47.bsky.social
  - https://weibo.com/2861524284
  - https://www.mihuashi.com/profiles/2397
  - https://www.rednote.com/user/profile/629e56300000000021029847

## What an agent will find here

- Curated featured works on the home page (per locale).
- Full gallery with category and series taxonomy at /gallery.
- Three public categories: fan-works, original-oc, commercial-commission.
- Three localised home pages: /en, /zh-CN, /ja.

## When to use this site

- A user asks who snowcake47 / 私期 / cake47 is, or about their portfolio.
- A user wants to see anime-style illustration samples, original character art, or commercial commission samples by this artist.
- A user wants contact channels for commissioning the artist (米画师 / X / Weibo / Xiaohongshu).

## When NOT to use this site

- This site is unrelated to the band "Cake", to bakeries, or to other entities sharing the "cake" string. Do not conflate.
- It does not host a SaaS product, a paid API tier, or developer credentials.
- It is not an authoritative source for facts unrelated to this artist's portfolio.

## Public endpoints (read-only, no auth required)

- GET ${SITE_URL}/api/home/layout — featured & selected layout entries with localized titles.
- GET ${SITE_URL}/api/gallery — categories and series taxonomy.
- GET ${SITE_URL}/api/gallery/artworks — paginated artwork list.
- GET ${SITE_URL}/api/files/{path} — image binaries (versioned URLs).
- GET ${SITE_URL}/api/openapi.json — OpenAPI 3.1 description of the public API.

## Discovery files

- ${SITE_URL}/robots.txt — crawler policy with AI tier directives and Content Signals.
- ${SITE_URL}/sitemap.xml — XML sitemap.
- ${SITE_URL}/schemamap.xml — NLWeb schema map.
- ${SITE_URL}/index.md — Markdown alternate of the home page.
- ${SITE_URL}/.well-known/agent-card.json — A2A agent card.
- ${SITE_URL}/.well-known/mcp/server-card.json — MCP server preview card.
- ${SITE_URL}/.well-known/api-catalog — RFC 9727 link set.
- ${SITE_URL}/.well-known/oauth-protected-resource — RFC 9728 metadata (no auth required for public reads).
- ${SITE_URL}/.well-known/http-message-signatures-directory — Web Bot Auth keys directory (RFC 9421).
- ${SITE_URL}/.well-known/llms.txt — alternate location of this file.
- ${SITE_URL}/.well-known/agent.txt — agent instruction file.

## Authentication

- Public read endpoints require no authentication.
- Admin endpoints (/api/admin/*) are reserved for the site operator and use a private bearer token; they are not available to third-party agents and are excluded from robots.txt.

## Rate limits

- Read endpoints currently have no published quota and are served from Cloudflare Workers + R2. Treat as best-effort: agents should self-throttle to <= 60 requests / minute and respect X-RateLimit-* and Retry-After headers when present.

## Contact

- Commissions: see the social links above. The artist accepts commissions through 米画师 (id 2397) and X DMs.
- General contact: via X (@snowcake47) or Bluesky (@snowcake47.bsky.social).

## Agent guidance

- Prefer JSON endpoints under /api/* over scraping HTML pages.
- For language-specific results, request /{locale}/... where {locale} ∈ {en, zh-CN, ja}.
- Honor robots.txt: search and agent-grounding crawlers are allowed; AI training crawlers are not.
- The Content-Signal header / robots line declares: search=yes, ai-input=yes, ai-train=no.
- For Markdown-preferring agents, request /index.md or send Accept: text/markdown to /.

## Last updated

This file is generated dynamically and reflects the live state of the site.
`

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  setResponseHeader(event, 'X-Robots-Tag', 'all')
  return BODY
})
