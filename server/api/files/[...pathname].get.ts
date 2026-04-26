export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'No pathname' })
  }
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return hubBlob().serve(event, pathname)
})
