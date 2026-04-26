import { HOME_SLOT_KEYS } from '~~/shared/home-slots'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const slot = getRouterParam(event, 'slot')
  if (!slot || !HOME_SLOT_KEYS.has(slot)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown slot' })
  }
  const db = useDrizzle()
  await db.delete(tables.homeSlots).where(eq(tables.homeSlots.slotKey, slot)).run()
  return { ok: true }
})
