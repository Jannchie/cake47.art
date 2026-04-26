import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { assertAdmin } from '~~/server/utils/auth'
import { eq, like, tables, useDrizzle } from '~~/server/utils/drizzle'
import { shortId, slugify } from '~~/server/utils/ids'

type SeriesId =
  | 'original'
  | 'danganronpa'
  | 'star-rail'
  | 'duet-night-abyss'
  | 'magical-girl-witch-trials'
  | 'onmyoji'
  | 'vocaloid'
  | 'sousou-no-frieren'
  | 'code-geass'
  | 'commission'

type CategoryId = 'game-fanart' | 'anime-fanart' | 'original-oc' | 'commercial-commission'

interface SourceArtwork {
  series: SeriesId
  category: CategoryId
  src: string
  featured?: boolean
  objectPosition?: string
}

const SERIES_LABELS: Record<SeriesId, { zh: string; en: string; ja: string; sortOrder: number }> = {
  'original': { zh: '原创', en: 'Original', ja: 'オリジナル', sortOrder: 10 },
  'danganronpa': { zh: '弹丸论破', en: 'Danganronpa', ja: 'ダンガンロンパ', sortOrder: 20 },
  'star-rail': { zh: '崩坏：星穹铁道', en: 'Honkai: Star Rail', ja: '崩壊：スターレイル', sortOrder: 30 },
  'duet-night-abyss': { zh: 'Duet Night Abyss', en: 'Duet Night Abyss', ja: 'Duet Night Abyss', sortOrder: 40 },
  'magical-girl-witch-trials': { zh: '魔法少女审判', en: 'Magical Girl Witch Trials', ja: '魔法少女ウィッチ・トライアル', sortOrder: 50 },
  'onmyoji': { zh: '阴阳师', en: 'Onmyoji', ja: '陰陽師', sortOrder: 60 },
  'vocaloid': { zh: 'VOCALOID', en: 'VOCALOID', ja: 'VOCALOID', sortOrder: 70 },
  'sousou-no-frieren': { zh: '葬送的芙莉莲', en: 'Frieren: Beyond Journey\'s End', ja: '葬送のフリーレン', sortOrder: 80 },
  'code-geass': { zh: '反叛的鲁路修', en: 'Code Geass', ja: 'コードギアス', sortOrder: 90 },
  'commission': { zh: '委托', en: 'Commission', ja: '依頼', sortOrder: 100 },
}

