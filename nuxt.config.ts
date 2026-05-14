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
    'nuxt-og-image',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-schema-org',
    'nuxt-seo-utils',
    'nuxt-link-checker',
    'nuxt-skew-protection',
    'nuxt-ai-ready'
  ],
  site: {
    url: 'https://cake47.art',
    name: 'cake47.art',
    description: 'snowcake47 / 私期 — illustration portfolio: fan works, original characters, and commercial commissions.',
    defaultLocale: 'en',
  },
  ogImage: {
    defaults: {
      width: 1200,
      height: 630,
      cacheMaxAgeSeconds: 60 * 60 * 24 * 7,
    },
    fontSubsets: ['latin', 'latin-ext', 'chinese-simplified', 'japanese'],
  },
  // server/routes/robots.txt.get.ts already serves a curated robots.txt with
  // tiered AI-crawler policy + Cloudflare Content Signals. Keep the module for
  // its <meta name="robots"> + X-Robots-Tag injection, but disable robotsTxt
  // generation so it doesn't shadow the hand-written file route.
  robots: {
    robotsTxt: false,
    credits: false,
  },
  // server/routes/sitemap.xml.get.ts serves a DB-driven sitemap with
  // image:image extensions per artwork. Leave the module installed for its
  // composables / dev tools, but disable the auto /sitemap.xml output.
  sitemap: {
    enabled: false,
  },
  // server/routes/{llms.txt,agent.txt,index.md} are hand-curated. Disable the
  // module's auto generation; we still benefit from its Markdown content
  // negotiation plugin if needed via explicit opt-in later.
  aiReady: {
    enabled: false,
  },
  // Site-wide JSON-LD identity. nuxt-schema-org auto-injects
  // Person/Organization/WebSite graphs on every page. The hand-written
  // setHomeStructuredData() still ships its richer FAQ/Service graph on the
  // home page; module-level identity covers everywhere else.
  schemaOrg: {
    identity: {
      type: 'Person',
      name: 'snowcake47',
      alternateName: ['私期', 'Shiki', 'cake47'],
      url: 'https://cake47.art',
      image: 'https://cake47.art/api/files/brand/avatar.jpg',
      jobTitle: 'Illustrator',
      worksFor: {
        '@type': 'Organization',
        'name': 'snowcake47 Illustration',
        'alternateName': ['私期の画室', 'cake47.art'],
        'url': 'https://cake47.art',
        'logo': 'https://cake47.art/api/files/brand/avatar.jpg',
      },
      sameAs: [
        'https://x.com/snowcake47',
        'https://bsky.app/profile/snowcake47.bsky.social',
        'https://weibo.com/2861524284',
        'https://www.mihuashi.com/profiles/2397',
        'https://www.rednote.com/user/profile/629e56300000000021029847',
      ],
    },
  },
  // Don't ship all three Noto Serif weights globally — each subset adds ~50KB.
  // Mark the fonts as available so unocss/styles that reference them resolve,
  // but rely on @nuxt/fonts' on-demand <link rel="preload"> mechanism + a
  // localised <FontPreloader> in the app shell to inject only the active
  // locale's family on initial paint.
  fonts: {
    families: [
      { name: 'Noto Serif', provider: 'google', weights: [400, 700] },
      { name: 'Noto Serif SC', provider: 'google', weights: [400, 700] },
      { name: 'Noto Serif JP', provider: 'google', weights: [400, 700] },
    ],
    defaults: {
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  },
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