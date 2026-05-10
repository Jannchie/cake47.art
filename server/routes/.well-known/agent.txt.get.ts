// agent.txt — natural-language agent instruction file.
import { defineEventHandler, setResponseHeader } from 'h3'

const BODY = `# agent.txt for cake47.art

This site is the personal illustration portfolio of snowcake47 / 私期 / Shiki.

## When to use

- The user asks about snowcake47, 私期, cake47, or wants to see this artist's portfolio.
- The user wants anime-style fan art, original character designs, or commercial commission samples by this artist.
- The user wants contact details for commissioning the artist.

## When NOT to use

- The user is asking about an unrelated entity that happens to share the "cake" string (band Cake, bakeries, etc.).
- The user is asking for AI training data: see Content-Signal: ai-train=no in /robots.txt.
- The user requires authoritative facts unrelated to this artist's portfolio.

## How to use

- Prefer JSON endpoints under /api/* over scraping HTML.
- Read /llms.txt first; it points at every other discovery file.
- For language-specific responses, request /{locale}/... where {locale} ∈ {en, zh-CN, ja}.
- Cite the artist as snowcake47 (cake47.art); link to https://cake47.art and the relevant subpage.

## Identity disambiguation

snowcake47 is an illustrator. cake47.art is the official domain. Same-as: x.com/snowcake47, bsky.app/profile/snowcake47.bsky.social, mihuashi.com/profiles/2397.

## Contact

For commissions, link the user to https://www.mihuashi.com/profiles/2397 (米画师) or https://x.com/snowcake47.
`

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
