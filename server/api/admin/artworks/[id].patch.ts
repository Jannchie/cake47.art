import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { and, eq, inArray, tables, useDrizzle } from '~~/server/utils/drizzle'

const bodySchema = z.object({
  seriesIds: z.array(z.string().min(1)).min(1).optional(),
  primarySeriesId: z.string().min(1).optional(),
  titleZh: z.string().optional(),
  titleEn: z.string().optional(),
  titleJa: z.string().optional(),
  descriptionZh: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionJa: z.string().optional(),
  objectPosition: z.string().nullable().optional(),
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
  const { seriesIds, primarySeriesId, setAsCover, sortOrder, ...artworkFields } = body

  const db = useDrizzle()

  const existing = await db
    .select({ id: tables.artworks.id })
    .from(tables.artworks)
    .where(eq(tables.artworks.id, id))
    .get()
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  }

  const updateFields = Object.fromEntries(
    Object.entries(artworkFields).filter(([, v]) => v !== undefined),
  )
  if (Object.keys(updateFields).length > 0) {
    await db
      .update(tables.artworks)
      .set(updateFields)
      .where(eq(tables.artworks.id, id))
      .run()
  }

  if (seriesIds && seriesIds.length > 0) {
    const uniqueIds = Array.from(new Set(seriesIds))
    const primary = primarySeriesId ?? uniqueIds[0]
    if (!uniqueIds.includes(primary)) {
      throw createError({ statusCode: 400, statusMessage: 'primarySeriesId must be one of seriesIds' })
    }

    const validSeries = await db
      .select({ id: tables.series.id })
      .from(tables.series)
      .where(inArray(tables.series.id, uniqueIds))
      .all()
    if (validSeries.length !== uniqueIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'Unknown seriesId in payload' })
    }

    const existingLinks = await db
      .select({ seriesId: tables.artworkSeriesLinks.seriesId, sortOrder: tables.artworkSeriesLinks.sortOrder })
      .from(tables.artworkSeriesLinks)
      .where(eq(tables.artworkSeriesLinks.artworkId, id))
      .all()
    const existingSortByseries = new Map(existingLinks.map(l => [l.seriesId, l.sortOrder]))
    const newSet = new Set(uniqueIds)
    const detachedSeriesIds = existingLinks
      .map(l => l.seriesId)
      .filter(sid => !newSet.has(sid))

    await db
      .delete(tables.artworkSeriesLinks)
      .where(eq(tables.artworkSeriesLinks.artworkId, id))
      .run()

    await db.insert(tables.artworkSeriesLinks).values(
      uniqueIds.map(seriesId => ({
        artworkId: id,
        seriesId,
        isPrimary: seriesId === primary,
        sortOrder: sortOrder ?? existingSortByseries.get(seriesId) ?? 0,
      })),
    ).run()

    if (detachedSeriesIds.length > 0) {
      await db
        .update(tables.series)
        .set({ coverArtworkId: null })
        .where(and(
          inArray(tables.series.id, detachedSeriesIds),
          eq(tables.series.coverArtworkId, id),
        ))
        .run()
    }
  }
  else if (primarySeriesId) {
    const target = await db
      .select({ seriesId: tables.artworkSeriesLinks.seriesId })
      .from(tables.artworkSeriesLinks)
      .where(and(
        eq(tables.artworkSeriesLinks.artworkId, id),
        eq(tables.artworkSeriesLinks.seriesId, primarySeriesId),
      ))
      .get()
    if (!target) {
      throw createError({ statusCode: 400, statusMessage: 'primarySeriesId is not linked to this artwork' })
    }
    await db
      .update(tables.artworkSeriesLinks)
      .set({ isPrimary: false })
      .where(eq(tables.artworkSeriesLinks.artworkId, id))
      .run()
    await db
      .update(tables.artworkSeriesLinks)
      .set({ isPrimary: true })
      .where(and(
        eq(tables.artworkSeriesLinks.artworkId, id),
        eq(tables.artworkSeriesLinks.seriesId, primarySeriesId),
      ))
      .run()
  }
  else if (sortOrder !== undefined) {
    await db
      .update(tables.artworkSeriesLinks)
      .set({ sortOrder })
      .where(eq(tables.artworkSeriesLinks.artworkId, id))
      .run()
  }

  if (setAsCover) {
    const targetSeriesId = primarySeriesId
      ?? (await db
        .select({ seriesId: tables.artworkSeriesLinks.seriesId })
        .from(tables.artworkSeriesLinks)
        .where(and(
          eq(tables.artworkSeriesLinks.artworkId, id),
          eq(tables.artworkSeriesLinks.isPrimary, true),
        ))
        .get())?.seriesId
    if (targetSeriesId) {
      await db
        .update(tables.series)
        .set({ coverArtworkId: id })
        .where(eq(tables.series.id, targetSeriesId))
        .run()
    }
  }

  return { ok: true }
})
