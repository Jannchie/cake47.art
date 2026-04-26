import { assertAdmin } from '~~/server/utils/auth'
import { asc, tables, useDrizzle } from '~~/server/utils/drizzle'

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const db = useDrizzle()
  const rows = await db
    .select()
    .from(tables.categories)
    .orderBy(asc(tables.categories.sortOrder), asc(tables.categories.id))
    .all()
  return { items: rows }
})
