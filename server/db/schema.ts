import { sql } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  icon: text('icon').notNull().default('lucide:image'),
  labelZh: text('label_zh').notNull(),
  labelEn: text('label_en').notNull(),
  labelJa: text('label_ja').notNull(),
  descriptionZh: text('description_zh').notNull().default(''),
  descriptionEn: text('description_en').notNull().default(''),
  descriptionJa: text('description_ja').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const series = sqliteTable('series', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  nameZh: text('name_zh').notNull(),
  nameEn: text('name_en').notNull(),
  nameJa: text('name_ja').notNull(),
  descriptionZh: text('description_zh').notNull().default(''),
  descriptionEn: text('description_en').notNull().default(''),
  descriptionJa: text('description_ja').notNull().default(''),
  coverArtworkId: text('cover_artwork_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const artworks = sqliteTable('artworks', {
  id: text('id').primaryKey(),
  titleZh: text('title_zh').notNull().default(''),
  titleEn: text('title_en').notNull().default(''),
  titleJa: text('title_ja').notNull().default(''),
  descriptionZh: text('description_zh').notNull().default(''),
  descriptionEn: text('description_en').notNull().default(''),
  descriptionJa: text('description_ja').notNull().default(''),
  storageKey: text('storage_key').notNull(),
  url: text('url').notNull(),
  mimeType: text('mime_type').notNull().default('image/jpeg'),
  width: integer('width').notNull().default(0),
  height: integer('height').notNull().default(0),
  sizeBytes: integer('size_bytes').notNull().default(0),
  thumbHash: text('thumb_hash'),
  objectPosition: text('object_position'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const artworkSeriesLinks = sqliteTable(
  'artwork_series_links',
  {
    artworkId: text('artwork_id')
      .notNull()
      .references(() => artworks.id, { onDelete: 'cascade' }),
    seriesId: text('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  table => ({
    pk: primaryKey({ columns: [table.artworkId, table.seriesId] }),
    primaryUnique: uniqueIndex('artwork_series_links_primary_unique')
      .on(table.artworkId)
      .where(sql`${table.isPrimary} = 1`),
  }),
)

export const homeSlots = sqliteTable('home_slots', {
  slotKey: text('slot_key').primaryKey(),
  artworkId: text('artwork_id')
    .notNull()
    .references(() => artworks.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type CategoryRow = typeof categories.$inferSelect
export type SeriesRow = typeof series.$inferSelect
export type ArtworkRow = typeof artworks.$inferSelect
export type ArtworkSeriesLinkRow = typeof artworkSeriesLinks.$inferSelect
export type HomeSlotRow = typeof homeSlots.$inferSelect
