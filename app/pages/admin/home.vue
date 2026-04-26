<script setup lang="ts">
import { HOME_SLOTS } from '~~/shared/home-slots'

definePageMeta({ layout: false })

const store = useAdminStore()
const { adminApi, categories, artworks, homeSlotMap, homeSelected, homeCarousel, loadAll, categoryLabel } = store

interface HomeGroupDef {
  id: 'hero' | 'category' | 'ekac'
  title: string
  subtitle: string
  description: string
  slots: typeof HOME_SLOTS
}

const homeFixedGroups = computed<HomeGroupDef[]>(() => {
  const meta: Record<HomeGroupDef['id'], { title: string; subtitle: string; description: string }> = {
    hero: {
      title: 'Hero',
      subtitle: '主推 · Featured Frame',
      description: '首屏 N°00 大图：作品集页"Selected Works"区域顶部的强调框。',
    },
    category: {
      title: 'Categories',
      subtitle: '分类卡片 · Collection Cards',
      description: '"创作方向"区域 4 张分类入口卡，每个分类各一张代表作。',
    },
    ekac: {
      title: 'Ekac',
      subtitle: 'OC 专题 · Spotlight',
      description: 'Ekac 原创角色独立板块，Hero 大图 + 3 张缩略图。',
    },
  }
  const order: HomeGroupDef['id'][] = ['hero', 'ekac', 'category']
  return order.map((id) => {
    const slots = HOME_SLOTS.filter(s => s.group === id)
    const m = meta[id]
    return { id, title: m.title, subtitle: m.subtitle, description: m.description, slots }
  })
})

type HomePickerMode =
  | { type: 'slot'; slot: string }
  | { type: 'append-selected' }
  | { type: 'append-carousel' }

const showHomePicker = ref(false)
const homePickerMode = ref<HomePickerMode | null>(null)
const homePickerSearch = ref('')
const homePickerCategory = ref<string>('')

function openHomePicker(slot: string) {
  homePickerMode.value = { type: 'slot', slot }
  homePickerSearch.value = ''
  homePickerCategory.value = ''
  showHomePicker.value = true
}

function openSelectedPicker() {
  homePickerMode.value = { type: 'append-selected' }
  homePickerSearch.value = ''
  homePickerCategory.value = ''
  showHomePicker.value = true
}

function openCarouselPicker() {
  homePickerMode.value = { type: 'append-carousel' }
  homePickerSearch.value = ''
  homePickerCategory.value = ''
  showHomePicker.value = true
}

async function assignHomeSlot(artworkId: string) {
  const mode = homePickerMode.value
  if (!mode) {
    return
  }
  try {
    if (mode.type === 'slot') {
      await adminApi.fetch(`/api/admin/home/${mode.slot}`, {
        method: 'PUT',
        body: { artworkId },
      })
    }
    else if (mode.type === 'append-selected') {
      await adminApi.fetch('/api/admin/home/selected', {
        method: 'POST',
        body: { artworkId },
      })
    }
    else if (mode.type === 'append-carousel') {
      await adminApi.fetch('/api/admin/home/carousel', {
        method: 'POST',
        body: { artworkId },
      })
    }
    showHomePicker.value = false
    await loadAll()
  }
  catch (error: unknown) {
    const msg = (error as { statusMessage?: string }).statusMessage ?? '操作失败'
    alert(msg)
  }
}

async function clearHomeSlot(slot: string) {
  if (!confirm('清除此槽位？')) {
    return
  }
  await adminApi.fetch(`/api/admin/home/${slot}`, { method: 'DELETE' })
  await loadAll()
}

async function removeSelected(slotKey: string) {
  if (!confirm('从精选移除？')) {
    return
  }
  await adminApi.fetch(`/api/admin/home/selected/${slotKey}`, { method: 'DELETE' })
  await loadAll()
}

async function removeCarousel(slotKey: string) {
  if (!confirm('从首页轮播移除？')) {
    return
  }
  await adminApi.fetch(`/api/admin/home/carousel/${slotKey}`, { method: 'DELETE' })
  await loadAll()
}

