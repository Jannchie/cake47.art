import { blob } from 'hub:blob'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, tables, useDrizzle } from '~~/server/utils/drizzle'
import { shortId } from '~~/server/utils/ids'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const db = useDrizzle()
  const existing = await db
    .select({ storageKey: tables.artworks.storageKey })
    .from(tables.artworks)
    .where(eq(tables.artworks.id, id))
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  }

  const formData = await readFormData(event)
  const file = formData.get('file')
  const widthRaw = formData.get('width')
  const heightRaw = formData.get('height')

  if (!(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 415,
      statusMessage: `Unsupported media type: ${file.type || 'unknown'}`,
    })
  }

  const width = Number(widthRaw)
  const height = Number(heightRaw)
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image dimensions' })
  }

  const ext = (file.name || '').split('.').pop()?.toLowerCase() ?? 'bin'
  const key = `gallery/${new Date().getFullYear()}/${shortId(16)}.${ext}`

  const stored = await blob.put(key, file, {
    contentType: file.type,
    addRandomSuffix: false,
  })

  await db
    .update(tables.artworks)
    .set({
      storageKey: stored.pathname,
      url: `/api/files/${stored.pathname}`,
      mimeType: stored.contentType,
      sizeBytes: stored.size,
      width,
      height,
    })
    .where(eq(tables.artworks.id, id))
    .run()

  if (existing.storageKey && existing.storageKey !== stored.pathname) {
    await blob.del(existing.storageKey).catch(() => {})
  }

  return {
    ok: true,
    key: stored.pathname,
    url: `/api/files/${stored.pathname}`,
    contentType: stored.contentType,
    size: stored.size,
    width,
    height,
  }
})
