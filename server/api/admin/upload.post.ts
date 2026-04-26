import { assertAdmin } from '~~/server/utils/auth'
import { shortId } from '~~/server/utils/ids'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

export default defineEventHandler(async (event) => {
  assertAdmin(event)

  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 415,
      statusMessage: `Unsupported media type: ${file.type || 'unknown'}`,
    })
  }

  const ext = (file.name || '').split('.').pop()?.toLowerCase() ?? 'bin'
  const key = `gallery/${new Date().getFullYear()}/${shortId(16)}.${ext}`

  const stored = await hubBlob().put(key, file, {
    contentType: file.type,
    addRandomSuffix: false,
  })

  return {
    key: stored.pathname,
    url: `/api/files/${stored.pathname}`,
    contentType: stored.contentType,
    size: stored.size,
  }
})
