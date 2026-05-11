// Markdown alternate handler.
//
// For sitemap pages with a Markdown representation (see page-markdown.ts),
// either serve Markdown or — when serving HTML — advertise the Markdown
// alternate via the Link header. Markdown is served when any of:
//   (1) the URL ends in `.md`
//   (2) Accept: text/markdown wins content negotiation
//   (3) the User-Agent matches a known AI crawler
//
// Eligibility is decided by markdownForPath(); paths without a Markdown body
// (API, admin, well-known, unknown routes) pass through untouched, so the
// Vary: User-Agent signal stays scoped to pages it actually applies to and
// won't fragment CDN cache for the rest of the site.
import { appendResponseHeader, defineEventHandler, getRequestHeader, getRequestURL, setResponseHeader } from 'h3'
import { markdownForPath } from '~~/server/utils/page-markdown'

const AI_USER_AGENT_RE = /\b(GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-Web|Claude-User|anthropic-ai|CCBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Bytespider|cohere-ai|Meta-ExternalAgent|ora-agent)\b/i

function wantsMarkdown(accept: string | undefined): boolean {
  if (!accept) return false
  let mdQ = -1
  let htmlQ = -1
  for (const part of accept.split(',')) {
    const [type, ...params] = part.trim().toLowerCase().split(';').map(s => s.trim())
    const qParam = params.find(p => p.startsWith('q='))
    const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1
    if (type === 'text/markdown' && q > mdQ) mdQ = q
    if ((type === 'text/html' || type === '*/*') && q > htmlQ) htmlQ = q
  }
  return mdQ > 0 && mdQ >= htmlQ
}

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  let pathname = getRequestURL(event).pathname
  let mdSuffix = false
  if (pathname.endsWith('.md')) {
    pathname = pathname.slice(0, -3) || '/'
    mdSuffix = true
  }

  const body = markdownForPath(pathname)
  if (!body) return

  const mdAlternate = pathname === '/' ? '/index.md' : `${pathname.replace(/\/$/, '')}.md`
  appendResponseHeader(event, 'Link', `<${mdAlternate}>; rel="alternate"; type="text/markdown"`)
  appendResponseHeader(event, 'Vary', 'Accept, User-Agent')

  const ua = getRequestHeader(event, 'user-agent')
  const wantsMd = mdSuffix
    || wantsMarkdown(getRequestHeader(event, 'accept'))
    || (!!ua && AI_USER_AGENT_RE.test(ua))
  if (!wantsMd) return

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300')
  return body
})
