<script setup lang="ts">
import { artworkCategories, type ArtworkCategoryId } from '~/data/artworks'
import type { Locale } from '~/utils/useLocale'

setHtmlLangByLocale()
setSeoMetaByLocale()

const { locale } = useLocaleState()

const copyByLocale: Record<Locale, {
  navWorks: string
  navProfile: string
  navContact: string
  navEkac: string
  navCollection: string
  navArchive: string
  brandSubtitle: string
  works: string
  collection: string
  profile: string
  profileBio: string
  contact: string
  open: string
  ekac: string
  scrollCue: string
  heroStudio: string
  marqueeIllustration: string
  marqueeCharacterDesign: string
  marqueeArtist: string
  marqueeSince: string
  sectionProfile: string
  sectionWorks: string
  sectionEkac: string
  sectionCollection: string
  sectionContact: string
  featured: string
  footerCredit: string
}> = {
  'zh-CN': {
    navWorks: '作品',
    navProfile: '关于',
    navContact: '联络',
    navEkac: 'Ekac',
    navCollection: '创作方向',
    navArchive: '作品集',
    brandSubtitle: 'snowcake47 ✦ 私期',
    works: '作品',
    collection: '创作方向',
    profile: '关于私期',
    profileBio: '插画师。兴趣是打卡各种美食，并在 Google Maps 留下评价。',
    contact: '联络',
    open: '前往',
    ekac: 'Ekac',
    scrollCue: '向下浏览',
    heroStudio: '私期的画室',
    marqueeIllustration: '插画',
    marqueeCharacterDesign: '角色设计',
    marqueeArtist: '私期',
    marqueeSince: '2017 起',
    sectionProfile: '关于',
    sectionWorks: '作品',
    sectionEkac: 'Ekac',
    sectionCollection: '创作方向',
    sectionContact: '联络',
    featured: '主推',
    footerCredit: 'snowcake47 / 私期',
  },
  en: {
    navWorks: 'Works',
    navProfile: 'Profile',
    navContact: 'Contact',
    navEkac: 'Ekac',
    navCollection: 'Collection',
    navArchive: 'Gallery',
    brandSubtitle: 'snowcake47 ✦ Shiki',
    works: 'Works',
    collection: 'Collection',
    profile: 'About snowcake47',
    profileBio: 'Illustrator. Spends free time hopping between restaurants and leaving Google Maps reviews.',
    contact: 'Contact',
    open: 'visit',
    ekac: 'Ekac',
    scrollCue: 'Scroll',
    heroStudio: 'snowcake47 Studio',
    marqueeIllustration: 'Illustration',
    marqueeCharacterDesign: 'Character Design',
    marqueeArtist: 'Shiki',
    marqueeSince: 'Since 2017',
    sectionProfile: 'Profile',
    sectionWorks: 'Works',
    sectionEkac: 'Ekac',
    sectionCollection: 'Collection',
    sectionContact: 'Contact',
    featured: 'Featured',
    footerCredit: 'snowcake47 / Shiki',
  },
  ja: {
    navWorks: '作品',
    navProfile: 'プロフィール',
    navContact: 'コンタクト',
    navEkac: 'Ekac',
    navCollection: 'カテゴリ',
    navArchive: '作品集',
    brandSubtitle: 'snowcake47 ✦ 私期',
    works: '作品',
    collection: 'カテゴリ',
    profile: '私期について',
    profileBio: 'イラストレーター。趣味はあちこちのお店を巡り、Google マップにレビューを残すこと。',
    contact: 'コンタクト',
    open: 'ひらく',
    ekac: 'Ekac',
    scrollCue: 'スクロール',
    heroStudio: '私期の画室',
    marqueeIllustration: 'イラスト',
    marqueeCharacterDesign: 'キャラクターデザイン',
    marqueeArtist: '私期',
    marqueeSince: '2017年から',
    sectionProfile: 'プロフィール',
    sectionWorks: '作品',
    sectionEkac: 'Ekac',
    sectionCollection: 'カテゴリ',
    sectionContact: 'コンタクト',
    featured: '注目作品',
    footerCredit: 'snowcake47 / 私期',
  },
}

const copy = computed(() => copyByLocale[locale.value])

const localeLinks = [
  { label: 'JP', full: '日本語', href: '/ja' },
  { label: 'EN', full: 'English', href: '/en' },
  { label: 'CN', full: '中文', href: '/zh-CN' },
]

const socialLinks = [
  {
    label: 'X',
    handle: '@snowcake47',
    href: 'https://x.com/snowcake47',
    icon: 'ri:twitter-x-line',
    accent: '#16181f',
  },
  {
    label: 'Pixiv',
    handle: 'id / 3626004',
    href: 'https://www.pixiv.net/users/3626004',
    icon: 'simple-icons:pixiv',
    accent: '#23496f',
  },
  {
    label: 'Weibo',
    handle: '2861524284',
    href: 'https://weibo.com/2861524284',
    icon: 'simple-icons:sinaweibo',
    accent: '#5e0f1c',
  },
]

interface HomeSlotPayload {
  url: string
  categoryId: string
  seriesNameZh: string
  seriesNameEn: string
  seriesNameJa: string
  titleZh: string
  titleEn: string
  titleJa: string
  objectPosition: string | null
}

