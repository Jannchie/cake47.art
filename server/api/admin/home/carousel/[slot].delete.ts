import { CAROUSEL_PREFIX } from '~~/shared/home-slots'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const slot = getRouterParam(event, 'slot')
  if (!slot || !slot.startsWith(CAROUSEL_PREFIX)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid carousel slot key' })
  }
  const db = useDrizzle()
  await db.delete(tables.homeSlots).where(eq(tables.homeSlots.slotKey, slot)).run()
  return { ok: true }
})
