<script setup lang="ts">
import type { Locale } from '~/utils/useLocale'

definePageMeta({ middleware: ['i18n'] })

interface CategoryRow {
  id: string
  icon: string
  labelZh: string
  labelEn: string
  labelJa: string
  descriptionZh: string
  descriptionEn: string
  descriptionJa: string
  sortOrder: number
}

interface SeriesRow {
  id: string
  slug: string
  categoryId: string
  nameZh: string
  nameEn: string
  nameJa: string
  descriptionZh: string
  descriptionEn: string
  descriptionJa: string
  coverArtworkId: string | null
  coverUrl: string | null
  sortOrder: number
  artworkCount: number
}

interface ArtworkRow {
  id: string
  seriesId: string
  seriesSlug: string
  seriesNameZh: string
  seriesNameEn: string
  seriesNameJa: string
  categoryId: string
  titleZh: string
  titleEn: string
  titleJa: string
  descriptionZh: string
  descriptionEn: string
  descriptionJa: string
  url: string
  width: number
  height: number
  mimeType: string
  objectPosition: string | null
  isPrimary: boolean
  sortOrder: number
  createdAt: number | string
}

const { locale, setLocale, locales } = useLocaleState()
const route = useRoute()

const localeMeta: Record<Locale, { label: string }> = {
  'zh-CN': { label: 'CN' },
  'en': { label: 'EN' },
  'ja': { label: 'JP' },
}

const galleryTitle: Record<Locale, string> = {
  'zh-CN': '作品集 | cake47.art',
  en: 'Gallery | cake47.art',
  ja: '作品集 | cake47.art',
}

const galleryDescription: Record<Locale, string> = {
  'zh-CN': 'snowcake47 / 私期的作品集，按分类和系列浏览插画作品。',
  en: 'Browse snowcake47 illustration works by category and series.',
  ja: 'snowcake47 / 私期のイラスト作品をカテゴリとシリーズで閲覧できます。',
}

const copy = computed(() => {
  const map: Record<Locale, {
    backHome: string
    allCategories: string
    series: string
    empty: string
    countOf: string
    previous: string
    next: string
    brandSubtitle: string
  }> = {
    'zh-CN': {
      backHome: '返回',
      allCategories: '全部',
      series: '系列',
      empty: '暂无作品',
      countOf: '/',
      previous: '上一张',
      next: '下一张',
      brandSubtitle: 'snowcake47 ✦ 私期',
    },
    en: {
      backHome: 'Back',
      allCategories: 'All',
      series: 'Series',
      empty: 'No works yet',
      countOf: '/',
      previous: 'Previous artwork',
      next: 'Next artwork',
      brandSubtitle: 'snowcake47 ✦ Shiki',
    },
    ja: {
      backHome: '戻る',
      allCategories: 'すべて',
      series: 'シリーズ',
      empty: '作品はまだありません',
      countOf: '/',
      previous: '前の作品',
      next: '次の作品',
      brandSubtitle: 'snowcake47 ✦ 私期',
    },
  }
  return map[locale.value]
})

setHtmlLangByLocale()
setSeoMetaByLocale({
  path: '/gallery',
  title: galleryTitle,
  description: galleryDescription,
})

const { data: indexData } = await useFetch('/api/gallery')
const categories = computed<CategoryRow[]>(() => indexData.value?.categories ?? [])
const series = computed<SeriesRow[]>(() => indexData.value?.series ?? [])
const categoryArtworkCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const item of series.value) {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + item.artworkCount)
  }
  return counts
})
const allArtworkCount = computed(() => series.value.reduce((sum, item) => sum + item.artworkCount, 0))

const router = useRouter()

function readQueryString(value: unknown): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null
  }
  return typeof value === 'string' ? value : null
}

function normalizeCategoryId(value: string | null): string | null {
  if (value === 'game-fanart' || value === 'anime-fanart') {
    return 'fan-works'
  }
  return value
}

const activeCategory = computed(() => normalizeCategoryId(readQueryString(route.query.category)))
const activeSeries = computed(() => readQueryString(route.query.series))

function applyFilter(patch: Record<string, string | null>) {
  const next = { ...route.query }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete next[key]
    }
    else {
      next[key] = value
    }
  }
  router.replace({ query: next })
}