interface SlotRender {
  src: string
  category: ArtworkCategoryId
  seriesLabel: string
  objectPosition?: string
}

const { data: layoutData } = await useFetch<{ slots: Record<string, HomeSlotPayload>; selected: HomeSlotPayload[] }>('/api/home/layout', {
  default: () => ({ slots: {}, selected: [] }),
})

function pickByLocale(zh: string, en: string, ja: string): string {
  if (locale.value === 'zh-CN') {
    return zh || en
  }
  if (locale.value === 'ja') {
    return ja || en
  }
  return en || zh
}

function payloadToSlot(p: HomeSlotPayload): SlotRender {
  return {
    src: p.url,
    category: p.categoryId as ArtworkCategoryId,
    seriesLabel: pickByLocale(p.seriesNameZh, p.seriesNameEn, p.seriesNameJa),
    objectPosition: p.objectPosition ?? undefined,
  }
}

function resolveSlot(slotKey: string): SlotRender | null {
  const override = layoutData.value?.slots?.[slotKey]
  return override ? payloadToSlot(override) : null
}

function categoryText(id: ArtworkCategoryId): string {
  return artworkCategories.find(c => c.id === id)?.label[locale.value] ?? id
}

const heroFeature = computed(() => resolveSlot('hero'))

const selectedArtworks = computed(() =>
  (layoutData.value?.selected ?? []).map(payloadToSlot),
)

const categoryShowcases = computed(() => artworkCategories
  .map(category => ({ category, artwork: resolveSlot(`category.${category.id}`) }))
  .filter((entry): entry is { category: typeof artworkCategories[number]; artwork: SlotRender } => !!entry.artwork),
)

const ekacArtworks = computed(() =>
  Array.from({ length: 4 }, (_, idx) => resolveSlot(`ekac.${idx}`))
    .filter((s): s is SlotRender => !!s),
)

const heroTitleChars = 'Snowcake47'.split('')

const BRAND_AVATAR_URL = '/api/files/brand/avatar.jpg'

const mounted = ref(false)
const navScrolled = ref(false)
let sectionScrollFrame: number | null = null
let revealObserver: IntersectionObserver | null = null
let previousScrollRestoration: ScrollRestoration | null = null

function handleNavScroll() {
  navScrolled.value = window.scrollY > 4
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

function sectionTargetFromHash(hash: string) {
  if (!hash.startsWith('#')) {
    return null
  }
  const id = decodeURIComponent(hash.slice(1))
  return id ? document.getElementById(id) : null
}

function cancelSectionScroll() {
  if (sectionScrollFrame !== null) {
    cancelAnimationFrame(sectionScrollFrame)
    sectionScrollFrame = null
  }
}

function updateHashWithoutJump(hash: string) {
  if (window.location.hash === hash) {
    return
  }
  window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
}

function scrollToSection(hash: string, updateHash = true) {
  const target = sectionTargetFromHash(hash)
  if (!target) {
    return
  }

  cancelSectionScroll()

  if (updateHash) {
    updateHashWithoutJump(hash)
  }

  const startTop = window.scrollY
  const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY)
  const distance = targetTop - startTop

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(distance) < 2) {
    window.scrollTo({ top: targetTop, left: window.scrollX, behavior: 'auto' })
    return
  }

  const duration = 820
  const startTime = performance.now()

  function step(now: number) {
    const progress = Math.min(1, (now - startTime) / duration)
    const eased = easeInOutCubic(progress)
    window.scrollTo({ top: startTop + distance * eased, left: window.scrollX, behavior: 'auto' })

    if (progress < 1) {
      sectionScrollFrame = requestAnimationFrame(step)
    }
    else {
      sectionScrollFrame = null
    }
  }

  sectionScrollFrame = requestAnimationFrame(step)
}

function handleSectionLinkClick(event: MouseEvent, hash: string) {
  event.preventDefault()
  scrollToSection(hash)
}

function handleHashNavigation() {
  if (window.location.hash) {
    scrollToSection(window.location.hash, false)
  }
}

function setupReveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]')
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

  for (const target of targets) {
    observer.observe(target)
  }
  return observer
}

onMounted(() => {
  mounted.value = true

  if ('scrollRestoration' in window.history) {
    previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
  }

  handleNavScroll()
  window.addEventListener('scroll', handleNavScroll, { passive: true })
  window.addEventListener('popstate', handleHashNavigation)
  window.addEventListener('hashchange', handleHashNavigation)
  window.addEventListener('wheel', cancelSectionScroll, { passive: true })
  window.addEventListener('touchstart', cancelSectionScroll, { passive: true })

  revealObserver = setupReveal()

  if (window.location.hash) {
    requestAnimationFrame(() => handleHashNavigation())
  }
})

onBeforeUnmount(() => {
  cancelSectionScroll()
  window.removeEventListener('scroll', handleNavScroll)
  window.removeEventListener('popstate', handleHashNavigation)
  window.removeEventListener('hashchange', handleHashNavigation)
  window.removeEventListener('wheel', cancelSectionScroll)
  window.removeEventListener('touchstart', cancelSectionScroll)
  revealObserver?.disconnect()
  if (previousScrollRestoration) {
    window.history.scrollRestoration = previousScrollRestoration
  }
})
</script>

