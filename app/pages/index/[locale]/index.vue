<script setup lang="ts">
import { artworkCategories, artworks, seriesLabels, type Artwork, type ArtworkCategoryId } from '~/data/artworks'
import type { Locale } from '~/utils/useLocale'

setHtmlLangByLocale()
setSeoMetaByLocale()

const locale = useLocale()

const copyByLocale: Record<Locale, {
  navWorks: string
  navProfile: string
  navContact: string
  works: string
  collection: string
  profile: string
  profileBio: string
  contact: string
  open: string
  ekac: string
}> = {
  'zh-CN': {
    navWorks: 'Works',
    navProfile: 'Profile',
    navContact: 'Contact',
    works: '精选作品',
    collection: '创作方向',
    profile: '关于私期',
    profileBio: '插画师。兴趣是打卡各种美食，并在 Google Maps 留下评价。',
    contact: '联络',
    open: '前往',
    ekac: 'Ekac',
  },
  en: {
    navWorks: 'Works',
    navProfile: 'Profile',
    navContact: 'Contact',
    works: 'Selected Works',
    collection: 'Collection',
    profile: 'About snowcake47',
    profileBio: 'Illustrator. Spends free time hopping between restaurants and leaving Google Maps reviews.',
    contact: 'Contact',
    open: 'visit',
    ekac: 'Ekac',
  },
  ja: {
    navWorks: 'Works',
    navProfile: 'Profile',
    navContact: 'Contact',
    works: 'ピックアップ',
    collection: 'カテゴリ',
    profile: '私期について',
    profileBio: 'イラストレーター。趣味はあちこちのお店を巡り、Google マップにレビューを残すこと。',
    contact: 'コンタクト',
    open: 'ひらく',
    ekac: 'Ekac',
  },
}

const copy = computed(() => copyByLocale[locale])

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

const heroFeature = findArtwork('/images/snowcake47/game-fanart/onmyoji/HEVm68RbYAUmYxD.jpg')

const selectedArtworks = [
  '/images/snowcake47/original-oc/snow-portrait.jpg',
  '/images/snowcake47/anime-fanart/sousou-no-frieren/red-dress-portrait.jpg',
  '/images/snowcake47/game-fanart/honkai-star-rail/evernight.jpg',
  '/images/snowcake47/game-fanart/duet-night-abyss/rebecca.jpg',
  '/images/snowcake47/anime-fanart/vocaloid/racing-miku.jpg',
  '/images/snowcake47/commercial-commission/wedding-blue.jpg',
  '/images/snowcake47/original-oc/butterfly-portrait.jpg',
  '/images/snowcake47/anime-fanart/code-geass/euphemia-good-night.jpg',
].map(findArtwork)

const categoryArtworkPath: Record<ArtworkCategoryId, string> = {
  'game-fanart': '/images/snowcake47/game-fanart/magical-girl-witch-trials/black-red-portrait.jpg',
  'anime-fanart': '/images/snowcake47/anime-fanart/code-geass/euphemia-good-night.jpg',
  'original-oc': '/images/snowcake47/original-oc/butterfly-portrait.jpg',
  'commercial-commission': '/images/snowcake47/commercial-commission/red-crown-portrait.jpg',
}

const categoryShowcases = computed(() => artworkCategories.map(category => ({
  category,
  artwork: findArtwork(categoryArtworkPath[category.id]),
})))

const ekacArtworks = [
  '/images/snowcake47/original-oc/Ekac/Ekac-1.png',
  '/images/snowcake47/original-oc/Ekac/Ekac-2.jpg',
  '/images/snowcake47/original-oc/Ekac/Ekac-3.jpg',
  '/images/snowcake47/original-oc/Ekac/Ekac-4.jpg',
].map(findArtwork)

const heroTitleChars = 'Snowcake47'.split('')

function findArtwork(src: string): Artwork {
  const artwork = artworks.find(item => item.src === src)
  if (!artwork) {
    throw new Error(`Artwork not found: ${src}`)
  }
  return artwork
}

function seriesText(artwork: Artwork): string {
  return seriesLabels[artwork.series][locale]
}

function categoryText(id: ArtworkCategoryId): string {
  return artworkCategories.find(c => c.id === id)?.label[locale] ?? id
}

const cursor = reactive({ x: 0, y: 0 })
const mounted = ref(false)
const scrollY = ref(0)

function handleMouseMove(event: MouseEvent) {
  cursor.x = (event.clientX / window.innerWidth - 0.5) * 2
  cursor.y = (event.clientY / window.innerHeight - 0.5) * 2
}

function handleScroll() {
  scrollY.value = window.scrollY
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
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  window.addEventListener('scroll', handleScroll, { passive: true })

  const observer = setupReveal()

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('scroll', handleScroll)
    observer.disconnect()
  })
})

