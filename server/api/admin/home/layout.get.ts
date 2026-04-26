import { SELECTED_PREFIX } from '~~/shared/home-slots'
import { assertAdmin } from '~~/server/utils/auth'
import { asc, eq, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const db = useDrizzle()

  const rows = await db
    .select({
      slotKey: tables.homeSlots.slotKey,
      artworkId: tables.artworks.id,
      url: tables.artworks.url,
      categoryId: tables.series.categoryId,
      seriesId: tables.artworks.seriesId,
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
      position: tables.homeSlots.position,
      updatedAt: tables.homeSlots.updatedAt,
    })
    .from(tables.homeSlots)
    .innerJoin(tables.artworks, eq(tables.artworks.id, tables.homeSlots.artworkId))
    .innerJoin(tables.series, eq(tables.series.id, tables.artworks.seriesId))
    .orderBy(asc(tables.homeSlots.position))
    .all()

  const slots: Record<string, typeof rows[number]> = {}
  const selected: typeof rows = []
  for (const row of rows) {
    if (row.slotKey.startsWith(SELECTED_PREFIX)) {
      selected.push(row)
    }
    else {
      slots[row.slotKey] = row
    }
  }

  return { slots, selected }
})
