import { drizzle } from 'drizzle-orm/d1'
import { hubDatabase } from '#imports'
import * as schema from '~~/server/database/schema'

export { sql, eq, and, or, asc, desc, like, inArray } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
}

export type Category = typeof schema.categories.$inferSelect
export type Series = typeof schema.series.$inferSelect
export type Artwork = typeof schema.artworks.$inferSelect