function normalizeLegacyCategoryQuery() {
  const rawCategory = readQueryString(route.query.category)
  const normalizedCategory = normalizeCategoryId(rawCategory)
  if (rawCategory && normalizedCategory && rawCategory !== normalizedCategory) {
    applyFilter({ category: normalizedCategory })
  }
}

const visibleSeries = computed(() => {
  if (!activeCategory.value) {
    return series.value
  }
  return series.value.filter(s => s.categoryId === activeCategory.value)
})

const artworksQuery = computed(() => {
  const params: Record<string, string> = {}
  if (activeCategory.value) {
    params.category = activeCategory.value
  }
  if (activeSeries.value) {
    params.series = activeSeries.value
  }
  params.limit = '200'
  return params
})

const { data: artworksData } = await useFetch('/api/gallery/artworks', {
  query: artworksQuery,
  watch: [artworksQuery],
})
const artworks = computed<ArtworkRow[]>(() => artworksData.value?.items ?? [])
const totalCount = computed(() => artworks.value.length)

const currentIndex = ref(0)
const filmstripRef = ref<HTMLElement | null>(null)
const filmstripDragging = ref(false)
let filmstripPointerId: number | null = null
let filmstripDragStartX = 0
let filmstripDragStartScrollLeft = 0
let filmstripDragMoved = false
let filmstripLastMoveX = 0
let filmstripLastMoveTime = 0
let filmstripScrollVelocity = 0
let filmstripInertiaFrame: number | null = null
let suppressFilmstripClick = false
let suppressFilmstripClickTimer: number | null = null

watch(artworks, () => {
  currentIndex.value = 0
  scrollFilmstripToCurrent()
})

const currentArtwork = computed(() => artworks.value[currentIndex.value] ?? null)

function selectIndex(i: number) {
  if (i < 0 || i >= artworks.value.length) {
    return
  }
  currentIndex.value = i
  scrollFilmstripToCurrent()
}

function next() {
  if (artworks.value.length === 0) {
    return
  }
  currentIndex.value = (currentIndex.value + 1) % artworks.value.length
  scrollFilmstripToCurrent()
}

function prev() {
  if (artworks.value.length === 0) {
    return
  }
  currentIndex.value = (currentIndex.value - 1 + artworks.value.length) % artworks.value.length
  scrollFilmstripToCurrent()
}

function scrollFilmstripToCurrent() {
  nextTick(() => {
    const strip = filmstripRef.value
    if (!strip) {
      return
    }
    const target = strip.querySelector<HTMLElement>(`[data-thumb-idx="${currentIndex.value}"]`)
    if (!target) {
      return
    }

    cancelFilmstripInertia()

    const targetCenter = target.offsetLeft + target.offsetWidth / 2
    const stripCenter = strip.clientWidth / 2
    strip.scrollTo({
      left: Math.max(0, targetCenter - stripCenter),
      behavior: 'smooth',
    })
  })
}

function clampFilmstripScroll(strip: HTMLElement, left: number) {
  return Math.min(Math.max(left, 0), Math.max(strip.scrollWidth - strip.clientWidth, 0))
}

function cancelFilmstripInertia() {
  if (filmstripInertiaFrame !== null) {
    cancelAnimationFrame(filmstripInertiaFrame)
    filmstripInertiaFrame = null
  }
}

function startFilmstripInertia() {
  const strip = filmstripRef.value
  if (!strip) {
    return
  }
  // px / ms; ignore tiny residuals so a near-still release does not coast.
  if (Math.abs(filmstripScrollVelocity) < 0.05) {
    return
  }

  cancelFilmstripInertia()

  // Cap initial speed so a quick flick stays controllable.
  const FRAME = 16.6667
  let velocity = Math.max(-3.2, Math.min(3.2, filmstripScrollVelocity)) * FRAME
  let lastTime = performance.now()

  const decayPerFrame = 0.94
  const stopThreshold = 0.25

  function step(now: number) {
    if (!strip) {
      filmstripInertiaFrame = null
      return
    }
    const dt = Math.max(1, now - lastTime)
    lastTime = now

    const moved = velocity * (dt / FRAME)
    const next = clampFilmstripScroll(strip, strip.scrollLeft + moved)

    if (next === strip.scrollLeft) {
      filmstripInertiaFrame = null
      return
    }
    strip.scrollLeft = next

    velocity *= Math.pow(decayPerFrame, dt / FRAME)

    if (Math.abs(velocity) < stopThreshold) {
      filmstripInertiaFrame = null
      return
    }
    filmstripInertiaFrame = requestAnimationFrame(step)
  }

  filmstripInertiaFrame = requestAnimationFrame(step)
}