<template>
  <main class="portfolio-shell" :class="{ 'is-mounted': mounted }">
    <LoadingOverlay :subtitle="copy.heroStudio" />
    <BackgroundOrnament />
    <div class="grain-overlay" aria-hidden="true" />

    <header class="site-nav" :class="{ 'is-scrolled': navScrolled }">
      <NuxtLink :to="`/${locale}`" class="brand">
        <span class="brand-mark">
          <img :src="BRAND_AVATAR_URL" alt="snowcake47">
          <span class="brand-mark-ring" aria-hidden="true" />
        </span>
        <span class="brand-text">
          <strong>cake47.art</strong>
          <small>{{ copy.brandSubtitle }}</small>
        </span>
      </NuxtLink>

      <nav class="site-nav-links">
        <a href="#profile" @click="handleSectionLinkClick($event, '#profile')"><em>01</em>{{ copy.navProfile }}</a>
        <a href="#works" @click="handleSectionLinkClick($event, '#works')"><em>02</em>{{ copy.navWorks }}</a>
        <a href="#ekac" @click="handleSectionLinkClick($event, '#ekac')"><em>03</em>{{ copy.navEkac }}</a>
        <a href="#collection" @click="handleSectionLinkClick($event, '#collection')"><em>04</em>{{ copy.navCollection }}</a>
        <a href="#contact" @click="handleSectionLinkClick($event, '#contact')"><em>05</em>{{ copy.navContact }}</a>
        <NuxtLink :to="`/${locale}/gallery`" class="nav-archive"><em>06</em>{{ copy.navArchive }}<span class="nav-archive-arrow" aria-hidden="true">→</span></NuxtLink>
      </nav>

      <div class="locale-switcher">
        <NuxtLink
          v-for="link in localeLinks"
          :key="link.href"
          :href="link.href"
          class="locale-pill"
          :class="{ 'is-active': link.href === `/${locale}` }"
        >
          <span>{{ link.label }}</span>
          <small>{{ link.full }}</small>
        </NuxtLink>
      </div>
    </header>

    <section class="hero">
      <ClientOnly>
        <ThreeScene class="hero-three" />
      </ClientOnly>

      <div class="hero-overlay">
        <a href="#profile" class="hero-scroll-cue" :aria-label="copy.scrollCue" @click="handleSectionLinkClick($event, '#profile')">
          <span>{{ copy.scrollCue }}</span>
          <svg viewBox="0 0 18 32" aria-hidden="true">
            <path d="M9 2v24M2 20l7 7 7-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </div>

      <div class="hero-marquee" aria-hidden="true">
        <div class="hero-marquee-track">
          <span v-for="i in 12" :key="i">
            <em>✟</em> {{ copy.marqueeIllustration }} <em>✟</em> {{ copy.marqueeCharacterDesign }} <em>✟</em> SNOWCAKE47 <em>✟</em> {{ copy.marqueeArtist }} <em>✟</em> {{ copy.marqueeSince }}
          </span>
        </div>
      </div>
    </section>

    <section class="intro">
      <div class="intro-grid">
        <h1 class="hero-title" data-reveal style="--reveal-delay: 80ms">
          <span class="hero-title-row">
            <span
              v-for="(char, i) in heroTitleChars"
              :key="i"
              class="hero-char"
              :class="{ 'is-accent': i >= 8 }"
              :style="{ animationDelay: `${0.2 + i * 0.06}s` }"
            >{{ char }}</span>
          </span>
          <span class="hero-title-jp">
            <span class="hero-title-jp-deco" aria-hidden="true">◆</span>
            <span class="hero-title-jp-text" :class="{ 'is-latin': locale === 'en' }">{{ copy.heroStudio }}</span>
            <span class="hero-title-jp-deco" aria-hidden="true">◆</span>
          </span>
        </h1>
      </div>
    </section>

    <section id="profile" class="profile">
      <SectionFlow variant="sweep" />
      <div class="profile-grid">
        <div class="profile-portrait" data-reveal>
          <div class="profile-portrait-frame">
            <img :src="BRAND_AVATAR_URL" alt="snowcake47 avatar">
          </div>
        </div>

        <div class="profile-content" data-reveal style="--reveal-delay: 120ms">
          <span class="section-num">01 / {{ copy.sectionProfile }}</span>
          <h2 class="section-title">{{ copy.profile }}</h2>
          <p class="profile-bio">
            {{ copy.profileBio }}
          </p>
        </div>
      </div>
    </section>

    <section id="works" class="works">
      <SectionFlow variant="corner" />
      <div class="section-head" data-reveal>
        <span class="section-num">02 / {{ copy.sectionWorks }}</span>
        <h2 class="section-title">
          {{ copy.works }}
          <svg class="section-title-flourish" viewBox="0 0 200 20" aria-hidden="true">
            <path d="M0,10 Q50,-5 100,10 T200,10" fill="none" stroke="#16181f" stroke-width="1" stroke-linecap="round" opacity="0.5" />
          </svg>
        </h2>
      </div>

      <figure v-if="heroFeature" class="work-feature" data-reveal>
        <svg class="work-feature-corner work-feature-corner-tl" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M0 14V0h14" fill="none" stroke="#16181f" stroke-width="1" />
          <circle cx="3.5" cy="3.5" r="1.4" fill="#8a1827" />
        </svg>
        <svg class="work-feature-corner work-feature-corner-tr" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M0 14V0h14" fill="none" stroke="#16181f" stroke-width="1" />
          <circle cx="3.5" cy="3.5" r="1.4" fill="#8a1827" />
        </svg>
        <svg class="work-feature-corner work-feature-corner-bl" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M0 14V0h14" fill="none" stroke="#16181f" stroke-width="1" />
          <circle cx="3.5" cy="3.5" r="1.4" fill="#8a1827" />
        </svg>
        <svg class="work-feature-corner work-feature-corner-br" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M0 14V0h14" fill="none" stroke="#16181f" stroke-width="1" />
          <circle cx="3.5" cy="3.5" r="1.4" fill="#8a1827" />
        </svg>

        <header class="work-feature-meta">
          <span class="work-feature-tag">
            <span class="work-feature-tag-mark">★</span>
            {{ copy.featured }}
          </span>
          <span class="work-feature-divider" aria-hidden="true" />
          <span class="work-feature-series">{{ categoryText(heroFeature.category) }}</span>
          <span class="work-feature-counter">N°00</span>
        </header>

        <div class="work-feature-frame">
          <img :src="heroFeature.src" :alt="heroFeature.seriesLabel" decoding="async">
        </div>

        <figcaption class="work-feature-caption">
          <div class="work-feature-info">
            <strong>{{ heroFeature.seriesLabel }}</strong>
            <em>{{ categoryText(heroFeature.category) }}</em>
          </div>
          <span class="work-feature-flourish" aria-hidden="true">✦ ❅ ✦</span>
        </figcaption>
      </figure>

      <div class="works-grid">
        <figure
          v-for="(artwork, index) in selectedArtworks"
          :key="artwork.src"
          class="work"
          data-reveal
          :style="{ '--reveal-delay': `${(index % 3) * 90}ms` }"
        >
          <div class="work-frame">
            <img :src="artwork.src" :alt="artwork.seriesLabel" decoding="async">
          </div>
          <figcaption class="work-caption">
            <strong>{{ artwork.seriesLabel }}</strong>
            <em>{{ categoryText(artwork.category) }}</em>
          </figcaption>
        </figure>
      </div>
    </section>

    <section id="ekac" class="ekac">
      <SectionFlow variant="split" />
      <div class="section-head" data-reveal>
        <span class="section-num">03 / {{ copy.sectionEkac }}</span>
        <h2 class="section-title">
          {{ copy.ekac }}
          <svg class="section-title-flourish" viewBox="0 0 200 20" aria-hidden="true">
            <path d="M0,10 Q50,-5 100,10 T200,10" fill="none" stroke="#8a1827" stroke-width="1" stroke-linecap="round" opacity="0.6" />
          </svg>
        </h2>
      </div>

      <figure v-if="ekacArtworks[0]" class="ekac-main" data-reveal>
        <img :src="ekacArtworks[0].src" :alt="copy.ekac" decoding="async">
      </figure>

      <div class="ekac-thumbs" data-reveal>
        <figure
          v-for="artwork in ekacArtworks.slice(1)"
          :key="artwork.src"
        >
          <img
            :src="artwork.src"
            :alt="copy.ekac"
            decoding="async"
            :style="{ objectPosition: artwork.objectPosition ?? '50% 22%' }"
          >
        </figure>
      </div>
    </section>

    <section id="collection" class="categories">
      <SectionFlow variant="cluster" mirror />
      <div class="section-head" data-reveal>
        <span class="section-num">04 / {{ copy.sectionCollection }}</span>
        <h2 class="section-title">
          {{ copy.collection }}
          <svg class="section-title-flourish" viewBox="0 0 200 20" aria-hidden="true">
            <path d="M0,10 Q50,25 100,10 T200,10" fill="none" stroke="#16181f" stroke-width="1" stroke-linecap="round" opacity="0.5" />
          </svg>
        </h2>
      </div>

      <div class="categories-grid">
        <article
          v-for="(item, idx) in categoryShowcases"
          :key="item.category.id"
          class="category-card"
          data-reveal
          :style="{ '--reveal-delay': `${idx * 90}ms` }"
        >
          <div class="category-media">
            <img
              :src="item.artwork.src"
              :alt="item.artwork.seriesLabel"
              decoding="async"
              :style="{ objectPosition: item.artwork.objectPosition ?? '50% 18%' }"
            >
            <span class="category-glow" aria-hidden="true" />
          </div>
          <div class="category-meta">
            <span class="category-num">0{{ idx + 1 }}</span>
            <Icon :name="item.category.icon" class="category-icon" />
            <h3>{{ item.category.label[locale] }}</h3>
            <p>{{ item.category.description[locale] }}</p>
          </div>
        </article>
      </div>
    </section>

    <section id="contact" class="contact">
      <SectionFlow variant="mark" />
      <div class="section-head" data-reveal>
        <span class="section-num">05 / {{ copy.sectionContact }}</span>
        <h2 class="section-title">
          {{ copy.contact }}
          <svg class="section-title-flourish" viewBox="0 0 200 20" aria-hidden="true">
            <path d="M0,10 Q50,25 100,10 T200,10" fill="none" stroke="#16181f" stroke-width="1" stroke-linecap="round" opacity="0.5" />
          </svg>
        </h2>
      </div>

      <ul class="contact-list">
        <li
          v-for="(link, idx) in socialLinks"
          :key="link.href"
          data-reveal
          :style="{ '--reveal-delay': `${idx * 90}ms`, '--accent': link.accent }"
        >
          <NuxtLink :href="link.href" target="_blank" rel="noopener noreferrer">
            <span class="contact-num">0{{ idx + 1 }}</span>
            <Icon :name="link.icon" class="contact-icon" />
            <span class="contact-label">{{ link.label }}</span>
            <span class="contact-handle">{{ link.handle }}</span>
            <span class="contact-cta">
              {{ copy.open }}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <footer class="site-footer">
      <div class="site-footer-mark">
        <span>cake47.art</span>
        <small>© {{ new Date().getFullYear() }} {{ copy.footerCredit }}</small>
      </div>
      <div class="site-footer-deco" aria-hidden="true">
        ✦ ❅ ✦ ❅ ✦ ❅ ✦
      </div>
    </footer>
  </main>
