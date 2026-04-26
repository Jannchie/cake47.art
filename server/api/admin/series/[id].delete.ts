import { blob } from 'hub:blob'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, inArray, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const db = useDrizzle()

  const linkedArtworks = await db
    .select({ artworkId: tables.artworkSeriesLinks.artworkId })
    .from(tables.artworkSeriesLinks)
    .where(eq(tables.artworkSeriesLinks.seriesId, id))
    .all()
  const linkedIds = linkedArtworks.map(l => l.artworkId)

  await db.delete(tables.series).where(eq(tables.series.id, id)).run()

  let removed = 0
  if (linkedIds.length > 0) {
    const survivors = await db
      .select({ artworkId: tables.artworkSeriesLinks.artworkId })
      .from(tables.artworkSeriesLinks)
      .where(inArray(tables.artworkSeriesLinks.artworkId, linkedIds))
      .all()
    const survivorSet = new Set(survivors.map(s => s.artworkId))
    const orphanIds = linkedIds.filter(aid => !survivorSet.has(aid))

    if (orphanIds.length > 0) {
      const orphanRows = await db
        .select({ id: tables.artworks.id, storageKey: tables.artworks.storageKey })
        .from(tables.artworks)
        .where(inArray(tables.artworks.id, orphanIds))
        .all()
      const keys = orphanRows.map(o => o.storageKey).filter(Boolean)
      await db.delete(tables.artworks).where(inArray(tables.artworks.id, orphanIds)).run()
      if (keys.length > 0) {
        await blob.del(keys).catch(() => {})
      }
      removed = orphanRows.length
    }
  }

  return { ok: true, removed }
})
