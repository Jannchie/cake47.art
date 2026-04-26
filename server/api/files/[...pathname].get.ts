import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')?.split('?')[0]
  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'No pathname' })
  }
  setHeader(event, 'Cache-Control', import.meta.dev ? 'no-store' : 'public, max-age=31536000, immutable')
  return blob.serve(event, pathname)
})
