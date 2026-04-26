import { assertAdmin } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  assertAdmin(event)
  return { ok: true }
})
