import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'

const bodySchema = z.object({
  seriesId: z.string().min(1).optional(),
  titleZh: z.string().optional(),
  titleEn: z.string().optional(),
  titleJa: z.string().optional(),
  descriptionZh: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionJa: z.string().optional(),
  objectPosition: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  setAsCover: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }
  const body = await readValidatedBody(event, bodySchema.parse)
  const { setAsCover, ...rest } = body

  const db = useDrizzle()

  if (Object.keys(rest).length > 0) {
    await db
      .update(tables.artworks)
      .set(rest)
      .where(eq(tables.artworks.id, id))
      .run()
  }

  if (setAsCover) {
    const artwork = await db
      .select({ seriesId: tables.artworks.seriesId })
      .from(tables.artworks)
      .where(eq(tables.artworks.id, id))
      .get()
    if (artwork) {
      await db
        .update(tables.series)
        .set({ coverArtworkId: id })
        .where(eq(tables.series.id, artwork.seriesId))
        .run()
    }
  }

  return { ok: true }
})