function handleFilmstripWheel(event: WheelEvent) {
  const strip = filmstripRef.value
  if (!strip || strip.scrollWidth <= strip.clientWidth) {
    return
  }

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (delta === 0) {
    return
  }

  cancelFilmstripInertia()
  event.preventDefault()
  strip.scrollLeft = clampFilmstripScroll(strip, strip.scrollLeft + delta)
}

function handleFilmstripPointerDown(event: PointerEvent) {
  const strip = filmstripRef.value
  if (!strip || event.button !== 0) {
    return
  }

  cancelFilmstripInertia()
  filmstripPointerId = event.pointerId
  filmstripDragStartX = event.clientX
  filmstripDragStartScrollLeft = strip.scrollLeft
  filmstripDragMoved = false
  filmstripLastMoveX = event.clientX
  filmstripLastMoveTime = event.timeStamp || performance.now()
  filmstripScrollVelocity = 0
}

function handleFilmstripPointerMove(event: PointerEvent) {
  const strip = filmstripRef.value
  if (!strip || filmstripPointerId !== event.pointerId) {
    return
  }

  const deltaX = event.clientX - filmstripDragStartX
  if (Math.abs(deltaX) > 3) {
    filmstripDragMoved = true
  }

  if (filmstripDragMoved) {
    filmstripDragging.value = true
    if (!strip.hasPointerCapture(event.pointerId)) {
      strip.setPointerCapture(event.pointerId)
    }
    event.preventDefault()
    strip.scrollLeft = clampFilmstripScroll(strip, filmstripDragStartScrollLeft - deltaX)

    const now = event.timeStamp || performance.now()
    const dt = now - filmstripLastMoveTime
    if (dt > 0) {
      // Pointer moves +x → scroll moves -x; velocity stored in scrollLeft space.
      const sample = -(event.clientX - filmstripLastMoveX) / dt
      filmstripScrollVelocity = filmstripScrollVelocity * 0.6 + sample * 0.4
    }
    filmstripLastMoveX = event.clientX
    filmstripLastMoveTime = now
  }
}

function handleFilmstripPointerEnd(event: PointerEvent) {
  const strip = filmstripRef.value
  if (filmstripPointerId !== event.pointerId) {
    return
  }

  if (filmstripDragMoved) {
    suppressFilmstripClick = true
    if (suppressFilmstripClickTimer !== null) {
      window.clearTimeout(suppressFilmstripClickTimer)
    }
    suppressFilmstripClickTimer = window.setTimeout(() => {
      suppressFilmstripClick = false
      suppressFilmstripClickTimer = null
    }, 180)

    // If the last sample is too old, the finger paused before release — no flick.
    const now = event.timeStamp || performance.now()
    if (now - filmstripLastMoveTime > 80) {
      filmstripScrollVelocity = 0
    }

    if (event.type === 'pointerup') {
      startFilmstripInertia()
    }
  }

  if (strip?.hasPointerCapture(event.pointerId)) {
    strip.releasePointerCapture(event.pointerId)
  }
  filmstripPointerId = null
  filmstripDragging.value = false
}

function handleFilmThumbClick(event: MouseEvent, idx: number) {
  if (suppressFilmstripClick) {
    event.preventDefault()
    event.stopPropagation()
    suppressFilmstripClick = false
    if (suppressFilmstripClickTimer !== null) {
      window.clearTimeout(suppressFilmstripClickTimer)
      suppressFilmstripClickTimer = null
    }
    return
  }

  selectIndex(idx)
}

