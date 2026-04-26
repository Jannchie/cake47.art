import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, inArray, tables, useDrizzle } from '~~/server/utils/drizzle'
import { shortId } from '~~/server/utils/ids'

const bodySchema = z.object({
  seriesIds: z.array(z.string().min(1)).min(1),
  primarySeriesId: z.string().min(1),
  storageKey: z.string().min(1),
  url: z.string().min(1),
  mimeType: z.string().default('image/jpeg'),
  width: z.number().int().nonnegative().default(0),
  height: z.number().int().nonnegative().default(0),
  sizeBytes: z.number().int().nonnegative().default(0),
  titleZh: z.string().default(''),
  titleEn: z.string().default(''),
  titleJa: z.string().default(''),
  descriptionZh: z.string().default(''),
  descriptionEn: z.string().default(''),
  descriptionJa: z.string().default(''),
  objectPosition: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  setAsCover: z.boolean().default(false),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  if (!body.seriesIds.includes(body.primarySeriesId)) {
    throw createError({ statusCode: 400, statusMessage: 'primarySeriesId must be one of seriesIds' })
  }
  const uniqueSeriesIds = Array.from(new Set(body.seriesIds))

  const db = useDrizzle()

  const validSeries = await db
    .select({ id: tables.series.id })
    .from(tables.series)
    .where(inArray(tables.series.id, uniqueSeriesIds))
    .all()
  if (validSeries.length !== uniqueSeriesIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown seriesId in payload' })
  }

  const id = shortId()
  await db.insert(tables.artworks).values({
    id,
    storageKey: body.storageKey,
    url: body.url,
    mimeType: body.mimeType,
    width: body.width,
    height: body.height,
    sizeBytes: body.sizeBytes,
    titleZh: body.titleZh,
    titleEn: body.titleEn,
    titleJa: body.titleJa,
    descriptionZh: body.descriptionZh,
    descriptionEn: body.descriptionEn,
    descriptionJa: body.descriptionJa,
    objectPosition: body.objectPosition ?? null,
  }).run()

  await db.insert(tables.artworkSeriesLinks).values(
    uniqueSeriesIds.map(seriesId => ({
      artworkId: id,
      seriesId,
      isPrimary: seriesId === body.primarySeriesId,
      sortOrder: body.sortOrder,
    })),
  ).run()

  if (body.setAsCover) {
    await db
      .update(tables.series)
      .set({ coverArtworkId: id })
      .where(eq(tables.series.id, body.primarySeriesId))
      .run()
  }

  return { id }
})
