import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // On Render with PgBouncer, use connection limiting
  const config: Parameters<typeof PrismaClient>[0] = {
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  }

  // If DIRECT_DATABASE_URL is set, use it for migrations (bypasses PgBouncer)
  // Otherwise use regular DATABASE_URL
  return new PrismaClient(config)
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
