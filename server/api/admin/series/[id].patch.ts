import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'
import { slugify } from '~~/server/utils/ids'

const bodySchema = z.object({
  slug: z.string().min(1).max(64).optional(),
  categoryId: z.string().min(1).optional(),
  nameZh: z.string().min(1).optional(),
  nameEn: z.string().min(1).optional(),
  nameJa: z.string().min(1).optional(),
  descriptionZh: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionJa: z.string().optional(),
  coverArtworkId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }
  const body = await readValidatedBody(event, bodySchema.parse)

  const update: Record<string, unknown> = { ...body }
  if (body.slug !== undefined) {
    update.slug = slugify(body.slug)
  }

  if (Object.keys(update).length === 0) {
    return { ok: true }
  }

  const db = useDrizzle()
  await db
    .update(tables.series)
    .set(update)
    .where(eq(tables.series.id, id))
    .run()

  return { ok: true }
})
