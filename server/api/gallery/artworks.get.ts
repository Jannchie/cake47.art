import { z } from 'zod'
import { and, asc, desc, eq, tables, useDrizzle } from '~~/server/utils/drizzle'

const querySchema = z.object({
  category: z.string().optional(),
  series: z.string().optional(),
  featured: z
    .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(60),
  offset: z.coerce.number().int().min(0).default(0),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const db = useDrizzle()

  const conditions = []
  if (query.series) {
    conditions.push(eq(tables.series.slug, query.series))
  }
  if (query.category) {
    conditions.push(eq(tables.series.categoryId, query.category))
  }
  if (query.featured === '1' || query.featured === 'true') {
    conditions.push(eq(tables.artworks.featured, true))
  }

  const rows = await db
    .select({
      id: tables.artworks.id,
      seriesId: tables.artworks.seriesId,
      titleZh: tables.artworks.titleZh,
      titleEn: tables.artworks.titleEn,
      titleJa: tables.artworks.titleJa,
      descriptionZh: tables.artworks.descriptionZh,
      descriptionEn: tables.artworks.descriptionEn,
      descriptionJa: tables.artworks.descriptionJa,
      url: tables.artworks.url,
      width: tables.artworks.width,
      height: tables.artworks.height,
      mimeType: tables.artworks.mimeType,
      objectPosition: tables.artworks.objectPosition,
      featured: tables.artworks.featured,
      sortOrder: tables.artworks.sortOrder,
      createdAt: tables.artworks.createdAt,
      seriesSlug: tables.series.slug,
      seriesNameZh: tables.series.nameZh,
      seriesNameEn: tables.series.nameEn,
      seriesNameJa: tables.series.nameJa,
      categoryId: tables.series.categoryId,
    })
    .from(tables.artworks)
    .innerJoin(tables.series, eq(tables.series.id, tables.artworks.seriesId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      asc(tables.artworks.sortOrder),
      desc(tables.artworks.createdAt),
    )
    .limit(query.limit)
    .offset(query.offset)
    .all()

  return {
    items: rows,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      count: rows.length,
    },
  }
})
