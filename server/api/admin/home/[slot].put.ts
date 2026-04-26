import { z } from 'zod'
import { HOME_SLOT_KEYS } from '~~/shared/home-slots'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'

const bodySchema = z.object({
  artworkId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const slot = getRouterParam(event, 'slot')
  if (!slot || !HOME_SLOT_KEYS.has(slot)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown slot' })
  }
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

  const existing = await db
    .select({ slotKey: tables.homeSlots.slotKey })
    .from(tables.homeSlots)
    .where(eq(tables.homeSlots.slotKey, slot))
    .get()

  const now = Date.now()
  if (existing) {
    await db
      .update(tables.homeSlots)
      .set({ artworkId: body.artworkId, updatedAt: new Date(now) })
      .where(eq(tables.homeSlots.slotKey, slot))
      .run()
  }
  else {
    await db.insert(tables.homeSlots).values({
      slotKey: slot,
      artworkId: body.artworkId,
      updatedAt: new Date(now),
    }).run()
  }

  return { ok: true, slot, artworkId: body.artworkId }
})
