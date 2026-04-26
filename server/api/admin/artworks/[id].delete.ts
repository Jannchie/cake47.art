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
  const row = await db
    .select({ storageKey: tables.artworks.storageKey })
    .from(tables.artworks)
    .where(eq(tables.artworks.id, id))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await db.delete(tables.artworks).where(eq(tables.artworks.id, id)).run()
  await blob.del(row.storageKey).catch(() => {})

  await db
    .update(tables.series)
    .set({ coverArtworkId: null })
    .where(eq(tables.series.coverArtworkId, id))
    .run()

  return { ok: true }
})
