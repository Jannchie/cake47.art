import { z } from 'zod'
import { assertAdmin } from '~~/server/utils/auth'
import { shortId, slugify } from '~~/server/utils/ids'
import { tables, useDrizzle } from '~~/server/utils/drizzle'

const bodySchema = z.object({
  slug: z.string().min(1).max(64).optional(),
  categoryId: z.string().min(1),
  nameZh: z.string().min(1),
  nameEn: z.string().min(1),
  nameJa: z.string().min(1),
  descriptionZh: z.string().default(''),
  descriptionEn: z.string().default(''),
  descriptionJa: z.string().default(''),
  sortOrder: z.number().int().default(0),
})

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDrizzle()

  const slug = body.slug?.length ? slugify(body.slug) : slugify(body.nameEn)
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }

  const id = shortId()
  await db.insert(tables.series).values({
    id,
    slug,
    categoryId: body.categoryId,
    nameZh: body.nameZh,
    nameEn: body.nameEn,
    nameJa: body.nameJa,
    descriptionZh: body.descriptionZh,
    descriptionEn: body.descriptionEn,
    descriptionJa: body.descriptionJa,
    sortOrder: body.sortOrder,
  }).run()

  return { id, slug }
})
