// Cross-cutting agent-readiness middleware.
//
// Responsibilities:
//   1. Add HTTP Link headers (RFC 8288) advertising sitemap, markdown
//      alternate, OpenAPI service description, and api-catalog. This makes
//      every response self-describing for agents that probe headers.
//
//   2. Markdown content negotiation (acceptmarkdown.com): if a client sends
//      `Accept: text/markdown` to the home page (`/`, `/en`, `/zh-CN`, `/ja`),
//      respond with the markdown alternate at /index.md and a `Vary: Accept`
//      header so caches segregate correctly.
//
//   3. Agent mode (?mode=agent): when this query parameter is present on the
//      home page, return a structured JSON document describing the site's
//      machine-readable surface instead of marketing HTML.
//
// The middleware short-circuits only on the home page paths above so that
// other routes (API, files, .well-known/*, etc.) are unaffected.
const SITE_URL = 'https://cake47.art'

const LINK_HEADER = [
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
  '</index.md>; rel="alternate"; type="text/markdown"; title="Markdown"',
  '</api/openapi.json>; rel="service-desc"; type="application/openapi+json"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</.well-known/agent-card.json>; rel="agent-card"; type="application/json"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"; type="application/json"',
].join(', ')

const HOME_PATHS = new Set(['/', '/en', '/zh-CN', '/ja', '/en/', '/zh-CN/', '/ja/'])

function isHomePath(path: string): boolean {
  // Trim query string + hash for the lookup.
  const cleaned = path.split('?')[0]?.split('#')[0] ?? '/'
  return HOME_PATHS.has(cleaned)
}

function wantsMarkdown(accept: string | undefined): boolean {
  if (!accept) {
    return false
  }
  // Cheap parse: list-of-types separated by commas. We treat text/markdown as a
  // hard preference whenever it appears with a higher-or-equal q-value than
  // text/html.
  const parts = accept.split(',').map(s => s.trim().toLowerCase())
  let mdQ = -1
  let htmlQ = -1
  for (const part of parts) {
    const [type, ...params] = part.split(';').map(s => s.trim())
    const qParam = params.find(p => p.startsWith('q='))
    const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1
    if (type === 'text/markdown' && q > mdQ) {
      mdQ = q
    }
    if ((type === 'text/html' || type === '*/*') && q > htmlQ) {
      htmlQ = q
    }
  }
  return mdQ > 0 && mdQ >= htmlQ
}

function agentModePayload() {
  return {
    name: 'snowcake47-portfolio',
    description: 'Personal illustration portfolio of snowcake47 / 私期 — fan works, original characters, and commercial commission samples.',
    url: SITE_URL,
    canonical: `${SITE_URL}/en`,
    locales: ['en', 'zh-CN', 'ja'],
    identity: {
      brand: 'snowcake47',
      aliases: ['私期', 'Shiki', 'cake47'],
      sameAs: [
        'https://x.com/snowcake47',
        'https://bsky.app/profile/snowcake47.bsky.social',
        'https://weibo.com/2861524284',
        'https://www.mihuashi.com/profiles/2397',
        'https://www.rednote.com/user/profile/629e56300000000021029847',
      ],
    },
    capabilities: ['browse-portfolio', 'fetch-artwork-image'],
    endpoints: {
      home_layout: `${SITE_URL}/api/home/layout`,
      gallery_taxonomy: `${SITE_URL}/api/gallery`,
      gallery_artworks: `${SITE_URL}/api/gallery/artworks`,
      files: `${SITE_URL}/api/files/{path}`,
      openapi: `${SITE_URL}/api/openapi.json`,
      mcp: `${SITE_URL}/mcp`,
    },
    discovery: {
      llms_txt: `${SITE_URL}/llms.txt`,
      sitemap: `${SITE_URL}/sitemap.xml`,
      schemamap: `${SITE_URL}/schemamap.xml`,
      robots: `${SITE_URL}/robots.txt`,
      agent_card: `${SITE_URL}/.well-known/agent-card.json`,
      mcp_server_card: `${SITE_URL}/.well-known/mcp/server-card.json`,
      api_catalog: `${SITE_URL}/.well-known/api-catalog`,
      oauth_protected_resource: `${SITE_URL}/.well-known/oauth-protected-resource`,
      web_bot_auth_directory: `${SITE_URL}/.well-known/http-message-signatures-directory`,
    },
    auth: {
      required: false,
      note: 'Public read-only API. Admin endpoints require a private bearer token and are not exposed to third-party agents.',
    },
    rate_limit: {
      published: false,
      recommended_ceiling_per_minute: 60,
      note: 'Self-throttle and honour Retry-After when present.',
    },
    crawl_policy: {
      content_signal: 'search=yes, ai-input=yes, ai-train=no',
      reference: `${SITE_URL}/robots.txt`,
    },
    contact: {
      x: 'https://x.com/snowcake47',
      bluesky: 'https://bsky.app/profile/snowcake47.bsky.social',
      mihuashi: 'https://www.mihuashi.com/profiles/2397',
    },
  }
}

export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    return
  }

  const url = getRequestURL(event)
  const path = url.pathname

  // 1. Always advertise the agent surface via Link headers.
  appendResponseHeader(event, 'Link', LINK_HEADER)

  // 1b. Publish a rate-limit budget on read endpoints so agents can self-throttle.
  // The site sits behind Cloudflare; these are advisory ceilings, not hard limits.
  if (path.startsWith('/api/') && !path.startsWith('/api/admin/')) {
    setResponseHeader(event, 'X-RateLimit-Limit', '60')
    setResponseHeader(event, 'X-RateLimit-Window', '60')
    setResponseHeader(event, 'X-RateLimit-Policy', '60;w=60')
    setResponseHeader(event, 'RateLimit-Limit', '60')
    setResponseHeader(event, 'RateLimit-Policy', '60;w=60')
  }

  // 2 & 3. Only act on the home-page paths.
  if (!isHomePath(path)) {
    return
  }

  // Agent mode short-circuit.
  if (url.searchParams.get('mode') === 'agent') {
    setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=300')
    setResponseHeader(event, 'X-Agent-Mode', 'true')
    return agentModePayload()
  }

  // Markdown content negotiation.
  const accept = getRequestHeader(event, 'accept')
  // Always advertise that this resource varies by Accept so caches behave.
  appendResponseHeader(event, 'Vary', 'Accept')

  if (wantsMarkdown(accept)) {
    const md = await $fetch<string>('/index.md')
    setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=300')
    return md
  }
})