const SOURCE_ARTWORKS: SourceArtwork[] = [
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-1.png', featured: true },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-2.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-3.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-4.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/butterfly-portrait.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/white-hair-snake.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/snow-portrait.jpg', featured: true },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/chiaki-nanami.jpg' },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/tsumugi-shirogane.jpg' },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/sayaka-maizono.jpg' },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/kaede-akamatsu.jpg' },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/evernight.jpg', featured: true },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/march-7th.jpg' },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/Firefly.png', featured: true },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/Hysilens.png' },
  { series: 'duet-night-abyss', category: 'game-fanart', src: '/images/snowcake47/game-fanart/duet-night-abyss/rebecca.jpg', featured: true },
  { series: 'magical-girl-witch-trials', category: 'game-fanart', src: '/images/snowcake47/game-fanart/magical-girl-witch-trials/black-red-portrait.jpg' },
  { series: 'onmyoji', category: 'game-fanart', src: '/images/snowcake47/game-fanart/onmyoji/HEVm68RbYAUmYxD.jpg', featured: true },
  { series: 'vocaloid', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/vocaloid/hatsune-miku.jpg' },
  { series: 'vocaloid', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/vocaloid/racing-miku.jpg', featured: true },
  { series: 'sousou-no-frieren', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/sousou-no-frieren/flamme.jpg' },
  { series: 'sousou-no-frieren', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/sousou-no-frieren/red-dress-portrait.jpg', featured: true },
  { series: 'code-geass', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/code-geass/euphemia-good-night.jpg', featured: true },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-accent-portrait.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-white-mage.jpg', featured: true },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/wisteria-twins.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/wedding-blue.jpg', featured: true },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-black-dress.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/red-crown-portrait.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/lemonne-birthday.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-hair-scythe.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/purple-spear.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/violet-duo.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/red-violinist.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/white-violinist.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-birthday-portrait.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/january-blue-commission.jpg' },
]

const HOME_SLOT_DEFAULTS: Record<string, string> = {
  'hero': '/images/snowcake47/game-fanart/onmyoji/HEVm68RbYAUmYxD.jpg',
  'category.game-fanart': '/images/snowcake47/game-fanart/magical-girl-witch-trials/black-red-portrait.jpg',
  'category.anime-fanart': '/images/snowcake47/anime-fanart/code-geass/euphemia-good-night.jpg',
  'category.original-oc': '/images/snowcake47/original-oc/butterfly-portrait.jpg',
  'category.commercial-commission': '/images/snowcake47/commercial-commission/red-crown-portrait.jpg',
  'ekac.0': '/images/snowcake47/original-oc/Ekac/Ekac-1.png',
  'ekac.1': '/images/snowcake47/original-oc/Ekac/Ekac-2.jpg',
  'ekac.2': '/images/snowcake47/original-oc/Ekac/Ekac-3.jpg',
  'ekac.3': '/images/snowcake47/original-oc/Ekac/Ekac-4.jpg',
}

const SELECTED_DEFAULT_PATHS: string[] = [
  '/images/snowcake47/original-oc/snow-portrait.jpg',
  '/images/snowcake47/anime-fanart/sousou-no-frieren/red-dress-portrait.jpg',
  '/images/snowcake47/game-fanart/honkai-star-rail/evernight.jpg',
  '/images/snowcake47/game-fanart/duet-night-abyss/rebecca.jpg',
  '/images/snowcake47/anime-fanart/vocaloid/racing-miku.jpg',
  '/images/snowcake47/commercial-commission/wedding-blue.jpg',
  '/images/snowcake47/original-oc/butterfly-portrait.jpg',
  '/images/snowcake47/anime-fanart/code-geass/euphemia-good-night.jpg',
]

const BRAND_FILES: { src: string; key: string }[] = [
  { src: '/images/snowcake47/brand/avatar.jpg', key: 'brand/avatar.jpg' },
]

function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase()
  if (e === 'jpg' || e === 'jpeg') {
    return 'image/jpeg'
  }
  if (e === 'png') {
    return 'image/png'
  }
  if (e === 'webp') {
    return 'image/webp'
  }
  if (e === 'avif') {
    return 'image/avif'
  }
  if (e === 'gif') {
    return 'image/gif'
  }
  return 'application/octet-stream'
}

async function readPublic(src: string): Promise<{ data: Buffer; ext: string; mime: string } | null> {
  const fsPath = resolvePath(process.cwd(), 'public', src.replace(/^\//, ''))
  if (!existsSync(fsPath)) {
    return null
  }
  const data = await readFile(fsPath)
  const ext = (src.split('.').pop() ?? '').toLowerCase()
  return { data, ext, mime: mimeFromExt(ext) }
}

function makeStorageKey(src: string): string {
  return `gallery/snowcake47${src.replace(/^\/images\/snowcake47/, '')}`
}

function titleFromSrc(src: string): string {
  const file = src.split('/').pop() ?? ''
  const name = file.replace(/\.[^.]+$/, '')
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export default defineEventHandler(async (event) => {
  assertAdmin(event)
  const db = useDrizzle()
  const blob = hubBlob()

  const summary = {
    series: { created: 0, existing: 0 },
    artworks: { created: 0, existing: 0, missing: 0 },
    homeSlots: { set: 0, missing: 0 },
    selected: { set: 0, missing: 0 },
    brand: { uploaded: 0, missing: 0 },
  }

  // 1. Series
  const seriesIdMap = new Map<SeriesId, string>()
  for (const sid of Object.keys(SERIES_LABELS) as SeriesId[]) {
    const labels = SERIES_LABELS[sid]
    const slug = slugify(sid)
    const existing = await db
      .select({ id: tables.series.id, slug: tables.series.slug })
      .from(tables.series)
      .where(eq(tables.series.slug, slug))
      .get()
    if (existing) {
      seriesIdMap.set(sid, existing.id)
      summary.series.existing++
      continue
    }
    const used = SOURCE_ARTWORKS.find(a => a.series === sid)
    if (!used) {
      continue
    }
    const newId = shortId()
    await db.insert(tables.series).values({
      id: newId,
      slug,
      categoryId: used.category,
      nameZh: labels.zh,
      nameEn: labels.en,
      nameJa: labels.ja,
      sortOrder: labels.sortOrder,
    }).run()
    seriesIdMap.set(sid, newId)
    summary.series.created++
  }

  // 2. Artworks — keyed by original src for reverse lookup later
  const artworkBySrc = new Map<string, string>()
  for (const item of SOURCE_ARTWORKS) {
    const seriesId = seriesIdMap.get(item.series)
    if (!seriesId) {
      summary.artworks.missing++
      continue
    }
    const storageKey = makeStorageKey(item.src)
    const existing = await db
      .select({ id: tables.artworks.id })
      .from(tables.artworks)
      .where(eq(tables.artworks.storageKey, storageKey))
      .get()
    if (existing) {
      artworkBySrc.set(item.src, existing.id)
      summary.artworks.existing++
      continue
    }

    const file = await readPublic(item.src)
    if (!file) {
      summary.artworks.missing++
      continue
    }

    const body = new Blob([file.data], { type: file.mime })
    const stored = await blob.put(storageKey, body, {
      contentType: file.mime,
      addRandomSuffix: false,
    })

    const id = shortId()
    await db.insert(tables.artworks).values({
      id,
      seriesId,
      storageKey: stored.pathname,
      url: `/api/files/${stored.pathname}`,
      mimeType: file.mime,
      sizeBytes: stored.size,
      titleEn: titleFromSrc(item.src),
      titleZh: '',
      titleJa: '',
      featured: !!item.featured,
      objectPosition: item.objectPosition ?? null,
    }).run()
    artworkBySrc.set(item.src, id)
    summary.artworks.created++
  }

  // 3. Home slots
  for (const [slotKey, src] of Object.entries(HOME_SLOT_DEFAULTS)) {
    const artworkId = artworkBySrc.get(src)
    if (!artworkId) {
      summary.homeSlots.missing++
      continue
    }
    const existing = await db
      .select({ slotKey: tables.homeSlots.slotKey })
      .from(tables.homeSlots)
      .where(eq(tables.homeSlots.slotKey, slotKey))
      .get()
    const now = new Date()
    if (existing) {
      await db
        .update(tables.homeSlots)
        .set({ artworkId, updatedAt: now })
        .where(eq(tables.homeSlots.slotKey, slotKey))
        .run()
    }
    else {
      await db.insert(tables.homeSlots).values({ slotKey, artworkId, updatedAt: now }).run()
    }
    summary.homeSlots.set++
  }

  // 3b. Selected list — wipe existing selected.* rows, then insert fresh with positional ordering
  await db.delete(tables.homeSlots).where(like(tables.homeSlots.slotKey, 'selected.%')).run()
  let selectedPos = 0
  for (const src of SELECTED_DEFAULT_PATHS) {
    const artworkId = artworkBySrc.get(src)
    if (!artworkId) {
      summary.selected.missing++
      continue
    }
    await db.insert(tables.homeSlots).values({
      slotKey: `selected.${artworkId}`,
      artworkId,
      position: selectedPos++,
      updatedAt: new Date(),
    }).run()
    summary.selected.set++
  }

  // 4. Brand assets
  for (const asset of BRAND_FILES) {
    const file = await readPublic(asset.src)
    if (!file) {
      summary.brand.missing++
      continue
    }
    const body = new Blob([file.data], { type: file.mime })
    await blob.put(asset.key, body, { contentType: file.mime, addRandomSuffix: false })
    summary.brand.uploaded++
  }

  return { ok: true, summary }
})
