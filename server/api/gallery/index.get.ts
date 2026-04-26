import { asc, eq, sql, tables, useDrizzle } from '~~/server/utils/drizzle'
import { versionBlobUrl } from '~~/server/utils/blob-url'

export default defineEventHandler(async () => {
  const db = useDrizzle()

  const categoriesRows = await db
    .select()
    .from(tables.categories)
    .orderBy(asc(tables.categories.sortOrder), asc(tables.categories.id))
    .all()

  const seriesRows = await db
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
      artworkCount: sql<number>`count(${tables.artworkSeriesLinks.artworkId})`.as('artwork_count'),
    })
    .from(tables.series)
    .leftJoin(tables.artworkSeriesLinks, eq(tables.artworkSeriesLinks.seriesId, tables.series.id))
    .groupBy(tables.series.id)
    .orderBy(asc(tables.series.sortOrder), asc(tables.series.nameEn))
    .all()

  const coverIds = seriesRows
    .map(s => s.coverArtworkId)
    .filter((id): id is string => Boolean(id))

  const covers = coverIds.length > 0
    ? await db
        .select({ id: tables.artworks.id, url: tables.artworks.url, sizeBytes: tables.artworks.sizeBytes })
        .from(tables.artworks)
        .where(sql`${tables.artworks.id} in ${coverIds}`)
        .all()
    : []
  const coverMap = new Map(covers.map(c => [c.id, versionBlobUrl(c.url, c.sizeBytes)]))

  return {
    categories: categoriesRows,
    series: seriesRows.map(s => ({
      ...s,
      coverUrl: s.coverArtworkId ? coverMap.get(s.coverArtworkId) ?? null : null,
    })),
  }
})