function localizedSeriesName(s: SeriesRow) {
  if (locale.value === 'zh-CN') {
    return s.nameZh
  }
  if (locale.value === 'ja') {
    return s.nameJa
  }
  return s.nameEn
}
function localizedCategoryName(c: CategoryRow) {
  if (locale.value === 'zh-CN') {
    return c.labelZh
  }
  if (locale.value === 'ja') {
    return c.labelJa
  }
  return c.labelEn
}
function localizedTitle(a: ArtworkRow) {
  if (locale.value === 'zh-CN') {
    return a.titleZh || a.seriesNameZh
  }
  if (locale.value === 'ja') {
    return a.titleJa || a.seriesNameJa
  }
  return a.titleEn || a.seriesNameEn
}
function localizedSeriesText(a: ArtworkRow) {
  if (locale.value === 'zh-CN') {
    return a.seriesNameZh
  }
  if (locale.value === 'ja') {
    return a.seriesNameJa
  }
  return a.seriesNameEn
}
function localizedDescription(a: ArtworkRow) {
  if (locale.value === 'zh-CN') {
    return a.descriptionZh
  }
  if (locale.value === 'ja') {
    return a.descriptionJa
  }
  return a.descriptionEn
}
function categoryById(id: string | null) {
  if (!id) {
    return null
  }
  return categories.value.find(c => c.id === id) ?? null
}

function categoryArtworkCount(catId: string) {
  return categoryArtworkCounts.value.get(catId) ?? 0
}

function onKeydown(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    next()
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prev()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  normalizeLegacyCategoryQuery()
  scrollFilmstripToCurrent()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  cancelFilmstripInertia()
  if (suppressFilmstripClickTimer !== null) {
    window.clearTimeout(suppressFilmstripClickTimer)
  }
})

watch(activeCategory, (val) => {
  if (val && activeSeries.value) {
    const stillBelongs = series.value.find(s => s.slug === activeSeries.value && s.categoryId === val)
    if (!stillBelongs) {
      applyFilter({ series: null })
    }
  }
})

watch(() => route.query.category, () => {
  normalizeLegacyCategoryQuery()
})
</script>

