import { CAROUSEL_PREFIX, SELECTED_PREFIX } from '~~/shared/home-slots'
import { assertAdmin } from '~~/server/utils/auth'
import { and, asc, eq, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const db = useDrizzle()

  const rows = await db
    .select({
      slotKey: tables.homeSlots.slotKey,
      artworkId: tables.artworks.id,
      url: tables.artworks.url,
      categoryId: tables.series.categoryId,
      seriesId: tables.series.id,
      seriesSlug: tables.series.slug,
      seriesNameZh: tables.series.nameZh,
      seriesNameEn: tables.series.nameEn,
      seriesNameJa: tables.series.nameJa,
      titleZh: tables.artworks.titleZh,
      titleEn: tables.artworks.titleEn,
      titleJa: tables.artworks.titleJa,
      objectPosition: tables.artworks.objectPosition,
      width: tables.artworks.width,
      height: tables.artworks.height,
      thumbHash: tables.artworks.thumbHash,
      position: tables.homeSlots.position,
      updatedAt: tables.homeSlots.updatedAt,
    })
    .from(tables.homeSlots)
    .innerJoin(tables.artworks, eq(tables.artworks.id, tables.homeSlots.artworkId))
    .innerJoin(tables.artworkSeriesLinks, and(
      eq(tables.artworkSeriesLinks.artworkId, tables.artworks.id),
      eq(tables.artworkSeriesLinks.isPrimary, true),
    ))
    .innerJoin(tables.series, eq(tables.series.id, tables.artworkSeriesLinks.seriesId))
    .orderBy(asc(tables.homeSlots.position))
    .all()

  const slots: Record<string, typeof rows[number]> = {}
  const selected: typeof rows = []
  const carousel: typeof rows = []
  for (const row of rows) {
    if (row.slotKey.startsWith(SELECTED_PREFIX)) {
      selected.push(row)
    }
    else if (row.slotKey.startsWith(CAROUSEL_PREFIX)) {
      carousel.push(row)
    }
    else {
      slots[row.slotKey] = row
    }
  }

  return { slots, selected, carousel }
})