const homePickerArtworks = computed(() => {
  let list = artworks.value
  if (homePickerCategory.value) {
    list = list.filter(a => a.categoryId === homePickerCategory.value)
  }
  const query = homePickerSearch.value.trim().toLowerCase()
  if (query) {
    list = list.filter(a =>
      [a.titleEn, a.titleZh, a.titleJa, a.seriesNameEn, a.seriesNameZh].some(t => t.toLowerCase().includes(query)),
    )
  }
  return list
})

const pickedIds = computed<Set<string>>(() => {
  const mode = homePickerMode.value
  if (!mode) {
    return new Set<string>()
  }
  if (mode.type === 'append-selected') {
    return new Set(homeSelected.value.map(s => s.artworkId))
  }
  if (mode.type === 'append-carousel') {
    return new Set(homeCarousel.value.map(s => s.artworkId))
  }
  const current = homeSlotMap.value[mode.slot]?.artworkId
  return new Set(current ? [current] : [])
})

function pickedLabel(): string {
  const mode = homePickerMode.value
  if (mode?.type === 'append-selected') {
    return '已在 Selected'
  }
  if (mode?.type === 'append-carousel') {
    return '已在 Carousel'
  }
  return '当前槽位'
}

function onPickerCardClick(id: string) {
  if (pickedIds.value.has(id)) {
    return
  }
  assignHomeSlot(id)
}

</script>