<template>
  <main class="hall">
    <div class="hall-grain" aria-hidden="true" />

    <NuxtLink :to="`/${locale}`" class="hall-back">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 12H5M12 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>{{ copy.backHome }}</span>
    </NuxtLink>

    <div class="hall-locales">
      <button
        v-for="code in locales"
        :key="code"
        type="button"
        class="hall-locale"
        :class="{ 'is-active': locale === code }"
        @click="setLocale(code)"
      >
        {{ localeMeta[code].label }}
      </button>
    </div>

    <aside class="index">
      <NuxtLink :to="`/${locale}`" class="index-brand">
        <span class="index-brand-mark">
          <img :src="'/api/files/brand/avatar.jpg'" alt="snowcake47">
        </span>
        <span class="index-brand-text">
          <strong>cake47.art</strong>
          <small>{{ copy.brandSubtitle }}</small>
        </span>
      </NuxtLink>

      <nav class="index-list">
        <button
          type="button"
          class="index-item"
          :class="{ 'is-active': !activeCategory }"
          @click="applyFilter({ category: null, series: null })"
        >
          <span class="index-item-num">00</span>
          <span class="index-item-label">{{ copy.allCategories }}</span>
          <span class="index-item-count">{{ allArtworkCount }}</span>
        </button>
        <button
          v-for="(cat, idx) in categories"
          :key="cat.id"
          type="button"
          class="index-item"
          :class="{ 'is-active': activeCategory === cat.id }"
          @click="applyFilter({ category: activeCategory === cat.id ? null : cat.id, series: null })"
        >
          <span class="index-item-num">{{ String(idx + 1).padStart(2, '0') }}</span>
          <span class="index-item-label">{{ localizedCategoryName(cat) }}</span>
          <span class="index-item-count">{{ categoryArtworkCount(cat.id) || '·' }}</span>
        </button>
      </nav>

      <Transition name="fade-soft">
        <nav v-if="visibleSeries.length > 0" class="index-series">
          <header>— {{ copy.series }}</header>
          <button
            type="button"
            class="index-series-item"
            :class="{ 'is-active': !activeSeries }"
            @click="applyFilter({ series: null })"
          >
            <span>{{ copy.allCategories }}</span>
          </button>
          <button
            v-for="s in visibleSeries"
            :key="s.id"
            type="button"
            class="index-series-item"
            :class="{ 'is-active': activeSeries === s.slug }"
            @click="applyFilter({ series: activeSeries === s.slug ? null : s.slug })"
          >
            <span>{{ localizedSeriesName(s) }}</span>
            <small>{{ s.artworkCount }}</small>
          </button>
        </nav>
      </Transition>
    </aside>

    <section class="stage">
      <div class="stage-canvas">
        <div v-if="!currentArtwork" class="stage-empty">
          <span class="stage-empty-mark" aria-hidden="true">∅</span>
          <p>{{ copy.empty }}</p>
        </div>

        <div v-else :key="currentArtwork.id" class="stage-image">
          <img
            :src="currentArtwork.url"
            :alt="localizedTitle(currentArtwork)"
            decoding="async"
          >
        </div>

        <button
          v-if="totalCount > 1"
          type="button"
          class="stage-nav stage-nav-prev"
          :aria-label="copy.previous"
          @click="prev"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          v-if="totalCount > 1"
          type="button"
          class="stage-nav stage-nav-next"
          :aria-label="copy.next"
          @click="next"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <footer v-if="currentArtwork" class="caption">
        <div class="caption-text">
          <h2 class="caption-title">{{ localizedTitle(currentArtwork) }}</h2>
          <p class="caption-meta">
            <span>{{ localizedSeriesText(currentArtwork) }}</span>
            <span class="caption-sep" aria-hidden="true">/</span>
            <span>
              {{
                categoryById(currentArtwork.categoryId)
                  ? localizedCategoryName(categoryById(currentArtwork.categoryId)!)
                  : currentArtwork.categoryId
              }}
            </span>
            <template v-if="currentArtwork.width > 0">
              <span class="caption-sep" aria-hidden="true">/</span>
              <span>{{ currentArtwork.width }} × {{ currentArtwork.height }}</span>
            </template>
          </p>
          <p v-if="localizedDescription(currentArtwork)" class="caption-desc">
            {{ localizedDescription(currentArtwork) }}
          </p>
        </div>

        <div class="caption-counter" aria-hidden="true">
          <em class="caption-counter-current">{{ String(currentIndex + 1).padStart(3, '0') }}</em>
          <em class="caption-counter-total">{{ String(totalCount).padStart(3, '0') }}</em>
        </div>
      </footer>

      <div class="film">
        <div
          ref="filmstripRef"
          class="film-strip"
          :class="{ 'is-dragging': filmstripDragging }"
          @wheel="handleFilmstripWheel"
          @pointerdown="handleFilmstripPointerDown"
          @pointermove="handleFilmstripPointerMove"
          @pointerup="handleFilmstripPointerEnd"
          @pointercancel="handleFilmstripPointerEnd"
        >
          <button
            v-for="(a, idx) in artworks"
            :key="a.id"
            type="button"
            class="film-thumb"
            :class="{ 'is-active': idx === currentIndex }"
            :data-thumb-idx="idx"
            :title="localizedTitle(a)"
            @click="handleFilmThumbClick($event, idx)"
          >
            <img :src="a.url" :alt="localizedTitle(a)" loading="lazy" draggable="false" :style="{ objectPosition: a.objectPosition ?? '50% 30%' }">
          </button>
          <div v-if="totalCount === 0" class="film-empty">
            {{ copy.empty }}
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hall {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  background:
    radial-gradient(circle at 18% 10%, #f6f3f3 0%, transparent 38%),
    radial-gradient(circle at 88% 92%, rgba(138, 24, 39, 0.05) 0%, transparent 42%),
    #f8f7f7;
  color: #16181f;
  font-family: 'Shippori Mincho', 'Noto Serif JP', 'Source Han Serif', serif;
  overflow: hidden;
}

.hall-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: multiply;
  opacity: 0.32;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

@media (max-width: 880px) {
  .hall {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }
}

/* ───── Floating corner controls ───── */
.hall-back {
  position: absolute;
  top: 1.4rem;
  left: 1.4rem;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #4a5061;
  transition: color 0.4s ease;
}

.hall-back svg {
  width: 14px;
  height: 14px;
  transition: transform 0.4s cubic-bezier(.2, .8, .2, 1);
}

.hall-back:hover { color: #8a1827; }
.hall-back:hover svg { transform: translateX(-3px); }

.hall-locales {
  position: absolute;
  top: 1.4rem;
  right: 1.4rem;
  z-index: 5;
  display: inline-flex;
  gap: 0.45rem;
}

.hall-locale {
  background: transparent;
  border: 0;
  padding: 0;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #8a8f9c;
  cursor: pointer;
  transition: color 0.3s ease;
}

.hall-locale:hover { color: #16181f; }

.hall-locale.is-active {
  color: #8a1827;
  position: relative;
}

.hall-locale.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 1px;
  background: #8a1827;
}

/* ───── Index column ───── */
.index {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 4.5rem 0 1.6rem 2rem;
  overflow-y: auto;
}

.index-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding-bottom: 2rem;
  margin-bottom: 1rem;
  position: relative;
}

.index-brand::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0.6rem;
  width: 28px;
  height: 1px;
  background: #8a1827;
  opacity: 0.7;
}

