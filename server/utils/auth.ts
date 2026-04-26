import type { H3Event } from 'h3'
import { createError, getRequestHeader, useRuntimeConfig } from '#imports'

export function assertAdmin(event: H3Event) {
  const config = useRuntimeConfig(event)
  const expected = config.adminToken
  if (!expected) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin token not configured. Set NUXT_ADMIN_TOKEN.',
    })
  }
  const header = getRequestHeader(event, 'authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  if (token !== expected) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
}