<template>
  <section class="page">
    <header class="page-head">
      <div>
        <h2>首页槽位</h2>
        <p>固定槽位按分组管理；未配置的槽位会在首页隐藏。Selected 作品支持自由追加 / 删除。</p>
      </div>
    </header>

    <section class="home-group">
      <header class="home-group-head">
        <div>
          <span class="home-group-eyebrow">3D 轮播 · Hero Carousel</span>
          <h3>Carousel</h3>
          <p>首屏 ThreeScene 旋转展示的图。仅 portrait 比例的图会被使用，横图会被自动忽略。</p>
        </div>
        <span class="home-group-tally">
          <strong>{{ homeCarousel.length }}</strong>
          <small>filed</small>
        </span>
      </header>

      <div class="home-grid">
        <article
          v-for="(item, idx) in homeCarousel"
          :key="item.slotKey"
          class="home-slot is-set"
          :class="{ 'is-warn': item.height > 0 && item.width >= item.height }"
        >
          <img class="home-slot-img" :src="item.url" :alt="item.titleEn || item.seriesNameEn" loading="lazy">

          <span class="home-slot-id">carousel · {{ String(idx + 1).padStart(2, '0') }}</span>

          <div class="home-slot-actions">
            <button type="button" class="overlay-icon is-danger" title="从 Carousel 移除" @click="removeCarousel(item.slotKey)">
              <Icon name="lucide:x" />
            </button>
          </div>

          <div class="home-slot-caption">
            <strong>{{ item.titleEn || item.seriesNameEn }}</strong>
            <small>
              {{ item.seriesNameZh }}
              <template v-if="item.height > 0 && item.width >= item.height">
                · <span class="home-slot-warn-inline">非竖图</span>
              </template>
            </small>
          </div>
        </article>

        <button type="button" class="home-slot-add" @click="openCarouselPicker">
          <span class="home-slot-add-mark" aria-hidden="true">
            <Icon name="lucide:plus" />
          </span>
          <span class="home-slot-add-title">添加到 Carousel</span>
          <small class="home-slot-add-hint">从作品库挑选 · 仅 portrait 会显示</small>
        </button>
      </div>
    </section>

    <template v-for="group in homeFixedGroups" :key="group.id">
      <section class="home-group">
        <header class="home-group-head">
          <div>
            <span class="home-group-eyebrow">{{ group.subtitle }}</span>
            <h3>{{ group.title }}</h3>
            <p>{{ group.description }}</p>
          </div>
          <span class="home-group-tally">
            <strong>{{ group.slots.filter(s => homeSlotMap[s.key]).length }}</strong>
            <small>/ {{ group.slots.length }} set</small>
          </span>
        </header>

        <div class="home-grid">
          <article
            v-for="slot in group.slots"
            :key="slot.key"
            class="home-slot"
            :class="{ 'is-set': homeSlotMap[slot.key], 'is-empty': !homeSlotMap[slot.key] }"
          >
            <img
              v-if="homeSlotMap[slot.key]"
              class="home-slot-img"
              :src="homeSlotMap[slot.key].url"
              :alt="homeSlotMap[slot.key].titleEn || homeSlotMap[slot.key].seriesNameEn"
              loading="lazy"
            >

            <button
              v-if="!homeSlotMap[slot.key]"
              type="button"
              class="home-slot-empty"
              @click="openHomePicker(slot.key)"
            >
              <Icon name="lucide:image-plus" />
              <span class="home-slot-empty-title">{{ slot.label }}</span>
              <small class="home-slot-empty-hint">未配置 · 点击指定</small>
            </button>

            <span class="home-slot-id">{{ slot.key }}</span>

            <div v-if="homeSlotMap[slot.key]" class="home-slot-actions">
              <button type="button" class="overlay-icon" title="更换" @click="openHomePicker(slot.key)">
                <Icon name="lucide:replace" />
              </button>
              <button type="button" class="overlay-icon is-danger" title="清除" @click="clearHomeSlot(slot.key)">
                <Icon name="lucide:x" />
              </button>
            </div>

            <div v-if="homeSlotMap[slot.key]" class="home-slot-caption">
              <span class="home-slot-caption-label">{{ slot.label }}</span>
              <strong>{{ homeSlotMap[slot.key].titleEn || homeSlotMap[slot.key].seriesNameEn }}</strong>
              <small>{{ homeSlotMap[slot.key].seriesNameZh }} · {{ categoryLabel(homeSlotMap[slot.key].categoryId) }}</small>
            </div>
          </article>
        </div>
      </section>

      <section v-if="group.id === 'hero'" class="home-group">
        <header class="home-group-head">
          <div>
            <span class="home-group-eyebrow">精选 · Mosaic Grid</span>
            <h3>Selected Works</h3>
            <p>主推下面的瀑布流，按顺序展示。可自由追加或删除任意一项。</p>
          </div>
          <span class="home-group-tally">
            <strong>{{ homeSelected.length }}</strong>
            <small>filed</small>
          </span>
        </header>

        <div class="home-grid">
          <article
            v-for="(item, idx) in homeSelected"
            :key="item.slotKey"
            class="home-slot is-set"
          >
            <img class="home-slot-img" :src="item.url" :alt="item.titleEn || item.seriesNameEn" loading="lazy">

            <span class="home-slot-id">selected · {{ String(idx + 1).padStart(2, '0') }}</span>

            <div class="home-slot-actions">
              <button type="button" class="overlay-icon is-danger" title="从 Selected 移除" @click="removeSelected(item.slotKey)">
                <Icon name="lucide:x" />
              </button>
            </div>

            <div class="home-slot-caption">
              <strong>{{ item.titleEn || item.seriesNameEn }}</strong>
              <small>{{ item.seriesNameZh }} · {{ categoryLabel(item.categoryId) }}</small>
            </div>
          </article>

          <button type="button" class="home-slot-add" @click="openSelectedPicker">
            <span class="home-slot-add-mark" aria-hidden="true">
              <Icon name="lucide:plus" />
            </span>
            <span class="home-slot-add-title">添加到 Selected</span>
            <small class="home-slot-add-hint">从作品库挑选 · {{ artworks.length }} 件可选</small>
          </button>
        </div>
      </section>
    </template>

    <AdminModal v-model="showHomePicker" size="picker">
      <template #title>
        选择作品 ·
        <span v-if="homePickerMode?.type === 'slot'">{{ homePickerMode.slot }}</span>
        <span v-else-if="homePickerMode?.type === 'append-selected'">追加到 Selected</span>
        <span v-else-if="homePickerMode?.type === 'append-carousel'">追加到 Carousel</span>
      </template>
      <div class="picker-toolbar">
        <select v-model="homePickerCategory" class="picker-select">
          <option value="">
            全部分类
          </option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.labelEn }}
          </option>
        </select>
        <div class="picker-search">
          <Icon name="lucide:search" class="picker-search-icon" />
          <input v-model="homePickerSearch" type="text" placeholder="搜索标题或系列…">
        </div>
        <span class="toolbar-count">
          <strong>{{ homePickerArtworks.length }}</strong>
          <small>matches</small>
        </span>
      </div>
      <div v-if="homePickerArtworks.length === 0" class="empty">
        <Icon name="lucide:inbox" />
        <p>没有匹配的作品。先去 Upload 上传，或调整筛选。</p>
      </div>
      <ul v-else class="picker-grid">
        <li
          v-for="a in homePickerArtworks"
          :key="a.id"
          class="picker-card"
          :class="{ 'is-picked': pickedIds.has(a.id) }"
          :aria-disabled="pickedIds.has(a.id) ? 'true' : undefined"
          @click="onPickerCardClick(a.id)"
        >
          <div class="picker-thumb">
            <img :src="a.url" :alt="a.titleEn || a.seriesNameEn">
            <span v-if="pickedIds.has(a.id)" class="picker-badge">
              <Icon name="lucide:check" />
              <em>{{ pickedLabel() }}</em>
            </span>
          </div>
          <div class="picker-info">
            <strong>{{ a.titleEn || a.seriesNameEn }}</strong>
            <small>{{ a.seriesNameZh || a.seriesNameEn }} · {{ categoryLabel(a.categoryId) }}</small>
          </div>
        </li>
      </ul>
    </AdminModal>
  </section>
