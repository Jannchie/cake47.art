import { blob } from 'hub:blob'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const db = useDrizzle()
  const artworksToDelete = await db
    .select({ storageKey: tables.artworks.storageKey })
    .from(tables.artworks)
    .where(eq(tables.artworks.seriesId, id))
    .all()

  if (artworksToDelete.length > 0) {
    const keys = artworksToDelete.map(a => a.storageKey).filter(Boolean)
    if (keys.length > 0) {
      await blob.del(keys).catch(() => {})
    }
  }

  await db.delete(tables.series).where(eq(tables.series.id, id)).run()
  return { ok: true, removed: artworksToDelete.length }
})
