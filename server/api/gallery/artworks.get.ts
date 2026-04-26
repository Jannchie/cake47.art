import { z } from 'zod'
import { and, asc, desc, eq, tables, useDrizzle } from '~~/server/utils/drizzle'
import { versionBlobUrl } from '~~/server/utils/blob-url'

const querySchema = z.object({
  category: z.string().optional(),
  series: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(60),
  offset: z.coerce.number().int().min(0).default(0),
})

function normalizeCategoryId(value: string | undefined) {
  if (value === 'game-fanart' || value === 'anime-fanart') {
    return 'fan-works'
  }
  return value
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle()
  const category = normalizeCategoryId(query.category)

  const conditions = []
  if (query.series) {
    conditions.push(eq(tables.series.slug, query.series))
  }
  if (category) {
    conditions.push(eq(tables.series.categoryId, category))
  }
  if (!query.series && !category) {
    conditions.push(eq(tables.artworkSeriesLinks.isPrimary, true))
  }

  const rows = await db
    .select({
      id: tables.artworks.id,
      seriesId: tables.series.id,
      titleZh: tables.artworks.titleZh,
      titleEn: tables.artworks.titleEn,
      titleJa: tables.artworks.titleJa,
      descriptionZh: tables.artworks.descriptionZh,
      descriptionEn: tables.artworks.descriptionEn,
      descriptionJa: tables.artworks.descriptionJa,
      url: tables.artworks.url,
      sizeBytes: tables.artworks.sizeBytes,
      width: tables.artworks.width,
      height: tables.artworks.height,
      mimeType: tables.artworks.mimeType,
      objectPosition: tables.artworks.objectPosition,
      sortOrder: tables.artworkSeriesLinks.sortOrder,
      isPrimary: tables.artworkSeriesLinks.isPrimary,
      createdAt: tables.artworks.createdAt,
      seriesSlug: tables.series.slug,
      seriesNameZh: tables.series.nameZh,
      seriesNameEn: tables.series.nameEn,
      seriesNameJa: tables.series.nameJa,
      categoryId: tables.series.categoryId,
    })
    .from(tables.artworks)
    .innerJoin(tables.artworkSeriesLinks, eq(tables.artworkSeriesLinks.artworkId, tables.artworks.id))
    .innerJoin(tables.series, eq(tables.series.id, tables.artworkSeriesLinks.seriesId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      asc(tables.artworkSeriesLinks.sortOrder),
      desc(tables.artworks.createdAt),
    )
    .limit(query.limit)
    .offset(query.offset)
    .all()

  const seen = new Set<string>()
  const items: typeof rows = []
  for (const row of rows) {
    if (seen.has(row.id)) {
      continue
    }
    seen.add(row.id)
    items.push(row)
  }

  return {
    items: items.map(row => ({
      ...row,
      url: versionBlobUrl(row.url, row.sizeBytes),
    })),
    pagination: {
      limit: query.limit,
      offset: query.offset,
      count: items.length,
    },
  }
})