</template>

<style scoped>
.home-group {
  display: grid;
  gap: 0.95rem;
}

.home-group + .home-group {
  margin-top: 0.6rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(22, 24, 31, 0.1);
}

.home-group-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.home-group-head h3 {
  margin: 0.2rem 0 0.25rem;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #1a1d24;
}

.home-group-head p {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.5;
  max-width: 60ch;
}

.home-group-eyebrow {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.78rem;
  color: #8a1827;
  letter-spacing: 0.04em;
}

.home-group-tally {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  background: rgba(22, 24, 31, 0.04);
  border-radius: 999px;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
}
.home-group-tally strong {
  font-style: italic;
  font-size: 1rem;
  color: #8a1827;
  font-weight: 500;
}
.home-group-tally small {
  font-style: italic;
  font-size: 0.74rem;
  color: #6b7280;
}

.home-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.home-slot {
  position: relative;
  aspect-ratio: 4 / 5;
  background: #efece9;
  border: 1px solid rgba(22, 24, 31, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.home-slot.is-set { border-color: rgba(22, 24, 31, 0.18); }
.home-slot.is-warn { border-color: rgba(202, 138, 4, 0.55); }
.home-slot.is-set:hover { transform: translateY(-1px); border-color: rgba(22, 24, 31, 0.36); }

.home-slot-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(.2, .8, .2, 1);
}
.home-slot:hover .home-slot-img { transform: scale(1.04); }

.home-slot-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 0.5rem;
  background:
    repeating-linear-gradient(
      45deg,
      rgba(22, 24, 31, 0.02) 0,
      rgba(22, 24, 31, 0.02) 6px,
      transparent 6px,
      transparent 12px
    ),
    #fafaf9;
  border: 0;
  font-family: inherit;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  text-align: center;
  padding: 1rem;
}
.home-slot-empty:hover {
  background: #fff;
  color: #1a1d24;
}
.home-slot-empty :deep(svg) {
  font-size: 1.5rem;
  opacity: 0.6;
}
.home-slot-empty-title {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.92rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #1a1d24;
}
.home-slot-empty-hint {
  font-size: 0.7rem;
  color: #9ca3af;
  letter-spacing: 0.04em;
}

.home-slot-id {
  position: absolute;
  top: 0.55rem;
  left: 0.55rem;
  z-index: 2;
  padding: 2px 7px;
  font-family: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.02em;
  color: #fff;
  background: rgba(15, 16, 20, 0.55);
  backdrop-filter: blur(6px);
  border-radius: 4px;
}
.home-slot.is-empty .home-slot-id {
  display: none;
}

.home-slot-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 3;
  display: inline-flex;
  gap: 0.3rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.home-slot:hover .home-slot-actions { opacity: 1; }
.home-slot:focus-within .home-slot-actions { opacity: 1; }

.overlay-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 0;
  border-radius: 5px;
  color: #1a1d24;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 16, 20, 0.15);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.overlay-icon:hover {
  background: #1a1d24;
  color: #fff;
  transform: translateY(-1px);
}
.overlay-icon.is-danger:hover {
  background: #c0392b;
  color: #fff;
}

