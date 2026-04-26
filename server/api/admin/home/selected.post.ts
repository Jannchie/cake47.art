import { z } from 'zod'
import { SELECTED_PREFIX } from '~~/shared/home-slots'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, like, sql, tables, useDrizzle } from '~~/server/utils/drizzle'

const bodySchema = z.object({
  artworkId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDrizzle()

  const artwork = await db
    .select({ id: tables.artworks.id })
    .from(tables.artworks)
    .where(eq(tables.artworks.id, body.artworkId))
    .get()
  if (!artwork) {
    throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  }

  const slotKey = `${SELECTED_PREFIX}${body.artworkId}`

  const dup = await db
    .select({ slotKey: tables.homeSlots.slotKey })
    .from(tables.homeSlots)
    .where(eq(tables.homeSlots.slotKey, slotKey))
    .get()
  if (dup) {
    throw createError({ statusCode: 409, statusMessage: 'Already in selected list' })
  }

  const max = await db
    .select({ value: sql<number>`coalesce(max(${tables.homeSlots.position}), -1)`.as('value') })
    .from(tables.homeSlots)
    .where(like(tables.homeSlots.slotKey, `${SELECTED_PREFIX}%`))
    .get()
  const nextPosition = (max?.value ?? -1) + 1

  await db.insert(tables.homeSlots).values({
    slotKey,
    artworkId: body.artworkId,
    position: nextPosition,
    updatedAt: new Date(),
  }).run()

  return { ok: true, slotKey, position: nextPosition }
})