.index-brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  flex: 0 0 auto;
}

.index-brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.index-brand-text {
  display: grid;
  line-height: 1.15;
}

.index-brand-text strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.index-brand-text small {
  font-size: 0.62rem;
  color: #6c7384;
  letter-spacing: 0.1em;
  margin-top: 0.2rem;
}

.index-list { display: grid; gap: 0.05rem; }

.index-item {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: 0.7rem;
  padding: 0.55rem 0.6rem 0.55rem 0.6rem;
  background: transparent;
  border: 0;
  font-family: inherit;
  text-align: left;
  font-size: 1rem;
  letter-spacing: 0.01em;
  color: #4a5061;
  cursor: pointer;
  transition: color 0.4s cubic-bezier(.2, .8, .2, 1);
}

.index-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 2px;
  height: 0;
  background: #8a1827;
  transform: translateY(-50%);
  transition: height 0.4s cubic-bezier(.2, .8, .2, 1);
}

.index-item.is-active::before {
  height: 1.1em;
}

.index-item:hover {
  color: #16181f;
}

.index-item.is-active {
  color: #16181f;
}

.index-item.is-active .index-item-num { color: #8a1827; }

.index-item-num {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 500;
  font-size: 0.86rem;
  color: #a7969a;
  letter-spacing: 0.02em;
  width: 1.6em;
  transition: color 0.4s ease;
}

.index-item:hover .index-item-num { color: #8a1827; }

.index-item-label {
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  font-weight: 500;
}

.index-item-count {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.74rem;
  color: #9a8a8d;
  letter-spacing: 0.04em;
}

.index-series {
  display: grid;
  gap: 0.05rem;
  margin-top: 1.4rem;
}

.index-series header {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.78rem;
  color: #6c7384;
  letter-spacing: 0.1em;
  padding: 0 0 0.35rem 0.6rem;
}

.index-series-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: baseline;
  padding: 0.32rem 0.6rem 0.32rem 0.6rem;
  background: transparent;
  border: 0;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  text-align: left;
  font-size: 0.86rem;
  color: #6c7384;
  cursor: pointer;
  transition: color 0.4s ease;
}

.index-series-item:hover { color: #16181f; }

.index-series-item.is-active {
  color: #8a1827;
}

.index-series-item small {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.7rem;
  color: inherit;
  opacity: 0.85;
}

@media (max-width: 880px) {
  .index { display: none; }
}

/* ───── Stage ───── */
.stage {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto auto;
  min-width: 0;
  min-height: 0;
  padding: 2.6rem 3rem 1.4rem 1.4rem;
  overflow: hidden;
}

@media (max-width: 880px) {
  .stage { padding: 4rem 1.2rem 1rem; }
}

.stage-canvas {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  place-items: stretch;
  min-width: 0;
  min-height: 0;
  padding: 0.4rem;
  overflow: hidden;
}

.stage-canvas > * {
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
}

.stage-empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.8rem;
  color: #6c7384;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
}

.stage-empty-mark {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 4rem;
  color: #8a1827;
  opacity: 0.4;
}

.stage-image {
  position: relative;
  display: block;
}

.stage-image::before,
.stage-image::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  opacity: 0.55;
}

.stage-image::before {
  left: -2px;
  top: -2px;
  border-top: 1px solid #16181f;
  border-left: 1px solid #16181f;
}

.stage-image::after {
  right: -2px;
  bottom: -2px;
  border-bottom: 1px solid #16181f;
  border-right: 1px solid #16181f;
}

.stage-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 10px;
}

.stage-nav {
  position: absolute;
  top: 50%;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  color: #8a8f9c;
  font-family: inherit;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.5s ease, color 0.4s ease, transform 0.4s ease;
}

.stage-nav svg {
  width: 28px;
  height: 28px;
}

.stage-canvas:hover .stage-nav { opacity: 1; }