</template>

<style scoped>
.portfolio-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 12%, #f4f0f1 0%, transparent 42%),
    radial-gradient(circle at 86% 8%, #f7f5f6 0%, transparent 38%),
    radial-gradient(circle at 78% 96%, rgba(138, 24, 39, 0.06) 0%, transparent 48%),
    #f8f7f7;
  color: #16181f;
  font-family: var(--font-body);
}

.grain-overlay {
  position: fixed;
  z-index: var(--z-grain);
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.5;
  pointer-events: none;
  mix-blend-mode: multiply;
}

/* ───── Site nav ───── */
.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
  padding: 0.55rem 1.4rem;
  pointer-events: none;
  isolation: isolate;
}

.site-nav::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(248, 247, 247, 0);
  backdrop-filter: blur(0);
  -webkit-backdrop-filter: blur(0);
  border-bottom: 1px solid transparent;
  transition:
    background 0.3s ease,
    backdrop-filter 0.3s ease,
    -webkit-backdrop-filter 0.3s ease,
    border-color 0.3s ease;
  pointer-events: none;
}

.site-nav.is-scrolled::before {
  background: rgba(248, 247, 247, 0.72);
  backdrop-filter: blur(14px) saturate(1.08);
  -webkit-backdrop-filter: blur(14px) saturate(1.08);
  border-bottom-color: rgba(22, 24, 31, 0.06);
}

