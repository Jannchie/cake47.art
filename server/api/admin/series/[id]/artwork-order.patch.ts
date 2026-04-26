import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { and, eq, tables, useDrizzle } from '~~/server/utils/drizzle'

const bodySchema = z.object({
  artworkIds: z.array(z.string().min(1)),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDrizzle()

  const series = await db
    .select({ id: tables.series.id })
    .from(tables.series)
    .where(eq(tables.series.id, id))
    .get()
  if (!series) {
    throw createError({ statusCode: 404, statusMessage: 'Series not found' })
  }

  for (let i = 0; i < body.artworkIds.length; i++) {
    await db
      .update(tables.artworkSeriesLinks)
      .set({ sortOrder: i })
      .where(and(
        eq(tables.artworkSeriesLinks.seriesId, id),
        eq(tables.artworkSeriesLinks.artworkId, body.artworkIds[i]!),
      ))
      .run()
  }
  return { ok: true, count: body.artworkIds.length }
})
