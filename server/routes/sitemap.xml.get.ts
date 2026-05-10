import { defineEventHandler, setResponseHeader } from 'h3'
import { asc, tables, useDrizzle } from '~~/server/utils/drizzle'

const SITE_URL = 'https://cake47.art'
const LOCALES = ['en', 'zh-CN', 'ja'] as const

interface UrlEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
  alternates?: { hreflang: string, href: string }[]
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function entryToXml(entry: UrlEntry): string {
  const parts = [
    `  <url>`,
    `    <loc>${escapeXml(entry.loc)}</loc>`,
  ]
  if (entry.lastmod) {
    parts.push(`    <lastmod>${entry.lastmod}</lastmod>`)
  }
  if (entry.changefreq) {
    parts.push(`    <changefreq>${entry.changefreq}</changefreq>`)
  }
  if (entry.priority !== undefined) {
    parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
  }
  for (const alt of entry.alternates ?? []) {
    parts.push(`    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}"/>`)
  }
  parts.push(`  </url>`)
  return parts.join('\n')
}

function localizedAlternates(path: string) {
  return [
    ...LOCALES.map(locale => ({
      hreflang: locale,
      href: `${SITE_URL}/${locale}${path}`,
    })),
    { hreflang: 'x-default', href: `${SITE_URL}/en${path}` },
  ]
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  const today = new Date().toISOString().slice(0, 10)
  const entries: UrlEntry[] = []

  for (const locale of LOCALES) {
    entries.push({
      loc: `${SITE_URL}/${locale}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: locale === 'en' ? 1.0 : 0.9,
      alternates: localizedAlternates(''),
    })
    entries.push({
      loc: `${SITE_URL}/${locale}/gallery`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8,
      alternates: localizedAlternates('/gallery'),
    })
  }

  try {
    const db = useDrizzle()
    const series = await db
      .select({
        slug: tables.series.slug,
        categoryId: tables.series.categoryId,
      })
      .from(tables.series)
      .orderBy(asc(tables.series.sortOrder))
      .all()

    for (const locale of LOCALES) {
      for (const s of series) {
        if (!s.slug) {
          continue
        }
        const path = `/gallery/${s.categoryId}/${s.slug}`
        entries.push({
          loc: `${SITE_URL}/${locale}${path}`,
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.6,
          alternates: localizedAlternates(path),
        })
      }
    }
  }
  catch {
    // DB may be unavailable in some environments — fall back to base URLs only.
  }

  // Reference informational endpoints discoverable via crawlers.
  entries.push({ loc: `${SITE_URL}/llms.txt`, lastmod: today, changefreq: 'weekly', priority: 0.5 })
  entries.push({ loc: `${SITE_URL}/index.md`, lastmod: today, changefreq: 'weekly', priority: 0.5 })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(entryToXml).join('\n')}
</urlset>
`
  return xml
})