.site-nav > * {
  pointer-events: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-mark {
  position: relative;
  display: block;
  width: 34px;
  height: 34px;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 2;
}

.brand-mark-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px dashed rgba(22, 24, 31, 0.32);
  animation: brandRing 18s linear infinite;
}

@keyframes brandRing {
  to { transform: rotate(360deg); }
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-text strong {
  font-family: var(--font-display);
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.brand-text small {
  font-size: 0.62rem;
  color: var(--color-ink-soft);
  letter-spacing: 0.08em;
}

.site-nav-links {
  display: none;
  gap: 1.1rem;
  font-size: 0.82rem;
  font-weight: 600;
}

@media (min-width: 1024px) {
  .site-nav-links { display: flex; }
}

.site-nav-links a {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  position: relative;
  transition: color 0.3s ease;
}

.site-nav-links a em {
  font-style: normal;
  font-size: 0.62rem;
  color: #6c7384;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.site-nav-links a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 100%;
  bottom: -4px;
  height: 1.5px;
  background: #16181f;
  transition: right 0.4s ease;
}

.site-nav-links a:hover { color: #16181f; }
.site-nav-links a:hover::after { right: 0; }

.site-nav-links .nav-archive .nav-archive-arrow {
  margin-left: 0.25rem;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.86em;
  color: #8a1827;
  transition: transform 0.4s cubic-bezier(.2, .8, .2, 1);
}

.site-nav-links .nav-archive:hover .nav-archive-arrow {
  transform: translateX(4px);
}

.locale-switcher {
  display: flex;
  gap: 0.35rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgba(42, 37, 48, 0.04);
}

.locale-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.32rem 0.66rem;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--color-ink);
  transition: all 0.3s ease;
}

.locale-pill small { display: none; }

.locale-pill.is-active {
  background: #16181f;
  color: #fafafa;
}

.locale-pill:not(.is-active):hover {
  background: rgba(77, 114, 176, 0.16);
  color: #5e0f1c;
}

/* ───── Hero ───── */
.hero {
  position: relative;
  height: 100vh;
  min-height: 580px;
  width: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 40%, #fbfafa 0%, #f3f2f3 70%, #ececed 100%);
}

.hero-three {
  position: absolute !important;
  inset: 0;
  z-index: 5;
  width: 100% !important;
  height: 100% !important;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}

.hero-scroll-cue {
  position: absolute;
  left: 50%;
  bottom: 7.6rem;
  transform: translateX(-50%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.8rem;
  pointer-events: auto;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: var(--color-ink);
  opacity: 0.85;
  transition: opacity 0.3s ease;
}

.hero-scroll-cue:hover { opacity: 1; }

.hero-scroll-cue svg {
  width: 20px;
  height: 32px;
  animation: scrollCueBob 2.4s ease-in-out infinite;
}

@keyframes scrollCueBob {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(6px); opacity: 1; }
}

@media (max-width: 640px) {
  .hero-scroll-cue {
    bottom: 6rem;
    font-size: 0.7rem;
    letter-spacing: 0.34em;
  }

  .hero-scroll-cue svg {
    width: 18px;
    height: 28px;
  }
}

/* ───── Intro section (below hero) ───── */
.intro {
  position: relative;
  z-index: var(--z-content);
  padding: 5rem 1.6rem 3rem;
}

.intro-grid {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 1.4rem;
}

.hero-title {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-display);
  font-weight: 300;
  font-size: clamp(2.8rem, 9vw, 7.6rem);
  line-height: 1;
  letter-spacing: 0.04em;
  color: #16181f;
  margin: 0;
  text-align: center;
  font-variant-numeric: lining-nums;
  font-feature-settings: 'lnum' 1;
}