.stage-nav:hover { color: #8a1827; }

.stage-nav-prev { left: -0.4rem; }
.stage-nav-next { right: -0.4rem; }

.stage-nav-prev:hover { transform: translateY(-50%) translateX(-3px); }
.stage-nav-next:hover { transform: translateY(-50%) translateX(3px); }

@media (max-width: 720px) {
  .stage-nav { display: none; }
}

/* ───── Caption ───── */
.caption {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 1.6rem;
  padding: 1.4rem 0.4rem 0.6rem;
}

.caption-text {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.caption-title {
  margin: 0;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', 'Noto Serif JP', serif;
  font-size: clamp(1.4rem, 2vw, 1.85rem);
  font-weight: 400;
  letter-spacing: 0.01em;
  color: #16181f;
  line-height: 1.15;
}

.caption-title::first-letter { color: #8a1827; }

.caption-meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: #4a5061;
}

.caption-sep {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  color: #a7969a;
}

.caption-desc {
  margin: 0.4rem 0 0;
  font-size: 0.86rem;
  line-height: 1.7;
  color: #2c3140;
  max-width: 56ch;
}

.caption-counter {
  position: relative;
  display: inline-grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  font-feature-settings: "lnum" 1;
  min-width: 5.4rem;
  min-height: 4.2rem;
}

.caption-counter em {
  grid-column: 1;
  grid-row: 1;
  font-style: italic;
  display: inline-block;
}

.caption-counter-total {
  align-self: end;
  justify-self: end;
  font-size: 3.4rem;
  font-weight: 400;
  color: rgba(108, 115, 132, 0.32);
  letter-spacing: 0.04em;
  z-index: 1;
}

.caption-counter-current {
  align-self: start;
  justify-self: start;
  font-size: 2.6rem;
  font-weight: 600;
  color: #8a1827;
  letter-spacing: 0.01em;
  z-index: 2;
  transform: translate(-0.05em, -0.1em);
  text-shadow: 0 1px 0 rgba(248, 247, 247, 0.85);
}

@media (max-width: 720px) {
  .caption {
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: 0.6rem;
    padding: 0.9rem 0.4rem 0.4rem;
  }
  .caption-counter {
    display: inline-flex;
    align-items: baseline;
    grid-template-columns: none;
    grid-template-rows: none;
    min-width: 0;
    min-height: 0;
    line-height: 1;
    font-style: italic;
    justify-self: end;
  }
  .caption-counter em {
    align-self: auto;
    justify-self: auto;
    transform: none;
    text-shadow: none;
  }
  .caption-counter-current {
    font-size: 1.1rem;
    font-weight: 600;
    color: #8a1827;
  }
  .caption-counter-total {
    font-size: 0.92rem;
    color: #6c7384;
    margin-left: 0.18rem;
  }
  .caption-counter-total::before {
    content: '/';
    color: #a7969a;
    margin-right: 0.18rem;
  }
}

/* ───── Filmstrip ───── */
.film {
  position: relative;
  padding: 0.4rem 0 0.2rem;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
}

.film-strip {
  --film-edge-space: max(1.2rem, calc(50% - 35px));

  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem var(--film-edge-space);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-padding-inline: var(--film-edge-space);
  scroll-behavior: smooth;
  scrollbar-width: none;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}

.film-strip::-webkit-scrollbar { display: none; }

.film-strip.is-dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.film-thumb {
  position: relative;
  flex: 0 0 auto;
  width: 56px;
  height: 70px;
  background: #efece9;
  border: 0;
  border-radius: 6px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  filter: grayscale(0.4);
  opacity: 0.6;
  transform-origin: center bottom;
  transition:
    filter 0.5s ease,
    opacity 0.5s ease,
    transform 0.5s cubic-bezier(.2, .8, .2, 1),
    box-shadow 0.4s ease,
    width 0.4s cubic-bezier(.2, .8, .2, 1),
    height 0.4s cubic-bezier(.2, .8, .2, 1);
}

.film-strip.is-dragging .film-thumb {
  cursor: grabbing;
}

.film-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.film-thumb:hover {
  opacity: 1;
  filter: grayscale(0);
  transform: translateY(-3px);
}

.film-thumb.is-active {
  opacity: 1;
  filter: grayscale(0);
  width: 70px;
  height: 88px;
  border-radius: 8px;
  box-shadow: 0 0 0 3px #f8f7f7, 0 0 0 4px #8a1827;
}

.film-empty {
  flex: 1;
  display: grid;
  place-items: center;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.92rem;
  color: #6c7384;
  letter-spacing: 0.04em;
  padding: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
</style>
