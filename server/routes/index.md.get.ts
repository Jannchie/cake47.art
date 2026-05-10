// Markdown alternate of the home page.
// Spec: acceptmarkdown.com — agents that prefer Markdown over HTML can fetch
// this single canonical URL or send Accept: text/markdown to "/" and get
// served the same content via the markdown content negotiation middleware.
import { defineEventHandler, setResponseHeader } from 'h3'

const SITE_URL = 'https://cake47.art'

const BODY = `# snowcake47 — illustration portfolio

> Personal illustration portfolio of **snowcake47** (also written 私期 / Shiki). Fan works, original characters, and commercial commission samples in an anime / character-illustration idiom.

## Identity

- **Artist:** snowcake47 / 私期 / Shiki
- **Domain:** [cake47.art](${SITE_URL})
- **Languages:** English (en), Simplified Chinese (zh-CN), Japanese (ja)
- **Disambiguation:** This is an illustrator's portfolio. It is unrelated to the band "Cake", any bakery business, or any other entity sharing the "cake" string.

## Categories

- **Fan works** — illustration based on games, anime, manga, and virtual singers (Vocaloid, etc.).
- **Original characters** — original character designs, birthday illustrations, personal works.
- **Commercial / commission** — public-facing commercial samples and commission samples.

## Browse

- Featured: [${SITE_URL}/en](${SITE_URL}/en) · [${SITE_URL}/zh-CN](${SITE_URL}/zh-CN) · [${SITE_URL}/ja](${SITE_URL}/ja)
- Full archive: [${SITE_URL}/en/gallery](${SITE_URL}/en/gallery)

## Contact

- X / Twitter — [@snowcake47](https://x.com/snowcake47)
- Bluesky — [@snowcake47.bsky.social](https://bsky.app/profile/snowcake47.bsky.social)
- 米画师 (commissions, zh-CN) — [id 2397](https://www.mihuashi.com/profiles/2397)
- 微博 — [2861524284](https://weibo.com/2861524284)
- 小红书 — [profile](https://www.rednote.com/user/profile/629e56300000000021029847)

## Public API

Read-only HTTP API, no auth required.

- \`GET /api/home/layout\` — curated home layout.
- \`GET /api/gallery\` — categories + series taxonomy.
- \`GET /api/gallery/artworks\` — paginated artwork list.
- \`GET /api/files/{path}\` — image binaries.

OpenAPI 3.1: [${SITE_URL}/api/openapi.json](${SITE_URL}/api/openapi.json)

## Agent surface

- llms.txt: [${SITE_URL}/llms.txt](${SITE_URL}/llms.txt)
- A2A agent card: [${SITE_URL}/.well-known/agent-card.json](${SITE_URL}/.well-known/agent-card.json)
- MCP server: [${SITE_URL}/mcp](${SITE_URL}/mcp) — server card at [/.well-known/mcp/server-card.json](${SITE_URL}/.well-known/mcp/server-card.json)
- API catalog (RFC 9727): [${SITE_URL}/.well-known/api-catalog](${SITE_URL}/.well-known/api-catalog)
- OAuth metadata (RFC 9728): [${SITE_URL}/.well-known/oauth-protected-resource](${SITE_URL}/.well-known/oauth-protected-resource)

## Crawl policy

\`/robots.txt\` declares \`Content-Signal: search=yes, ai-input=yes, ai-train=no\`. Search and agent-grounding crawlers are welcome; AI training crawlers are not.
`

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  setResponseHeader(event, 'Vary', 'Accept')
  return BODY
})