.hero-title-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.02em;
  justify-content: center;
}

.hero-char {
  display: inline-block;
  color: #16181f;
  opacity: 0;
  transform: translateY(60%) rotate(8deg);
  animation: charIn 1s cubic-bezier(.2, .8, .2, 1) forwards;
}

.hero-char.is-accent {
  color: #8a1827;
}

@keyframes charIn {
  to { opacity: 1; transform: translateY(0) rotate(0); }
}

.hero-title-jp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9em;
  font-family: var(--font-display);
  font-size: 0.22em;
  margin-top: 0.6em;
  font-weight: 300;
  color: #6c7384;
  opacity: 0;
  animation: heroIn 0.9s cubic-bezier(.2, .8, .2, 1) 1.5s forwards;
}

.hero-title-jp-text {
  letter-spacing: 0.6em;
  padding-left: 0.6em;
}

.hero-title-jp-text.is-latin {
  letter-spacing: 0.16em;
  padding-left: 0.16em;
}

.hero-title-jp-deco {
  display: inline-block;
  font-size: 0.55em;
  color: #8a1827;
  transform: translateY(-0.05em);
}

@keyframes heroIn {
  to { opacity: 1; transform: translateY(0); }
}

.hero-marquee {
  position: absolute;
  z-index: 6;
  bottom: 4.5rem;
  left: 0;
  right: 0;
  overflow: hidden;
  pointer-events: none;
  border-block: 1px solid rgba(42, 37, 48, 0.08);
  background: rgba(238, 240, 243, 0.5);
  padding: 0.85rem 0;
  /* Parallax transform comes in via inline style; keep this layer free of
     other transforms so the inner track's animation isn't overridden. */
  will-change: transform;
}

.hero-marquee-track {
  display: flex;
  width: max-content;
  gap: 2rem;
  white-space: nowrap;
  animation: marquee 32s linear infinite;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.92rem;
  letter-spacing: 0.16em;
  color: var(--color-ink);
}

.hero-marquee-track > span {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
}

.hero-marquee-track em {
  font-style: normal;
  color: var(--color-ink-soft);
}

@keyframes marquee {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}

/* ───── Sections ───── */
.profile,
.works,
.ekac,
.categories,
.contact {
  position: relative;
  isolation: isolate;
}

.profile > *:not(.flow),
.works > *:not(.flow),
.ekac > *:not(.flow),
.categories > *:not(.flow),
.contact > *:not(.flow) {
  position: relative;
  z-index: 1;
}

.categories > .flow {
  top: -90px;
}

.section-head {
  display: grid;
  gap: 1rem;
  margin: 0 auto 3rem;
  max-width: 720px;
  justify-items: center;
  text-align: center;
}

.section-num {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #16181f;
}

.section-num::before,
.section-num::after {
  content: '';
  width: 14px;
  height: 1px;
  background: var(--color-ink);
  opacity: 0.5;
}

.section-title {
  position: relative;
  display: inline-block;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 4.6rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
}

.section-title-flourish {
  display: block;
  width: 8em;
  max-width: 220px;
  height: 18px;
  margin-top: 0.4rem;
}

.section-lead {
  font-size: 1rem;
  color: #6c7384;
  max-width: 38em;
  line-height: 1.6;
}

[data-reveal] {
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity 0.9s cubic-bezier(.2, .8, .2, 1) var(--reveal-delay, 0ms),
    transform 0.9s cubic-bezier(.2, .8, .2, 1) var(--reveal-delay, 0ms);
}

[data-reveal].is-revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ───── Works ───── */
.works {
  position: relative;
  z-index: var(--z-content);
  padding: 7rem 1.6rem 5rem;
}

.work-feature {
  position: relative;
  display: grid;
  gap: 1.4rem;
  max-width: 1380px;
  margin: 0 auto 5rem;
  padding: 1.8rem 1.8rem 1.5rem;
  background:
    linear-gradient(180deg, #fbfafa 0%, #f4f3f3 100%);
  border: 1px solid rgba(22, 24, 31, 0.16);
  box-shadow:
    0 28px 60px -28px rgba(22, 24, 31, 0.22),
    inset 0 0 0 1px rgba(250, 250, 250, 0.6);
}

.work-feature::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(22, 24, 31, 0.08);
  pointer-events: none;
  z-index: 1;
}

.work-feature-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  z-index: 4;
  pointer-events: none;
  display: block;
}

