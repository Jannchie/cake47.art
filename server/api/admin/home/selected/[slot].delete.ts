import { SELECTED_PREFIX } from '~~/shared/home-slots'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const slot = getRouterParam(event, 'slot')
  if (!slot || !slot.startsWith(SELECTED_PREFIX)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid selected slot key' })
  }
  const db = useDrizzle()
  await db.delete(tables.homeSlots).where(eq(tables.homeSlots.slotKey, slot)).run()
  return { ok: true }
})
