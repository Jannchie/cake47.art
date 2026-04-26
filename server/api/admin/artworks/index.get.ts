import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { and, asc, desc, eq, tables, useDrizzle } from '~~/server/utils/drizzle'

const querySchema = z.object({
  series: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const query = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle()

  const conditions = []
  if (query.series) {
    conditions.push(eq(tables.series.slug, query.series))
  }
  if (query.category) {
    conditions.push(eq(tables.series.categoryId, query.category))
  }

  const rows = await db
    .select({
      id: tables.artworks.id,
      seriesId: tables.artworks.seriesId,
      seriesSlug: tables.series.slug,
      seriesNameEn: tables.series.nameEn,
      seriesNameZh: tables.series.nameZh,
      categoryId: tables.series.categoryId,
      titleZh: tables.artworks.titleZh,
      titleEn: tables.artworks.titleEn,
      titleJa: tables.artworks.titleJa,
      descriptionZh: tables.artworks.descriptionZh,
      descriptionEn: tables.artworks.descriptionEn,
      descriptionJa: tables.artworks.descriptionJa,
      url: tables.artworks.url,
      storageKey: tables.artworks.storageKey,
      width: tables.artworks.width,
      height: tables.artworks.height,
      mimeType: tables.artworks.mimeType,
      sizeBytes: tables.artworks.sizeBytes,
      objectPosition: tables.artworks.objectPosition,
      featured: tables.artworks.featured,
      sortOrder: tables.artworks.sortOrder,
      createdAt: tables.artworks.createdAt,
    })
    .from(tables.artworks)
    .innerJoin(tables.series, eq(tables.series.id, tables.artworks.seriesId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tables.artworks.createdAt), asc(tables.artworks.sortOrder))
    .limit(query.limit)
    .offset(query.offset)
    .all()

  return { items: rows }
})
