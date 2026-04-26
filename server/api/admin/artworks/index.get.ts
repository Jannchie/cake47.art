import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { and, desc, eq, inArray, tables, useDrizzle } from '~~/server/utils/drizzle'

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

  let filteredArtworkIds: string[] | null = null
  if (query.series || query.category) {
    const conditions = []
    if (query.series) {
      conditions.push(eq(tables.series.slug, query.series))
    }
    if (query.category) {
      conditions.push(eq(tables.series.categoryId, query.category))
    }
    const matching = await db
      .selectDistinct({ artworkId: tables.artworkSeriesLinks.artworkId })
      .from(tables.artworkSeriesLinks)
      .innerJoin(tables.series, eq(tables.series.id, tables.artworkSeriesLinks.seriesId))
      .where(and(...conditions))
      .all()
    filteredArtworkIds = matching.map(m => m.artworkId)
    if (filteredArtworkIds.length === 0) {
      return { items: [] }
    }
  }

  const artworkRows = await db
    .select({
      id: tables.artworks.id,
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
      createdAt: tables.artworks.createdAt,
    })
    .from(tables.artworks)
    .where(filteredArtworkIds ? inArray(tables.artworks.id, filteredArtworkIds) : undefined)
    .orderBy(desc(tables.artworks.createdAt))
    .limit(query.limit)
    .offset(query.offset)
    .all()

  if (artworkRows.length === 0) {
    return { items: [] }
  }

  const ids = artworkRows.map(a => a.id)
  const linkRows = await db
    .select({
      artworkId: tables.artworkSeriesLinks.artworkId,
      seriesId: tables.artworkSeriesLinks.seriesId,
      isPrimary: tables.artworkSeriesLinks.isPrimary,
      sortOrder: tables.artworkSeriesLinks.sortOrder,
      seriesSlug: tables.series.slug,
      seriesNameEn: tables.series.nameEn,
      seriesNameZh: tables.series.nameZh,
      seriesNameJa: tables.series.nameJa,
      seriesSortOrder: tables.series.sortOrder,
      categoryId: tables.series.categoryId,
    })
    .from(tables.artworkSeriesLinks)
    .innerJoin(tables.series, eq(tables.series.id, tables.artworkSeriesLinks.seriesId))
    .where(inArray(tables.artworkSeriesLinks.artworkId, ids))
    .all()

  type LinkRow = typeof linkRows[number]
  const linksByArtwork = new Map<string, LinkRow[]>()
  for (const link of linkRows) {
    const arr = linksByArtwork.get(link.artworkId) ?? []
    arr.push(link)
    linksByArtwork.set(link.artworkId, arr)
  }

  return {
    items: artworkRows.map((art) => {
      const links = linksByArtwork.get(art.id) ?? []
      links.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) {
          return -1
        }
        if (!a.isPrimary && b.isPrimary) {
          return 1
        }
        return a.seriesSortOrder - b.seriesSortOrder
      })
      const primary = links.find(l => l.isPrimary) ?? links[0]
      return {
        ...art,
        seriesIds: links.map(l => l.seriesId),
        primarySeriesId: primary?.seriesId ?? '',
        categoryIds: Array.from(new Set(links.map(l => l.categoryId))),
        primaryCategoryId: primary?.categoryId ?? '',
        primarySeriesSlug: primary?.seriesSlug ?? '',
        primarySeriesNameEn: primary?.seriesNameEn ?? '',
        primarySeriesNameZh: primary?.seriesNameZh ?? '',
        primarySeriesNameJa: primary?.seriesNameJa ?? '',
        seriesEntries: links.map(l => ({
          seriesId: l.seriesId,
          seriesSlug: l.seriesSlug,
          seriesNameEn: l.seriesNameEn,
          seriesNameZh: l.seriesNameZh,
          seriesNameJa: l.seriesNameJa,
          categoryId: l.categoryId,
          isPrimary: l.isPrimary,
          sortOrder: l.sortOrder,
        })),
      }
    }),
  }
})