.work-feature-corner-tl { top: -9px; left: -9px; }
.work-feature-corner-tr { top: -9px; right: -9px; transform: rotate(90deg); }
.work-feature-corner-br { bottom: -9px; right: -9px; transform: rotate(180deg); }
.work-feature-corner-bl { bottom: -9px; left: -9px; transform: rotate(-90deg); }

.work-feature-meta {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #16181f;
  padding: 0.2rem 0.4rem 0;
}

.work-feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.78rem 0.32rem 0.6rem;
  background: #16181f;
  color: #fafafa;
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

.work-feature-tag-mark {
  color: #e5546a;
  filter: drop-shadow(0 0 4px rgba(229, 84, 106, 0.45));
  font-size: 0.86rem;
  line-height: 1;
}

.work-feature-divider {
  flex: 0 0 auto;
  width: 48px;
  height: 1px;
  background: linear-gradient(90deg, rgba(22, 24, 31, 0.4), rgba(22, 24, 31, 0));
}

.work-feature-series {
  font-weight: 600;
  letter-spacing: 0.18em;
  color: #6c7384;
}

.work-feature-counter {
  margin-left: auto;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: none;
  color: #8a1827;
}

.work-feature-frame {
  position: relative;
  z-index: 2;
  overflow: visible;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.12);
  aspect-ratio: 16 / 9;
  outline: 1px solid rgba(250, 250, 250, 0.9);
  outline-offset: 4px;
}

.work-feature-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-feature-caption {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1.2rem;
  padding: 0.4rem 0.4rem 0.2rem;
}

.work-feature-info { display: grid; gap: 0.25rem; }

.work-feature-info strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 400;
  letter-spacing: 0.01em;
  color: #16181f;
}

.work-feature-info em {
  font-style: normal;
  font-size: 0.74rem;
  color: #6c7384;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.work-feature-flourish {
  font-size: 0.78rem;
  letter-spacing: 0.4em;
  color: #8a1827;
}

@media (max-width: 640px) {
  .work-feature { padding: 1.2rem; }
  .work-feature-meta { gap: 0.6rem; font-size: 0.66rem; }
  .work-feature-counter { width: 100%; margin-left: 0; }
  .work-feature-divider { width: 32px; }
  .work-feature-flourish { display: none; }
  .work-feature-caption { grid-template-columns: 1fr; gap: 0.8rem; }
  .work-feature-info strong { font-size: 1.25rem; }
}

.works-grid {
  column-count: 1;
  column-gap: 1.6rem;
  max-width: 1280px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .works-grid { column-count: 2; }
}

@media (min-width: 1024px) {
  .works-grid { column-count: 3; }
}

.work {
  position: relative;
  display: block;
  margin: 0 0 2.4rem;
  break-inside: avoid;
  page-break-inside: avoid;
}

.work-frame {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  background: #fff;
  border: 1px solid rgba(42, 37, 48, 0.08);
  box-shadow: 0 8px 30px rgba(42, 37, 48, 0.08);
}

.work-frame img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.work-caption {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.7rem;
  padding: 0 0.2rem;
}

.work-caption strong {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.work-caption em {
  font-style: normal;
  font-size: 0.78rem;
  color: #6c7384;
  letter-spacing: 0.04em;
}

/* ───── Ekac (OC spotlight) ───── */
.ekac {
  position: relative;
  z-index: var(--z-content);
  padding: 6rem 1.6rem;
}

.ekac-main {
  position: relative;
  margin: 0 auto;
  max-width: 540px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(42, 37, 48, 0.10);
  box-shadow: 0 22px 50px -16px rgba(42, 37, 48, 0.18);
}

.ekac-main img {
  display: block;
  width: 100%;
  height: auto;
}

.ekac-main::before,
.ekac-main::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1px solid rgba(138, 24, 39, 0.45);
  pointer-events: none;
}

.ekac-main::before {
  top: -9px;
  left: -9px;
  border-right: none;
  border-bottom: none;
}

.ekac-main::after {
  bottom: -9px;
  right: -9px;
  border-left: none;
  border-top: none;
}

.ekac-thumbs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  max-width: 760px;
  margin: 2rem auto 0;
}

.ekac-thumbs figure {
  position: relative;
  margin: 0;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(42, 37, 48, 0.08);
  box-shadow: 0 10px 26px rgba(42, 37, 48, 0.10);
  transition: transform 0.5s cubic-bezier(.2, .8, .2, 1);
}

.ekac-thumbs figure:hover {
  transform: translateY(-4px);
}

.ekac-thumbs img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 540px) {
  .ekac-thumbs {
    gap: 0.6rem;
  }
}

/* ───── Categories ───── */
.categories {
  position: relative;
  z-index: var(--z-content);
  padding: 6rem 1.6rem;
  background:
    linear-gradient(180deg, transparent, rgba(238, 240, 243, 0.6), transparent),
    radial-gradient(circle at 30% 50%, rgba(62, 72, 102, 0.10), transparent 60%);
}

.categories-grid {
  display: grid;
  gap: 1.6rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.category-card {
  position: relative;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid rgba(42, 37, 48, 0.08);
  overflow: hidden;
  transition: transform 0.5s cubic-bezier(.2, .8, .2, 1), box-shadow 0.5s ease;
}

.category-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 26px 50px rgba(42, 37, 48, 0.15);
}

