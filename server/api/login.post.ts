import process from 'node:process'
import type { User } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const data = await readBody<{ username: string; password: string }>(event)
  const { username, password } = data
  const user = await prisma.user.findUnique({
    where: {
      name: username,
    },
  })
  if (!user) {
    throw createError({
      statusCode: 403,
      message: '登陆失败',
    })
  }
  const valid = await argon2.verify(user.password, password)
  if (!valid) {
    throw createError({
      statusCode: 403,
      message: '登陆失败',
    })
  }
  const token = getJWT(user)
  return { token }
})

function getJWT(user: User) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1d',
    },
  )
}
