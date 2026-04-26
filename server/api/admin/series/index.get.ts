import { assertAdmin } from '~~/server/utils/auth'
import { asc, eq, sql, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const db = useDrizzle()

  const rows = await db
    .select({
      id: tables.series.id,
      slug: tables.series.slug,
      categoryId: tables.series.categoryId,
      nameZh: tables.series.nameZh,
      nameEn: tables.series.nameEn,
      nameJa: tables.series.nameJa,
      descriptionZh: tables.series.descriptionZh,
      descriptionEn: tables.series.descriptionEn,
      descriptionJa: tables.series.descriptionJa,
      coverArtworkId: tables.series.coverArtworkId,
      sortOrder: tables.series.sortOrder,
      createdAt: tables.series.createdAt,
      artworkCount: sql<number>`count(${tables.artworkSeriesLinks.artworkId})`.as('artwork_count'),
    })
    .from(tables.series)
    .leftJoin(tables.artworkSeriesLinks, eq(tables.artworkSeriesLinks.seriesId, tables.series.id))
    .groupBy(tables.series.id)
    .orderBy(asc(tables.series.sortOrder), asc(tables.series.nameEn))
    .all()

  return { items: rows }
})
