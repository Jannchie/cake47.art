import { z } from 'zod'
import { and, asc, desc, eq, sql, tables, useDrizzle } from '~~/server/utils/drizzle'
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

  const slotPriorityExpr = sql<number>`CASE
    WHEN ${tables.homeSlots.slotKey} = 'hero' THEN 0
    WHEN ${tables.homeSlots.slotKey} LIKE 'selected.%' THEN 1
    ELSE 2
  END`

  const selectedPositionExpr = sql<number | null>`CASE
    WHEN ${tables.homeSlots.slotKey} LIKE 'selected.%' THEN ${tables.homeSlots.position}
    ELSE NULL
  END`

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
      thumbHash: tables.artworks.thumbHash,
      objectPosition: tables.artworks.objectPosition,
      sortOrder: tables.artworkSeriesLinks.sortOrder,
      isPrimary: tables.artworkSeriesLinks.isPrimary,
      createdAt: tables.artworks.createdAt,
      seriesSlug: tables.series.slug,
      seriesNameZh: tables.series.nameZh,
      seriesNameEn: tables.series.nameEn,
      seriesNameJa: tables.series.nameJa,
      categoryId: tables.series.categoryId,
      slotPriority: slotPriorityExpr.as('slot_priority'),
      slotPosition: selectedPositionExpr.as('slot_position'),
    })
    .from(tables.artworks)
    .innerJoin(tables.artworkSeriesLinks, eq(tables.artworkSeriesLinks.artworkId, tables.artworks.id))
    .innerJoin(tables.series, eq(tables.series.id, tables.artworkSeriesLinks.seriesId))
    .leftJoin(tables.homeSlots, eq(tables.homeSlots.artworkId, tables.artworks.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      asc(slotPriorityExpr),
      sql`${selectedPositionExpr} ASC NULLS LAST`,
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