.home-slot-caption {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 2;
  display: grid;
  gap: 0.15rem;
  padding: 1.4rem 0.7rem 0.6rem;
  background: linear-gradient(180deg, transparent, rgba(15, 16, 20, 0.78) 60%);
  color: #fff;
}
.home-slot-caption-label {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.65);
}
.home-slot-caption strong {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.home-slot-caption small {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.78);
  letter-spacing: 0.02em;
}

.home-slot-warn-inline {
  color: #fbbf24;
  font-weight: 600;
}

.home-slot-add {
  position: relative;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.55rem;
  aspect-ratio: 4 / 5;
  padding: 1rem;
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.7), rgba(22, 24, 31, 0.02)),
    repeating-linear-gradient(45deg, transparent 0 6px, rgba(22, 24, 31, 0.025) 6px 12px);
  border: 1.5px dashed rgba(22, 24, 31, 0.18);
  border-radius: 8px;
  color: #6b7280;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s ease;
}
.home-slot-add:hover {
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.92), rgba(138, 24, 39, 0.05)),
    repeating-linear-gradient(45deg, transparent 0 6px, rgba(138, 24, 39, 0.06) 6px 12px);
  border-color: #8a1827;
  color: #1a1d24;
  transform: translateY(-1px);
}

.home-slot-add-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px dashed rgba(22, 24, 31, 0.32);
  color: #1a1d24;
  background: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.2rem;
  transition: all 0.4s cubic-bezier(.2, .8, .2, 1);
}
.home-slot-add:hover .home-slot-add-mark {
  border-style: solid;
  border-color: #8a1827;
  background: rgba(138, 24, 39, 0.08);
  color: #8a1827;
  transform: rotate(90deg);
}
.home-slot-add-mark :deep(svg) { font-size: 1.2rem; }

.home-slot-add-title {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1a1d24;
  letter-spacing: 0.02em;
}

.home-slot-add-hint {
  font-size: 0.7rem;
  color: #9ca3af;
  letter-spacing: 0.02em;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
}

.picker-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(22, 24, 31, 0.1);
}

.picker-select {
  min-width: 140px;
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: 0.82rem;
  color: #1a1d24;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.18);
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.picker-select:hover { border-color: rgba(22, 24, 31, 0.36); }
.picker-select:focus { outline: none; border-color: #1a1d24; }

.picker-search {
  position: relative;
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
}
.picker-search-icon {
  position: absolute;
  left: 0.6rem;
  font-size: 0.95rem;
  color: #9ca3af;
  pointer-events: none;
}
.picker-search input {
  width: 100%;
  padding: 0.4rem 0.7rem 0.4rem 2rem;
  font-family: inherit;
  font-size: 0.82rem;
  color: #1a1d24;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.18);
  border-radius: 5px;
  transition: border-color 0.2s ease;
}
.picker-search input:hover { border-color: rgba(22, 24, 31, 0.36); }
.picker-search input:focus { outline: none; border-color: #1a1d24; }

.picker-grid {
  list-style: none;
  margin: 0;
  padding: 0.4rem 0.1rem 0.1rem;
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-auto-rows: max-content;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.picker-card {
  position: relative;
  display: grid;
  grid-template-rows: auto auto;
  align-self: start;
  min-width: 0;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.1);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.picker-card:hover {
  border-color: #1a1d24;
  transform: translateY(-1px);
}

.picker-card.is-picked {
  cursor: default;
  border-color: rgba(138, 24, 39, 0.45);
  background: #fbf6f6;
}
.picker-card.is-picked:hover { transform: none; }
.picker-card.is-picked .picker-thumb img { opacity: 0.45; filter: grayscale(0.4); }
.picker-card.is-picked .picker-info strong { color: #6b7280; }

.picker-thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f0eeec;
  overflow: hidden;
}
.picker-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.picker-badge {
  position: absolute;
  inset: auto 0.5rem 0.5rem 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.55rem;
  background: rgba(138, 24, 39, 0.92);
  color: #fff;
  border-radius: 999px;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  width: fit-content;
}
.picker-badge :deep(svg) { font-size: 0.85rem; }
.picker-badge em {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}

.picker-info {
  display: grid;
  gap: 0.15rem;
  padding: 0.55rem 0.7rem 0.7rem;
}
.picker-info strong { font-size: 0.85rem; font-weight: 600; }
.picker-info small { font-size: 0.72rem; color: #4a5061; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
