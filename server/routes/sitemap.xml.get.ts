// Combined XML sitemap with image extension.
// - Lists every locale-prefixed page that resolves to a real route.
// - Embeds <image:image> entries on each gallery URL so that Google
//   Image Search can index the artwork binaries served by /api/files/*.
// - Emits path-based category + series URLs so each filter view is its own
//   canonical (matches `pages/index/[locale]/gallery/[category]/[series].vue`).
import { defineEventHandler, setResponseHeader } from 'h3'
import { and, asc, desc, eq, sql, tables, useDrizzle } from '~~/server/utils/drizzle'
import { versionBlobUrl } from '~~/server/utils/blob-url'

const SITE_URL = 'https://cake47.art'
const LOCALES = ['en', 'zh-CN', 'ja'] as const
type Locale = typeof LOCALES[number]

interface ImageEntry {
  loc: string
  title?: string
  caption?: string
}

interface UrlEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
  alternates?: { hreflang: string, href: string }[]
  images?: ImageEntry[]
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
  for (const img of entry.images ?? []) {
    parts.push(`    <image:image>`)
    parts.push(`      <image:loc>${escapeXml(img.loc)}</image:loc>`)
    if (img.title) {
      parts.push(`      <image:title>${escapeXml(img.title)}</image:title>`)
    }
    if (img.caption) {
      parts.push(`      <image:caption>${escapeXml(img.caption)}</image:caption>`)
    }
    parts.push(`    </image:image>`)
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

function pickLocalizedTitle(locale: Locale, zh: string, en: string, ja: string): string {
  if (locale === 'zh-CN') {
    return zh || en || ja
  }
  if (locale === 'ja') {
    return ja || en || zh
  }
  return en || ja || zh
}

function toIsoDate(value: number | Date | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    return undefined
  }
  return d.toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  const today = new Date().toISOString().slice(0, 10)
  const entries: UrlEntry[] = []

  // Pull artwork data once. Each row is the artwork's primary-series binding,
  // so we get one canonical title/series per artwork for the image sitemap.
  let galleryImagesByLocale: Record<Locale, ImageEntry[]> = { 'en': [], 'zh-CN': [], 'ja': [] }
  let galleryLastmod = today
  let categoryRows: { id: string }[] = []
  let seriesRows: { slug: string, categoryId: string }[] = []
  // Per-category and per-series image bundles, in the same order/locale shape
  // as `galleryImagesByLocale` so each path-based view declares only its own
  // artwork binaries (helps Google Images understand which gallery a binary
  // belongs to).
  const imagesByCategoryByLocale = new Map<string, Record<Locale, ImageEntry[]>>()
  const imagesBySeriesByLocale = new Map<string, Record<Locale, ImageEntry[]>>()
  const lastmodByCategory = new Map<string, string>()
  const lastmodBySeries = new Map<string, string>()

  try {
    const db = useDrizzle()

    categoryRows = await db
      .select({ id: tables.categories.id })
      .from(tables.categories)
      .orderBy(asc(tables.categories.sortOrder), asc(tables.categories.id))
      .all()

    seriesRows = await db
      .select({ slug: tables.series.slug, categoryId: tables.series.categoryId })
      .from(tables.series)
      .innerJoin(tables.artworkSeriesLinks, eq(tables.artworkSeriesLinks.seriesId, tables.series.id))
      .groupBy(tables.series.id)
      .having(sql`count(${tables.artworkSeriesLinks.artworkId}) > 0`)
      .all()

    const artworks = await db
      .select({
        url: tables.artworks.url,
        sizeBytes: tables.artworks.sizeBytes,
        titleZh: tables.artworks.titleZh,
        titleEn: tables.artworks.titleEn,
        titleJa: tables.artworks.titleJa,
        descriptionZh: tables.artworks.descriptionZh,
        descriptionEn: tables.artworks.descriptionEn,
        descriptionJa: tables.artworks.descriptionJa,
        seriesSlug: tables.series.slug,
        seriesNameZh: tables.series.nameZh,
        seriesNameEn: tables.series.nameEn,
        seriesNameJa: tables.series.nameJa,
        categoryId: tables.series.categoryId,
        createdAt: tables.artworks.createdAt,
      })
      .from(tables.artworks)
      .innerJoin(tables.artworkSeriesLinks, and(
        eq(tables.artworkSeriesLinks.artworkId, tables.artworks.id),
        eq(tables.artworkSeriesLinks.isPrimary, true),
      ))
      .innerJoin(tables.series, eq(tables.series.id, tables.artworkSeriesLinks.seriesId))
      .orderBy(desc(tables.artworks.createdAt))
      .all()

    galleryImagesByLocale = LOCALES.reduce((acc, locale) => {
      acc[locale] = artworks.map((row) => {
        const versionedUrl = versionBlobUrl(row.url, row.sizeBytes)
        const absoluteUrl = /^https?:\/\//i.test(versionedUrl) ? versionedUrl : `${SITE_URL}${versionedUrl}`
        const title = pickLocalizedTitle(locale, row.titleZh, row.titleEn, row.titleJa)
          || pickLocalizedTitle(locale, row.seriesNameZh, row.seriesNameEn, row.seriesNameJa)
        const caption = pickLocalizedTitle(locale, row.descriptionZh, row.descriptionEn, row.descriptionJa)
        return {
          loc: absoluteUrl,
          title: title || 'snowcake47 illustration',
          caption: caption || `${pickLocalizedTitle(locale, row.seriesNameZh, row.seriesNameEn, row.seriesNameJa)} — snowcake47 / 私期`,
        }
      })
      return acc
    }, { 'en': [], 'zh-CN': [], 'ja': [] } as Record<Locale, ImageEntry[]>)

    // Group images by category and series so per-filter sitemap entries can
    // declare only the binaries that actually appear on that view.
    for (const cat of categoryRows) {
      imagesByCategoryByLocale.set(cat.id, { 'en': [], 'zh-CN': [], 'ja': [] })
    }
    for (const s of seriesRows) {
      imagesBySeriesByLocale.set(s.slug, { 'en': [], 'zh-CN': [], 'ja': [] })
    }

    for (let i = 0; i < artworks.length; i++) {
      const row = artworks[i]!
      const ts = row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt) || 0
      const iso = toIsoDate(ts)
      if (iso) {
        const prevCat = lastmodByCategory.get(row.categoryId)
        if (!prevCat || iso > prevCat) {
          lastmodByCategory.set(row.categoryId, iso)
        }
        const prevSer = lastmodBySeries.get(row.seriesSlug)
        if (!prevSer || iso > prevSer) {
          lastmodBySeries.set(row.seriesSlug, iso)
        }
      }
      for (const locale of LOCALES) {
        const entry = galleryImagesByLocale[locale][i]
        if (!entry) {
          continue
        }
        imagesByCategoryByLocale.get(row.categoryId)?.[locale].push(entry)
        imagesBySeriesByLocale.get(row.seriesSlug)?.[locale].push(entry)
      }
    }

    const newest = artworks
      .map(row => row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt) || 0)
      .reduce((max, t) => t > max ? t : max, 0)
    if (newest) {
      galleryLastmod = toIsoDate(newest) ?? today
    }
  }
  catch {
    // DB unavailable — fall back to URL-only sitemap (no <image:image> nodes).
  }

  for (const locale of LOCALES) {
    entries.push({
      loc: `${SITE_URL}/${locale}`,
      lastmod: galleryLastmod,
      changefreq: 'weekly',
      priority: locale === 'en' ? 1.0 : 0.9,
      alternates: localizedAlternates(''),
    })
    entries.push({
      loc: `${SITE_URL}/${locale}/gallery`,
      lastmod: galleryLastmod,
      changefreq: 'weekly',
      priority: 0.9,
      alternates: localizedAlternates('/gallery'),
      images: galleryImagesByLocale[locale],
    })
  }

  // Per-category landing pages (e.g. /en/gallery/fan-works).
  for (const cat of categoryRows) {
    const catImagesByLocale = imagesByCategoryByLocale.get(cat.id)
    const catLastmod = lastmodByCategory.get(cat.id) ?? galleryLastmod
    for (const locale of LOCALES) {
      entries.push({
        loc: `${SITE_URL}/${locale}/gallery/${cat.id}`,
        lastmod: catLastmod,
        changefreq: 'weekly',
        priority: 0.8,
        alternates: localizedAlternates(`/gallery/${cat.id}`),
        images: catImagesByLocale?.[locale],
      })
    }
  }

  // Per-series landing pages (e.g. /en/gallery/fan-works/vocaloid).
  for (const s of seriesRows) {
    const serImagesByLocale = imagesBySeriesByLocale.get(s.slug)
    const serLastmod = lastmodBySeries.get(s.slug) ?? galleryLastmod
    for (const locale of LOCALES) {
      entries.push({
        loc: `${SITE_URL}/${locale}/gallery/${s.categoryId}/${s.slug}`,
        lastmod: serLastmod,
        changefreq: 'weekly',
        priority: 0.7,
        alternates: localizedAlternates(`/gallery/${s.categoryId}/${s.slug}`),
        images: serImagesByLocale?.[locale],
      })
    }
  }

  // Reference informational endpoints discoverable via crawlers.
  entries.push({ loc: `${SITE_URL}/llms.txt`, lastmod: today, changefreq: 'weekly', priority: 0.4 })
  entries.push({ loc: `${SITE_URL}/index.md`, lastmod: today, changefreq: 'weekly', priority: 0.4 })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map(entryToXml).join('\n')}
</urlset>
`
  return xml
})