.category-media {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
}

.category-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s cubic-bezier(.2, .8, .2, 1);
}

.category-card:hover .category-media img { transform: scale(1.07); }

.category-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(42, 37, 48, 0.5));
  opacity: 0.6;
}

.category-meta {
  position: relative;
  padding: 1.4rem 1.2rem 1.2rem;
}

.category-num {
  position: absolute;
  top: -1.2rem;
  right: 1rem;
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #16181f;
  color: #fafafa;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.category-icon {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 1.4rem;
  color: #16181f;
}

.category-meta h3 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 0.4rem;
}

.category-meta p {
  font-size: 0.84rem;
  color: #6c7384;
  line-height: 1.6;
  margin: 0;
}

/* ───── Profile ───── */
.profile {
  position: relative;
  z-index: var(--z-content);
  padding: 6rem 1.6rem;
}

.profile-grid {
  display: grid;
  gap: 3rem;
  grid-template-columns: 1fr;
  align-items: center;
  justify-items: center;
  max-width: 1080px;
  margin: 0 auto;
  text-align: center;
}

@media (min-width: 768px) {
  .profile-grid {
    grid-template-columns: 280px 1fr;
    gap: 3.6rem;
    justify-items: stretch;
    text-align: left;
  }
}

.profile-portrait {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.profile-portrait-frame {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(22, 24, 31, 0.12);
}

.profile-portrait-frame img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-content {
  display: grid;
  gap: 1rem;
}

.profile-bio {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #16181f;
  max-width: 36em;
}

/* ───── Contact ───── */
.contact {
  position: relative;
  z-index: var(--z-content);
  padding: 6rem 1.6rem 8rem;
  background:
    radial-gradient(circle at 80% 20%, rgba(77, 114, 176, 0.12), transparent 60%),
    radial-gradient(circle at 10% 80%, rgba(91, 139, 214, 0.1), transparent 60%);
}

.works .section-head,
.categories .section-head,
.contact .section-head,
.ekac .section-head {
  margin-left: auto;
  margin-right: auto;
  justify-items: center;
  text-align: center;
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  display: grid;
  gap: 0.8rem;
  max-width: 880px;
}

.contact-list li {
  --accent: #16181f;
}

.contact-list a {
  position: relative;
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 1.4rem 1.6rem;
  border-radius: 12px;
  background: rgba(241, 242, 245, 0.82);
  border: 1px solid rgba(42, 37, 48, 0.08);
  transition: all 0.45s cubic-bezier(.2, .8, .2, 1);
  overflow: hidden;
}

.contact-list a::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  transform: translateX(-100%);
  transition: transform 0.5s cubic-bezier(.2, .8, .2, 1);
  z-index: 0;
}

.contact-list a > * { position: relative; z-index: 1; transition: color 0.4s ease; }

.contact-list a:hover {
  border-color: var(--accent);
  transform: translateX(6px);
}

.contact-list a:hover::before { transform: translateX(0); }
.contact-list a:hover > * { color: #fafafa !important; }

.contact-num {
  font-family: var(--font-display);
  font-size: 0.86rem;
  font-weight: 800;
  font-style: italic;
  color: #6c7384;
}

.contact-icon {
  font-size: 1.4rem;
  color: var(--accent);
}

.contact-label {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 900;
}

.contact-handle {
  font-size: 0.86rem;
  color: #6c7384;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.contact-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

.contact-cta svg {
  width: 16px;
  height: 16px;
  transition: transform 0.4s ease;
}

.contact-list a:hover .contact-cta svg { transform: translateX(4px); }

@media (max-width: 720px) {
  .contact-list a {
    grid-template-columns: auto auto 1fr;
    grid-template-rows: auto auto;
    row-gap: 0.4rem;
  }
  .contact-handle { grid-column: 1 / -1; }
  .contact-cta { display: none; }
}

/* ───── Footer ───── */
.site-footer {
  position: relative;
  z-index: var(--z-content);
  padding: 2rem 1.6rem 2.4rem;
  border-top: 1px dashed rgba(42, 37, 48, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
  text-align: center;
}

.site-footer-mark span {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.site-footer-mark small {
  display: block;
  font-size: 0.7rem;
  color: #6c7384;
  letter-spacing: 0.08em;
  margin-top: 0.2rem;
}

.site-footer-deco {
  font-size: 0.8rem;
  letter-spacing: 0.6em;
  color: #6c7384;
  opacity: 0.6;
}

@media (max-width: 767px) {
  .hero { min-height: 92vh; padding-bottom: 8rem; }
  .hero-art { width: 88vw; right: -16vw; height: 64vh; opacity: 0.42; }
  .hero-floater-a { width: 92px; height: 92px; left: 4%; top: 14%; }
  .hero-floater-b { width: 84px; height: 100px; right: 4%; top: 6%; }
  .hero-corner { width: 36px; height: 36px; }
  .hero-corner-tl span:nth-child(1),
  .hero-corner-tl span:nth-child(2),
  .hero-corner-br span:nth-child(1),
  .hero-corner-br span:nth-child(2) { width: 18px; height: 1.5px; }
  .hero-corner-tl span:nth-child(2),
  .hero-corner-br span:nth-child(2) { width: 1.5px; height: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
  .hero-art, .hero-char, .hero-title-jp {
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
