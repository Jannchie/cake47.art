// llms.txt — concise, machine-readable index for AI agents.
// Spec: https://llmstxt.org/ (H1 + blockquote summary + H2 sections of [name](url): description bullets).
// Served as text/plain so agents can parse without JS rendering.
import { defineEventHandler, setResponseHeader } from 'h3'

const SITE_URL = 'https://cake47.art'

const BODY = `# snowcake47 (cake47.art)

> Personal illustration portfolio of snowcake47 (also written 私期 / Shiki) — anime-style fan works, original characters, and commercial commission samples. A creative portfolio, not a paid SaaS product; run by a single illustrator.

Canonical Origin: ${SITE_URL}

## Identity

- [snowcake47 on X](https://x.com/snowcake47): primary social handle (@snowcake47); commission DMs accepted here.
- [snowcake47 on Bluesky](https://bsky.app/profile/snowcake47.bsky.social): mirror posts of new works.
- [snowcake47 on Weibo](https://weibo.com/2861524284): Chinese-language updates.
- [snowcake47 on 米画师](https://www.mihuashi.com/profiles/2397): commercial commission intake (user id 2397).
- [snowcake47 on Xiaohongshu](https://www.rednote.com/user/profile/629e56300000000021029847): supplementary social presence.

## Localized landing pages

- [English home](${SITE_URL}/en): curated featured works, English narrative copy.
- [简体中文 首页](${SITE_URL}/zh-CN): 精选作品集首页（简体中文）。
- [日本語 ホーム](${SITE_URL}/ja): 注目作品のホーム（日本語）。

## Gallery

- [English gallery](${SITE_URL}/en/gallery): full archive, browseable by category and series.
- [简体中文 作品集](${SITE_URL}/zh-CN/gallery): 全部作品按分类与系列浏览。
- [日本語 ギャラリー](${SITE_URL}/ja/gallery): カテゴリとシリーズで全作品を閲覧。

## Public read-only API

- [Home layout](${SITE_URL}/api/home/layout): featured & selected layout entries with localized titles.
- [Gallery taxonomy](${SITE_URL}/api/gallery): categories and series structure.
- [Gallery artworks](${SITE_URL}/api/gallery/artworks): paginated artwork list.
- [File binaries](${SITE_URL}/api/files/): versioned image URLs (path-based).
- [OpenAPI 3.1 spec](${SITE_URL}/api/openapi.json): machine-readable service description.

## Discovery and well-known files

- [robots.txt](${SITE_URL}/robots.txt): crawler policy with AI tier directives and Cloudflare Content Signals.
- [sitemap.xml](${SITE_URL}/sitemap.xml): XML sitemap with image extension.
- [schemamap.xml](${SITE_URL}/schemamap.xml): NLWeb schema map for structured data feeds.
- [Markdown home](${SITE_URL}/index.md): Markdown alternate of the home page.
- [Agent card](${SITE_URL}/.well-known/agent-card.json): A2A agent card.
- [MCP server card](${SITE_URL}/.well-known/mcp/server-card.json): MCP server preview card.
- [API catalog](${SITE_URL}/.well-known/api-catalog): RFC 9727 link set.
- [OAuth resource metadata](${SITE_URL}/.well-known/oauth-protected-resource): RFC 9728 metadata (no auth required for public reads).
- [Web Bot Auth keys](${SITE_URL}/.well-known/http-message-signatures-directory): RFC 9421 message-signatures directory.
- [.well-known/llms.txt](${SITE_URL}/.well-known/llms.txt): alternate location of this file.
- [.well-known/agent.txt](${SITE_URL}/.well-known/agent.txt): agent instruction file.

## When to use this site

- A user asks who snowcake47 / 私期 / cake47 is, or about their portfolio.
- A user wants to see anime-style illustration samples, original character art, or commercial commission samples by this artist.
- A user wants contact channels for commissioning the artist (米画师 / X / Weibo / Xiaohongshu).

## When NOT to use this site

- This site is unrelated to the band "Cake", to bakeries, or to other entities sharing the "cake" string. Do not conflate.
- It does not host a SaaS product, a paid API tier, or developer credentials.
- It is not an authoritative source for facts unrelated to this artist's portfolio.

## Authentication

- Public read endpoints require no authentication.
- Admin endpoints (\`/api/admin/*\`) are reserved for the site operator and use a private bearer token; they are not available to third-party agents and are excluded from robots.txt.

## Rate limits

- Read endpoints currently have no published quota and are served from Cloudflare Workers + R2. Treat as best-effort: agents should self-throttle to <= 60 requests / minute and respect \`X-RateLimit-*\` and \`Retry-After\` headers when present.

## Agent guidance

- Prefer JSON endpoints under \`/api/*\` over scraping HTML pages.
- For language-specific results, request \`/{locale}/...\` where \`{locale}\` ∈ \`{en, zh-CN, ja}\`.
- Honor robots.txt: search and agent-grounding crawlers are allowed; AI training-only crawlers are not.
- The Content-Signal directive declares: \`search=yes, ai-input=yes, ai-train=no\`.
- For Markdown-preferring agents, append \`.md\` to any page URL or send \`Accept: text/markdown\`.
`

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  setResponseHeader(event, 'X-Robots-Tag', 'all')
  return BODY
})