const heroParallax = computed(() => ({
  marquee: `translate3d(${-scrollY.value * 0.4}px, 0, 0)`,
  bg: `translate3d(${cursor.x * 8}px, ${cursor.y * 6}px, 0)`,
  star: `translate3d(${cursor.x * 22}px, ${cursor.y * 16}px, 0)`,
}))
</script>

<template>
  <main class="portfolio-shell" :class="{ 'is-mounted': mounted }">
    <LoadingOverlay />
    <BackgroundOrnament />
    <div class="grain-overlay" aria-hidden="true" />

    <header class="site-nav">
      <NuxtLink href="/" class="brand">
        <span class="brand-mark">
          <img src="/images/snowcake47/brand/avatar.jpg" alt="snowcake47">
          <span class="brand-mark-ring" aria-hidden="true" />
        </span>
        <span class="brand-text">
          <strong>cake47.art</strong>
          <small>snowcake47 ✦ 私期</small>
        </span>
      </NuxtLink>

      <nav class="site-nav-links">
        <a href="#profile"><em>01</em>{{ copy.navProfile }}</a>
        <a href="#works"><em>02</em>{{ copy.navWorks }}</a>
        <a href="#contact"><em>03</em>{{ copy.navContact }}</a>
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

      <div class="hero-marquee" aria-hidden="true">
        <div class="hero-marquee-track" :style="{ transform: heroParallax.marquee }">
          <span v-for="i in 4" :key="i">
            <em>✟</em> ILLUSTRATION <em>✟</em> CHARACTER DESIGN <em>✟</em> SNOWCAKE47 <em>✟</em> 私期 <em>✟</em> SINCE 2017 <em>✟</em>
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
            <span class="hero-title-jp-text">私期 の 画室</span>
            <span class="hero-title-jp-deco" aria-hidden="true">◆</span>
          </span>
        </h1>
      </div>
    </section>

    <section id="profile" class="profile">
      <div class="profile-grid">
        <div class="profile-portrait" data-reveal>
          <div class="profile-portrait-frame">
            <img src="/images/snowcake47/brand/avatar.jpg" alt="snowcake47 avatar">
          </div>
        </div>

        <div class="profile-content" data-reveal style="--reveal-delay: 120ms">
          <span class="section-num">01 / Profile</span>
          <h2 class="section-title">{{ copy.profile }}</h2>
          <p class="profile-bio">
            {{ copy.profileBio }}
          </p>
        </div>
      </div>
    </section>

    <section id="works" class="works">
      <div class="section-head" data-reveal>
        <span class="section-num">02 / Works</span>
        <h2 class="section-title">
          {{ copy.works }}
          <svg class="section-title-flourish" viewBox="0 0 200 20" aria-hidden="true">
            <path d="M0,10 Q50,-5 100,10 T200,10" fill="none" stroke="#16181f" stroke-width="1" stroke-linecap="round" opacity="0.5" />
          </svg>
        </h2>
      </div>

      <figure class="work-feature" data-reveal>
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
            Featured
          </span>
          <span class="work-feature-divider" aria-hidden="true" />
          <span class="work-feature-series">{{ categoryText(heroFeature.category) }}</span>
          <span class="work-feature-counter">N°00</span>
        </header>

        <div class="work-feature-frame">
          <span class="work-feature-tape work-feature-tape-tl" aria-hidden="true" />
          <span class="work-feature-tape work-feature-tape-br" aria-hidden="true" />
          <img :src="heroFeature.src" :alt="seriesText(heroFeature)" loading="lazy" decoding="async">
        </div>

        <figcaption class="work-feature-caption">
          <div class="work-feature-info">
            <strong>{{ seriesText(heroFeature) }}</strong>
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
            <img :src="artwork.src" :alt="seriesText(artwork)" loading="lazy" decoding="async">
          </div>
          <figcaption class="work-caption">
            <strong>{{ seriesText(artwork) }}</strong>
            <em>{{ categoryText(artwork.category) }}</em>
          </figcaption>
        </figure>
      </div>
    </section>

    <section id="ekac" class="ekac">
      <div class="section-head" data-reveal>
        <span class="section-num">03 / Ekac</span>
        <h2 class="section-title">
          {{ copy.ekac }}
          <svg class="section-title-flourish" viewBox="0 0 200 20" aria-hidden="true">
            <path d="M0,10 Q50,-5 100,10 T200,10" fill="none" stroke="#8a1827" stroke-width="1" stroke-linecap="round" opacity="0.6" />
          </svg>
        </h2>
      </div>

      <figure class="ekac-main" data-reveal>
        <img :src="ekacArtworks[0].src" :alt="copy.ekac" loading="lazy" decoding="async">
      </figure>

      <div class="ekac-thumbs" data-reveal>
        <figure
          v-for="artwork in ekacArtworks.slice(1)"
          :key="artwork.src"
        >
          <img :src="artwork.src" :alt="copy.ekac" loading="lazy" decoding="async">
        </figure>
      </div>
    </section>

    <section class="categories">
      <div class="section-head" data-reveal>
        <span class="section-num">04 / Collection</span>
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
            <img :src="item.artwork.src" :alt="seriesText(item.artwork)" loading="lazy" decoding="async">
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
      <div class="section-head" data-reveal>
        <span class="section-num">05 / Contact</span>
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
        <small>© {{ new Date().getFullYear() }} snowcake47 / 私期</small>
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
  font-family: 'Shippori Mincho', 'Noto Serif JP', 'Hiragino Mincho ProN', 'Source Han Serif', serif;
}

