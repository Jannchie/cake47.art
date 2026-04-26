const cloudflarePreset = process.env.NITRO_PRESET?.includes('cloudflare') || process.env.CF_PAGES === '1'
const useD1Http = process.env.NUXT_HUB_DB_DRIVER === 'd1-http'

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const hubDb = useD1Http
  ? {
      dialect: 'sqlite' as const,
      driver: 'd1-http' as const,
      connection: {
        accountId: requireEnv('NUXT_HUB_CLOUDFLARE_ACCOUNT_ID'),
        apiToken: requireEnv('NUXT_HUB_CLOUDFLARE_API_TOKEN'),
        databaseId: requireEnv('NUXT_HUB_CLOUDFLARE_DATABASE_ID'),
      },
      applyMigrationsDuringBuild: false,
    }
  : cloudflarePreset
    ? {
        dialect: 'sqlite' as const,
        driver: 'd1' as const,
        connection: {
          databaseId: requireEnv('NUXT_HUB_CLOUDFLARE_DATABASE_ID'),
        },
        applyMigrationsDuringBuild: false,
      }
    : 'sqlite'

const hubBlob = cloudflarePreset
  ? {
      driver: 'cloudflare-r2' as const,
      binding: 'BLOB',
      bucketName: requireEnv('NUXT_HUB_CLOUDFLARE_R2_BUCKET'),
    }
  : true

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@unocss/nuxt',
    '@nuxthub/core',
  ],
  css: ['~/assets/css/main.css'],
  hub: {
    db: hubDb,
    blob: hubBlob,
  },
  nitro: {
    cloudflare: {
      wrangler: {
        name: process.env.CLOUDFLARE_WORKER_NAME || 'cake47-art',
      },
    },
    experimental: {
      tasks: true,
    },
  },
  runtimeConfig: {
    adminToken: '',
  },
})
