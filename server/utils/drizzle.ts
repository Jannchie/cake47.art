import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'

export { sql, eq, and, or, asc, desc, like, inArray } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return db
}

export type Category = typeof schema.categories.$inferSelect
export type Series = typeof schema.series.$inferSelect
export type Artwork = typeof schema.artworks.$inferSelect