.grain-overlay {
  position: fixed;
  z-index: 1;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.5;
  pointer-events: none;
  mix-blend-mode: multiply;
}

/* ───── Site nav ───── */
.site-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 1.6rem;
  background: transparent;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-mark {
  position: relative;
  display: block;
  width: 42px;
  height: 42px;
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
  font-family: 'Shippori Mincho', 'Playfair Display', 'Noto Serif JP', serif;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.brand-text small {
  font-size: 0.7rem;
  color: #6c7384;
  letter-spacing: 0.08em;
}

.site-nav-links {
  display: none;
  gap: 1.4rem;
  font-size: 0.82rem;
  font-weight: 600;
}

@media (min-width: 768px) {
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
  padding: 0.45rem 0.78rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #16181f;
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

/* ───── Intro section (below hero) ───── */
.intro {
  position: relative;
  z-index: 10;
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
  font-family: 'Shippori Mincho', 'Cormorant Garamond', 'Playfair Display', 'Noto Serif JP', serif;
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
  font-family: 'Shippori Mincho', 'Noto Serif JP', 'Cormorant Garamond', 'Playfair Display', serif;
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
}

.hero-marquee-track {
  display: flex;
  gap: 3rem;
  white-space: nowrap;
  animation: marquee 38s linear infinite;
  font-family: 'Shippori Mincho', 'Playfair Display', serif;
  font-weight: 800;
  font-size: 0.92rem;
  letter-spacing: 0.16em;
  color: #16181f;
}

.hero-marquee-track em {
  font-style: normal;
  color: #6c7384;
}

@keyframes marquee {
  to { transform: translate3d(-50%, 0, 0); }
}

/* ───── Sections ───── */
.section-head {
  display: grid;
  gap: 1rem;
  margin-bottom: 3rem;
  max-width: 720px;
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

.section-num::before {
  content: '';
  width: 14px;
  height: 1px;
  background: #16181f;
  opacity: 0.5;
}

.section-title {
  position: relative;
  display: inline-block;
  font-family: 'Shippori Mincho', 'Playfair Display', 'Noto Serif JP', serif;
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
  z-index: 10;
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

.work-feature::after {
  content: '';
  position: absolute;
  inset: 14px;
  border: 1px dashed rgba(22, 24, 31, 0.06);
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
  font-family: 'Shippori Mincho', 'Cormorant Garamond', 'Playfair Display', serif;
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

.work-feature-tape {
  position: absolute;
  z-index: 5;
  width: 132px;
  height: 26px;
  background: rgba(40, 56, 92, 0.32);
  border: 1px dashed rgba(42, 37, 48, 0.18);
  pointer-events: none;
  box-shadow: 0 4px 10px -4px rgba(22, 24, 31, 0.25);
}

.work-feature-tape-tl {
  top: -12px;
  left: -18px;
  transform: rotate(-10deg);
}

.work-feature-tape-br {
  bottom: -10px;
  right: -14px;
  transform: rotate(7deg);
  background: rgba(138, 150, 168, 0.42);
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
  font-family: 'Shippori Mincho', 'Cormorant Garamond', 'Playfair Display', 'Noto Serif JP', serif;
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
  z-index: 10;
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
  object-position: 50% 22%;
}

@media (max-width: 540px) {
  .ekac-thumbs {
    gap: 0.6rem;
  }
}

/* ───── Categories ───── */
.categories {
  position: relative;
  z-index: 10;
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
  object-position: 50% 18%;
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
  font-family: 'Shippori Mincho', 'Playfair Display', serif;
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
  font-family: 'Shippori Mincho', 'Playfair Display', 'Noto Serif JP', serif;
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
  z-index: 10;
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
  z-index: 10;
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
  font-family: 'Shippori Mincho', 'Playfair Display', serif;
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
  font-family: 'Shippori Mincho', 'Playfair Display', 'Noto Serif JP', serif;
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
  z-index: 10;
  padding: 2rem 1.6rem 2.4rem;
  border-top: 1px dashed rgba(42, 37, 48, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
  text-align: center;
}

.site-footer-mark span {
  font-family: 'Shippori Mincho', 'Playfair Display', serif;
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
