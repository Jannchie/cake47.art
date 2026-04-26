<script setup lang="ts">
import { HOME_SLOTS } from '~~/shared/home-slots'

definePageMeta({ layout: false })

interface CategoryItem {
  id: string
  icon: string
  labelEn: string
  labelZh: string
  labelJa: string
  sortOrder: number
}

interface SeriesItem {
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
  sortOrder: number
  artworkCount: number
}

interface ArtworkItem {
  id: string
  seriesId: string
  seriesSlug: string
  seriesNameEn: string
  seriesNameZh: string
  categoryId: string
  titleEn: string
  titleZh: string
  titleJa: string
  descriptionEn: string
  descriptionZh: string
  descriptionJa: string
  url: string
  storageKey: string
  width: number
  height: number
  mimeType: string
  sizeBytes: number
  objectPosition: string | null
  featured: boolean
  sortOrder: number
  createdAt: number
}

interface UploadResult {
  key: string
  url: string
  contentType: string
  size: number
}

const adminApi = useAdminApi()
const tokenInput = ref('')
const tokenError = ref('')
const authed = ref(false)
const checkingAuth = ref(true)

async function verifyToken() {
  if (!adminApi.token.value) {
    authed.value = false
    checkingAuth.value = false
    return
  }
  try {
    await adminApi.fetch('/api/admin/me')
    authed.value = true
  }
  catch {
    authed.value = false
  }
  finally {
    checkingAuth.value = false
  }
}

async function login() {
  if (!tokenInput.value.trim()) {
    tokenError.value = '请输入访问口令'
    return
  }
  adminApi.token.value = tokenInput.value.trim()
  try {
    await adminApi.fetch('/api/admin/me')
    authed.value = true
    tokenError.value = ''
    tokenInput.value = ''
  }
  catch {
    tokenError.value = '口令无效或服务未配置'
    adminApi.token.value = null
    authed.value = false
  }
}

function logout() {
  adminApi.token.value = null
  authed.value = false
}

const tabs = [
  { id: 'upload', label: 'Upload', sub: '上传' },
  { id: 'artworks', label: 'Artworks', sub: '作品' },
  { id: 'series', label: 'Series', sub: '系列' },
  { id: 'home', label: 'Home', sub: '首页' },
] as const

type TabId = typeof tabs[number]['id']
const activeTab = ref<TabId>('upload')

interface HomeSlotData {
  slotKey: string
  artworkId: string
  url: string
  categoryId: string
  seriesNameZh: string
  seriesNameEn: string
  seriesNameJa: string
  titleZh: string
  titleEn: string
  titleJa: string
  objectPosition: string | null
  width: number
  height: number
}

const categories = ref<CategoryItem[]>([])
const seriesList = ref<SeriesItem[]>([])
const artworks = ref<ArtworkItem[]>([])
const homeSlotMap = ref<Record<string, HomeSlotData>>({})
const homeSelected = ref<HomeSlotData[]>([])
const loadingData = ref(false)

async function loadAll() {
  if (!authed.value) {
    return
  }
  loadingData.value = true
  try {
    const [cats, series, arts, home] = await Promise.all([
      adminApi.fetch<{ items: CategoryItem[] }>('/api/admin/categories'),
      adminApi.fetch<{ items: SeriesItem[] }>('/api/admin/series'),
      adminApi.fetch<{ items: ArtworkItem[] }>('/api/admin/artworks'),
      adminApi.fetch<{ slots: Record<string, HomeSlotData>; selected: HomeSlotData[] }>('/api/admin/home/layout'),
    ])
    categories.value = cats.items
    seriesList.value = series.items
    artworks.value = arts.items
    homeSlotMap.value = home.slots
    homeSelected.value = home.selected ?? []
  }
  catch (error) {
    console.error('load admin data failed', error)
  }
  finally {
    loadingData.value = false
  }
}

watch(authed, (val) => {
  if (val) {
    void loadAll()
  }
})

onMounted(async () => {
  await verifyToken()
  if (authed.value) {
    await loadAll()
  }
})

/* ───── Series form ───── */
const showSeriesForm = ref(false)
const editingSeriesId = ref<string | null>(null)
const seriesForm = reactive({
  slug: '',
  categoryId: '',
  nameZh: '',
  nameEn: '',
  nameJa: '',
  descriptionZh: '',
  descriptionEn: '',
  descriptionJa: '',
  sortOrder: 0,
})

function resetSeriesForm() {
  seriesForm.slug = ''
  seriesForm.categoryId = categories.value[0]?.id ?? ''
  seriesForm.nameZh = ''
  seriesForm.nameEn = ''
  seriesForm.nameJa = ''
  seriesForm.descriptionZh = ''
  seriesForm.descriptionEn = ''
  seriesForm.descriptionJa = ''
  seriesForm.sortOrder = 0
  editingSeriesId.value = null
}

function openSeriesCreate() {
  resetSeriesForm()
  showSeriesForm.value = true
}

function openSeriesEdit(item: SeriesItem) {
  editingSeriesId.value = item.id
  seriesForm.slug = item.slug
  seriesForm.categoryId = item.categoryId
  seriesForm.nameZh = item.nameZh
  seriesForm.nameEn = item.nameEn
  seriesForm.nameJa = item.nameJa
  seriesForm.descriptionZh = item.descriptionZh
  seriesForm.descriptionEn = item.descriptionEn
  seriesForm.descriptionJa = item.descriptionJa
  seriesForm.sortOrder = item.sortOrder
  showSeriesForm.value = true
}

const submittingSeries = ref(false)

async function submitSeries() {
  if (!seriesForm.nameEn || !seriesForm.nameZh || !seriesForm.nameJa || !seriesForm.categoryId) {
    return
  }
  submittingSeries.value = true
  try {
    if (editingSeriesId.value) {
      await adminApi.fetch(`/api/admin/series/${editingSeriesId.value}`, {
        method: 'PATCH',
        body: { ...seriesForm },
      })
    }
    else {
      await adminApi.fetch('/api/admin/series', {
        method: 'POST',
        body: { ...seriesForm },
      })
    }
    showSeriesForm.value = false
    resetSeriesForm()
    await loadAll()
  }
  catch (error) {
    console.error('series save failed', error)
  }
  finally {
    submittingSeries.value = false
  }
}

async function deleteSeries(item: SeriesItem) {
  if (!confirm(`确认删除系列「${item.nameEn}」？相关作品文件也将被移除。`)) {
    return
  }
  await adminApi.fetch(`/api/admin/series/${item.id}`, { method: 'DELETE' })
  await loadAll()
}

/* ───── Upload ───── */
interface PendingItem {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'uploaded' | 'saved' | 'error'
  progress: number
  result?: UploadResult
  width: number
  height: number
  seriesId: string
  titleEn: string
  titleZh: string
  titleJa: string
  featured: boolean
  setAsCover: boolean
  errorMessage?: string
}

const pending = ref<PendingItem[]>([])
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function tempId() {
  return Math.random().toString(36).slice(2, 10)
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

async function addFiles(files: FileList | File[]) {
  const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
  for (const file of arr) {
    const { width, height } = await readImageDimensions(file)
    pending.value.push({
      id: tempId(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      width,
      height,
      seriesId: seriesList.value[0]?.id ?? '',
      titleEn: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      titleZh: '',
      titleJa: '',
      featured: false,
      setAsCover: false,
    })
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  dragOver.value = false
  if (event.dataTransfer?.files) {
    void addFiles(event.dataTransfer.files)
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    void addFiles(target.files)
    target.value = ''
  }
}

async function uploadOne(item: PendingItem) {
  if (!item.seriesId) {
    item.status = 'error'
    item.errorMessage = '请选择系列'
    return
  }
  item.status = 'uploading'
  item.progress = 5
  try {
    const formData = new FormData()
    formData.append('file', item.file, item.file.name)
    const result = await adminApi.fetch<UploadResult>('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })
    item.result = result
    item.progress = 70
    item.status = 'uploaded'

    await adminApi.fetch('/api/admin/artworks', {
      method: 'POST',
      body: {
        seriesId: item.seriesId,
        storageKey: result.key,
        url: result.url,
        mimeType: result.contentType,
        width: item.width,
        height: item.height,
        sizeBytes: result.size,
        titleEn: item.titleEn,
        titleZh: item.titleZh,
        titleJa: item.titleJa,
        featured: item.featured,
        setAsCover: item.setAsCover,
      },
    })
    item.progress = 100
    item.status = 'saved'
  }
  catch (error: unknown) {
    item.status = 'error'
    item.errorMessage = (error as { statusMessage?: string; message?: string }).statusMessage ?? (error as { message?: string }).message ?? '上传失败'
  }
}

async function uploadAll() {
  for (const item of pending.value) {
    if (item.status === 'pending' || item.status === 'error') {
      await uploadOne(item)
    }
  }
  await loadAll()
}

function clearSaved() {
  for (const item of pending.value) {
    if (item.status === 'saved') {
      URL.revokeObjectURL(item.preview)
    }
  }
  pending.value = pending.value.filter(item => item.status !== 'saved')
}

function removePending(id: string) {
  const item = pending.value.find(p => p.id === id)
  if (item) {
    URL.revokeObjectURL(item.preview)
  }
  pending.value = pending.value.filter(p => p.id !== id)
}

/* ───── Artworks ───── */
const filterSeries = ref<string>('')
const filterCategory = ref<string>('')

const filteredArtworks = computed(() => {
  return artworks.value.filter((a) => {
    if (filterSeries.value && a.seriesId !== filterSeries.value) {
      return false
    }
    if (filterCategory.value && a.categoryId !== filterCategory.value) {
      return false
    }
    return true
  })
})

async function deleteArtwork(item: ArtworkItem) {
  if (!confirm(`确认删除作品「${item.titleEn || item.seriesNameEn}」？`)) {
    return
  }
  await adminApi.fetch(`/api/admin/artworks/${item.id}`, { method: 'DELETE' })
  await loadAll()
}

async function toggleFeatured(item: ArtworkItem) {
  await adminApi.fetch(`/api/admin/artworks/${item.id}`, {
    method: 'PATCH',
    body: { featured: !item.featured },
  })
  await loadAll()
}

async function setAsCoverNow(item: ArtworkItem) {
  await adminApi.fetch(`/api/admin/artworks/${item.id}`, {
    method: 'PATCH',
    body: { setAsCover: true },
  })
  await loadAll()
}

/* ───── Home layout ───── */
const homeSlotDefs = HOME_SLOTS

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
  const order: HomeGroupDef['id'][] = ['hero', 'category', 'ekac']
  return order.map((id) => {
    const slots = homeSlotDefs.filter(s => s.group === id)
    const m = meta[id]
    return { id, title: m.title, subtitle: m.subtitle, description: m.description, slots }
  })
})
type HomePickerMode = { type: 'slot'; slot: string } | { type: 'append-selected' }

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
    else {
      await adminApi.fetch('/api/admin/home/selected', {
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

function bytesLabel(bytes: number): string {
  if (bytes <= 0) {
    return '—'
  }
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`
}

function categoryLabel(id: string) {
  const c = categories.value.find(x => x.id === id)
  return c ? c.labelEn : id
}

function seriesNameById(id: string) {
  return seriesList.value.find(s => s.id === id)?.nameEn ?? id
}
</script>

<template>
  <main class="admin">
    <Transition name="fade">
      <section v-if="!authed && !checkingAuth" class="login-shell">
        <div class="login-card">
          <header class="login-head">
            <span class="login-brand">cake47.art</span>
            <h1>Admin</h1>
            <p>请输入访问口令进入管理后台</p>
          </header>
          <form class="login-form" @submit.prevent="login">
            <label class="field">
              <span>Access token</span>
              <input
                v-model="tokenInput"
                type="password"
                autocomplete="off"
                placeholder=""
                @keydown.enter="login"
              >
            </label>
            <p v-if="tokenError" class="form-error">
              {{ tokenError }}
            </p>
            <button type="submit" class="btn btn-primary btn-block">
              登录
            </button>
          </form>
          <small class="login-hint">
            local dev token: <code>local-dev-token</code>
          </small>
        </div>
      </section>
    </Transition>

    <Transition name="fade">
      <section v-if="authed" class="app">
        <header class="topbar">
          <div class="topbar-brand">
            <span class="topbar-mark" aria-hidden="true">
              <img :src="'/api/files/brand/avatar.jpg'" alt="">
            </span>
            <span class="topbar-text">
              <strong>cake47.art</strong>
              <small>admin</small>
            </span>
          </div>

          <nav class="topbar-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="topbar-tab"
              :class="{ 'is-active': activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </nav>

          <div class="topbar-actions">
            <NuxtLink href="/gallery" target="_blank" class="btn btn-ghost btn-sm">
              <Icon name="lucide:external-link" />
              <span>查看画廊</span>
            </NuxtLink>
            <button type="button" class="btn btn-ghost btn-sm" @click="logout">
              <Icon name="lucide:log-out" />
              <span>登出</span>
            </button>
          </div>
        </header>

        <div class="content">
          <!-- Upload -->
          <section v-show="activeTab === 'upload'" class="page">
            <header class="page-head">
              <div>
                <h2>上传作品</h2>
                <p>拖拽图片到下方区域，或点击选择文件。每张可单独设定归属系列与多语言标题。</p>
              </div>
            </header>

            <div
              class="dropzone"
              :class="{ 'is-over': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop="onDrop"
              @click="fileInput?.click()"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*"
                hidden
                @change="onFileChange"
              >
              <Icon name="lucide:image-plus" class="dropzone-icon" />
              <p class="dropzone-title">
                拖拽图片到此处
              </p>
              <small>or click to browse · jpg / png / webp / avif</small>
            </div>

            <div v-if="pending.length > 0" class="upload-block">
              <header class="upload-toolbar">
                <span><strong>{{ pending.length }}</strong> 待上传</span>
                <div class="upload-toolbar-actions">
                  <button type="button" class="btn btn-ghost btn-sm" @click="clearSaved">
                    清理已保存
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" @click="uploadAll">
                    <Icon name="lucide:upload-cloud" />
                    <span>上传全部</span>
                  </button>
                </div>
              </header>

              <ul class="upload-items">
                <li v-for="item in pending" :key="item.id" class="upload-item" :class="`status-${item.status}`">
                  <div class="upload-thumb">
                    <img :src="item.preview" alt="">
                    <span class="upload-progress" :style="{ width: `${item.progress}%` }" />
                    <span v-if="item.status === 'saved'" class="upload-pill is-ok">SAVED</span>
                    <span v-else-if="item.status === 'error'" class="upload-pill is-error">ERR</span>
                    <span v-else-if="item.status === 'uploading'" class="upload-pill is-busy">···</span>
                  </div>
                  <div class="upload-fields">
                    <label class="field">
                      <span>系列</span>
                      <select v-model="item.seriesId">
                        <option v-for="s in seriesList" :key="s.id" :value="s.id">
                          [{{ categoryLabel(s.categoryId) }}] {{ s.nameEn }}
                        </option>
                      </select>
                    </label>
                    <label class="field">
                      <span>Title (EN)</span>
                      <input v-model="item.titleEn" type="text">
                    </label>
                    <label class="field">
                      <span>標題 (JA)</span>
                      <input v-model="item.titleJa" type="text">
                    </label>
                    <label class="field">
                      <span>标题 (ZH)</span>
                      <input v-model="item.titleZh" type="text">
                    </label>
                    <div class="upload-toggles">
                      <label class="check">
                        <input v-model="item.featured" type="checkbox">
                        <span>Featured</span>
                      </label>
                      <label class="check">
                        <input v-model="item.setAsCover" type="checkbox">
                        <span>设为封面</span>
                      </label>
                    </div>
                  </div>
                  <div class="upload-meta">
                    <small>{{ item.width }} × {{ item.height }}</small>
                    <small>{{ bytesLabel(item.file.size) }}</small>
                    <small v-if="item.errorMessage" class="upload-meta-error">{{ item.errorMessage }}</small>
                    <button type="button" class="icon-btn" :title="'移除'" @click="removePending(item.id)">
                      <Icon name="lucide:x" />
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <!-- Artworks -->
          <section v-show="activeTab === 'artworks'" class="page">
            <header class="page-head">
              <div>
                <h2>作品</h2>
                <p>{{ artworks.length }} 件 · 标记 featured、设为封面或删除。</p>
              </div>
            </header>

            <div class="toolbar">
              <label class="field">
                <span>分类</span>
                <select v-model="filterCategory">
                  <option value="">
                    全部分类
                  </option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">
                    {{ c.labelEn }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>系列</span>
                <select v-model="filterSeries">
                  <option value="">
                    全部系列
                  </option>
                  <option
                    v-for="s in seriesList.filter(x => !filterCategory || x.categoryId === filterCategory)"
                    :key="s.id"
                    :value="s.id"
                  >
                    [{{ categoryLabel(s.categoryId) }}] {{ s.nameEn }}
                  </option>
                </select>
              </label>
              <span class="toolbar-count">
                <strong>{{ filteredArtworks.length }}</strong>
                <small>filtered</small>
              </span>
            </div>

            <div v-if="filteredArtworks.length === 0" class="empty">
              <Icon name="lucide:inbox" />
              <p>暂无作品。前往 Upload 上传。</p>
            </div>

            <ul v-else class="artworks-grid">
              <li
                v-for="item in filteredArtworks"
                :key="item.id"
                class="artwork-card"
                :class="{ 'is-featured': item.featured }"
              >
                <div class="artwork-thumb">
                  <img :src="item.url" :alt="item.titleEn || item.seriesNameEn" loading="lazy">
                  <div class="artwork-overlay">
                    <button type="button" class="overlay-btn" :class="{ 'is-on': item.featured }" :title="item.featured ? '取消 featured' : '标记 featured'" @click="toggleFeatured(item)">
                      <Icon name="lucide:star" />
                    </button>
                    <button type="button" class="overlay-btn" title="设为系列封面" @click="setAsCoverNow(item)">
                      <Icon name="lucide:image" />
                    </button>
                    <button type="button" class="overlay-btn is-danger" title="删除" @click="deleteArtwork(item)">
                      <Icon name="lucide:trash" />
                    </button>
                  </div>
                </div>
                <div class="artwork-info">
                  <strong>{{ item.titleEn || item.seriesNameEn }}</strong>
                  <small>{{ seriesNameById(item.seriesId) }} · {{ categoryLabel(item.categoryId) }}</small>
                  <span class="artwork-tags">
                    <em v-if="item.featured" class="tag tag-accent">featured</em>
                    <em class="tag">{{ item.width }}×{{ item.height }}</em>
                    <em class="tag">{{ bytesLabel(item.sizeBytes) }}</em>
                  </span>
                </div>
              </li>
            </ul>
          </section>

          <!-- Home -->
          <section v-show="activeTab === 'home'" class="page">
            <header class="page-head">
              <div>
                <h2>首页槽位</h2>
                <p>固定槽位按分组管理；未配置的槽位会在首页隐藏。Selected 作品支持自由追加 / 删除。</p>
              </div>
            </header>

            <section
              v-for="group in homeFixedGroups"
              :key="group.id"
              class="home-group"
            >
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
                  :class="{ 'is-set': homeSlotMap[slot.key] }"
                >
                  <header class="home-slot-head">
                    <span class="home-slot-key-id">{{ slot.key }}</span>
                    <strong class="home-slot-key">{{ slot.label }}</strong>
                  </header>
                  <div class="home-slot-thumb">
                    <img
                      v-if="homeSlotMap[slot.key]"
                      :src="homeSlotMap[slot.key].url"
                      :alt="homeSlotMap[slot.key].titleEn || homeSlotMap[slot.key].seriesNameEn"
                    >
                    <div v-else class="home-slot-empty">
                      <Icon name="lucide:image-off" />
                      <span>未配置</span>
                    </div>
                  </div>
                  <div class="home-slot-meta">
                    <template v-if="homeSlotMap[slot.key]">
                      <strong>{{ homeSlotMap[slot.key].titleEn || homeSlotMap[slot.key].seriesNameEn }}</strong>
                      <small>{{ homeSlotMap[slot.key].seriesNameZh }} · {{ categoryLabel(homeSlotMap[slot.key].categoryId) }}</small>
                    </template>
                    <template v-else>
                      <small class="home-slot-default">— 此处首页将不显示</small>
                    </template>
                  </div>
                  <footer class="home-slot-foot">
                    <button type="button" class="btn btn-ghost btn-sm" @click="openHomePicker(slot.key)">
                      <Icon name="lucide:replace" />
                      <span>{{ homeSlotMap[slot.key] ? '更换' : '指定' }}</span>
                    </button>
                    <button
                      v-if="homeSlotMap[slot.key]"
                      type="button"
                      class="icon-btn is-danger"
                      title="清除"
                      @click="clearHomeSlot(slot.key)"
                    >
                      <Icon name="lucide:x" />
                    </button>
                  </footer>
                </article>
              </div>
            </section>

            <section class="home-group">
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
                  <header class="home-slot-head">
                    <span class="home-slot-key-id">selected #{{ String(idx + 1).padStart(2, '0') }}</span>
                    <strong class="home-slot-key">{{ item.titleEn || item.seriesNameEn }}</strong>
                  </header>
                  <div class="home-slot-thumb">
                    <img :src="item.url" :alt="item.titleEn || item.seriesNameEn">
                  </div>
                  <div class="home-slot-meta">
                    <strong>{{ item.titleEn || item.seriesNameEn }}</strong>
                    <small>{{ item.seriesNameZh }} · {{ categoryLabel(item.categoryId) }}</small>
                  </div>
                  <footer class="home-slot-foot">
                    <span class="home-slot-pos">pos {{ item.position }}</span>
                    <button
                      type="button"
                      class="icon-btn is-danger"
                      title="移除"
                      @click="removeSelected(item.slotKey)"
                    >
                      <Icon name="lucide:x" />
                    </button>
                  </footer>
                </article>

                <button
                  type="button"
                  class="home-slot-add"
                  @click="openSelectedPicker"
                >
                  <Icon name="lucide:plus" />
                  <span>添加作品到 Selected</span>
                </button>
              </div>
            </section>
          </section>

          <!-- Series -->
          <section v-show="activeTab === 'series'" class="page">
            <header class="page-head">
              <div>
                <h2>系列</h2>
                <p>分类共 4 项（固定）。系列归属于分类，请先创建系列再上传。</p>
              </div>
              <button type="button" class="btn btn-primary" @click="openSeriesCreate">
                <Icon name="lucide:plus" />
                <span>新增系列</span>
              </button>
            </header>

            <div class="series-grid">
              <article v-for="cat in categories" :key="cat.id" class="series-card">
                <header class="series-card-head">
                  <Icon :name="cat.icon" class="series-card-icon" />
                  <div>
                    <strong>{{ cat.labelEn }}</strong>
                    <small>{{ cat.labelZh }} / {{ cat.labelJa }}</small>
                  </div>
                </header>
                <ul class="series-list">
                  <li
                    v-for="s in seriesList.filter(x => x.categoryId === cat.id)"
                    :key="s.id"
                  >
                    <div class="series-list-info">
                      <strong>{{ s.nameEn }}</strong>
                      <small>{{ s.nameZh }} / {{ s.nameJa }}</small>
                    </div>
                    <span class="series-list-count">{{ s.artworkCount }}</span>
                    <div class="series-list-actions">
                      <button type="button" class="icon-btn" title="编辑" @click="openSeriesEdit(s)">
                        <Icon name="lucide:edit-3" />
                      </button>
                      <button type="button" class="icon-btn is-danger" title="删除" @click="deleteSeries(s)">
                        <Icon name="lucide:trash" />
                      </button>
                    </div>
                  </li>
                  <li v-if="!seriesList.some(x => x.categoryId === cat.id)" class="series-list-empty">
                    暂无系列
                  </li>
                </ul>
              </article>
            </div>
          </section>
        </div>
      </section>
    </Transition>

    <!-- Series form modal -->
    <Transition name="fade">
      <div v-if="showSeriesForm" class="modal-shade" @click.self="showSeriesForm = false">
        <div class="modal">
          <header class="modal-head">
            <h3>{{ editingSeriesId ? '编辑系列' : '新增系列' }}</h3>
            <button type="button" class="icon-btn" @click="showSeriesForm = false">
              <Icon name="lucide:x" />
            </button>
          </header>
          <form class="modal-form" @submit.prevent="submitSeries">
            <label class="field">
              <span>分类</span>
              <select v-model="seriesForm.categoryId" required>
                <option value="" disabled>
                  选择分类
                </option>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ c.labelEn }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>Slug（可选）</span>
              <input v-model="seriesForm.slug" type="text" placeholder="留空则根据英文名生成">
            </label>
            <div class="form-row-3">
              <label class="field">
                <span>名称 (EN)</span>
                <input v-model="seriesForm.nameEn" type="text" required>
              </label>
              <label class="field">
                <span>名称 (ZH)</span>
                <input v-model="seriesForm.nameZh" type="text" required>
              </label>
              <label class="field">
                <span>名称 (JA)</span>
                <input v-model="seriesForm.nameJa" type="text" required>
              </label>
            </div>
            <div class="form-row-3">
              <label class="field">
                <span>描述 (EN)</span>
                <textarea v-model="seriesForm.descriptionEn" rows="2" />
              </label>
              <label class="field">
                <span>描述 (ZH)</span>
                <textarea v-model="seriesForm.descriptionZh" rows="2" />
              </label>
              <label class="field">
                <span>説明 (JA)</span>
                <textarea v-model="seriesForm.descriptionJa" rows="2" />
              </label>
            </div>
            <label class="field">
              <span>排序</span>
              <input v-model.number="seriesForm.sortOrder" type="number" min="0">
            </label>
            <footer class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="showSeriesForm = false">
                取消
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submittingSeries">
                <Icon name="lucide:save" />
                <span>{{ editingSeriesId ? '保存' : '创建' }}</span>
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Home slot picker -->
    <Transition name="fade">
      <div v-if="showHomePicker" class="modal-shade" @click.self="showHomePicker = false">
        <div class="modal modal-wide">
          <header class="modal-head">
            <h3>
              选择作品 ·
              <span v-if="homePickerMode?.type === 'slot'">{{ homePickerMode.slot }}</span>
              <span v-else-if="homePickerMode?.type === 'append-selected'">追加到 Selected</span>
            </h3>
            <button type="button" class="icon-btn" @click="showHomePicker = false">
              <Icon name="lucide:x" />
            </button>
          </header>
          <div class="picker-toolbar">
            <label class="field">
              <span>分类</span>
              <select v-model="homePickerCategory">
                <option value="">
                  全部分类
                </option>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ c.labelEn }}
                </option>
              </select>
            </label>
            <label class="field picker-search">
              <span>搜索</span>
              <input v-model="homePickerSearch" type="text" placeholder="标题或系列…">
            </label>
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
              @click="assignHomeSlot(a.id)"
            >
              <div class="picker-thumb">
                <img :src="a.url" :alt="a.titleEn || a.seriesNameEn">
              </div>
              <div class="picker-info">
                <strong>{{ a.titleEn || a.seriesNameEn }}</strong>
                <small>{{ a.seriesNameZh || a.seriesNameEn }} · {{ categoryLabel(a.categoryId) }}</small>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="loadingData && authed" class="status-toast">
        <Icon name="lucide:loader" class="spin" />
        <span>loading…</span>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.admin {
  position: relative;
  min-height: 100vh;
  background: #f6f6f7;
  color: #1a1d24;
  font-family:
    'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  --line: rgba(22, 24, 31, 0.1);
  --line-strong: rgba(22, 24, 31, 0.16);
  --muted: #6b7280;
  --accent: #8a1827;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ───── Login ───── */
.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 2rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  display: grid;
  gap: 1.25rem;
}

.login-head {
  display: grid;
  gap: 0.4rem;
}

.login-brand {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.login-head h1 {
  margin: 0;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.6rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #1a1d24;
}

.login-head p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--muted);
  line-height: 1.5;
}

.login-form {
  display: grid;
  gap: 0.75rem;
}

.login-hint {
  font-size: 0.78rem;
  color: var(--muted);
  text-align: center;
}

.login-hint code {
  font-family: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  background: rgba(22, 24, 31, 0.05);
  border: 1px solid var(--line);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #1a1d24;
}

.form-error {
  margin: 0;
  font-size: 0.82rem;
  color: #c0392b;
}

/* ───── App shell ───── */
.app {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  padding: 0.7rem 1.4rem;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.topbar-mark {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--line);
  flex: 0 0 auto;
}

.topbar-mark img { width: 100%; height: 100%; object-fit: cover; }

.topbar-text { display: grid; line-height: 1.15; }

.topbar-text strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.94rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.topbar-text small {
  font-size: 0.66rem;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 1px;
}

.topbar-tabs {
  display: flex;
  justify-content: center;
  gap: 0.2rem;
}

.topbar-tab {
  padding: 0.45rem 0.9rem;
  background: transparent;
  border: 0;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease, color 0.2s ease;
}

.topbar-tab:hover {
  background: rgba(22, 24, 31, 0.04);
  color: #1a1d24;
}

.topbar-tab.is-active {
  background: rgba(22, 24, 31, 0.06);
  color: #1a1d24;
  font-weight: 600;
}

.topbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

@media (max-width: 760px) {
  .topbar { grid-template-columns: 1fr; gap: 0.5rem; }
  .topbar-tabs { overflow-x: auto; justify-content: flex-start; }
}

.content {
  padding: 1.6rem;
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
}

.page { display: grid; gap: 1.2rem; }

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 0.6rem;
}

.page-head h2 {
  margin: 0 0 0.2rem;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #1a1d24;
}

.page-head p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--muted);
  line-height: 1.5;
}

/* ───── Buttons ───── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 0.95rem;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn-sm { padding: 0.4rem 0.7rem; font-size: 0.8rem; }

.btn-block { width: 100%; }

.btn-primary {
  background: #1a1d24;
  color: #fff;
  border-color: #1a1d24;
}

.btn-primary:hover:not(:disabled) { background: #2a2e36; border-color: #2a2e36; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-ghost {
  background: #fff;
  color: #1a1d24;
  border-color: var(--line-strong);
}

.btn-ghost:hover { background: rgba(22, 24, 31, 0.04); border-color: rgba(22, 24, 31, 0.24); }

.icon-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(22, 24, 31, 0.06);
  color: #1a1d24;
}

.icon-btn.is-danger:hover {
  background: rgba(192, 57, 43, 0.1);
  color: #c0392b;
}

/* ───── Fields ───── */
.field {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.field > span {
  font-size: 0.74rem;
  color: var(--muted);
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  padding: 0.5rem 0.65rem;
  background: #fff;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #1a1d24;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #1a1d24;
  box-shadow: 0 0 0 3px rgba(22, 24, 31, 0.06);
}

.field textarea {
  resize: vertical;
  min-height: 56px;
  line-height: 1.5;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.84rem;
  cursor: pointer;
  color: #1a1d24;
}

/* ───── Toolbar ───── */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.toolbar .field { min-width: 180px; }

.toolbar-count {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  align-self: center;
}

.toolbar-count strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1.1rem;
  color: var(--accent);
  font-weight: 500;
}

.toolbar-count small {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

/* ───── Empty ───── */
.empty {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  padding: 4rem 1rem;
  background: #fff;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  color: var(--muted);
  font-size: 0.9rem;
}

.empty :deep(svg) { font-size: 2rem; opacity: 0.55; }
.empty p { margin: 0; }

/* ───── Dropzone ───── */
.dropzone {
  display: grid;
  place-items: center;
  gap: 0.4rem;
  padding: 3.4rem 1.4rem;
  background: #fff;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropzone:hover, .dropzone.is-over {
  border-color: #1a1d24;
  background: rgba(22, 24, 31, 0.02);
}

.dropzone-icon {
  font-size: 2rem;
  color: var(--muted);
}

.dropzone-title {
  margin: 0;
  font-size: 1rem;
  color: #1a1d24;
  font-weight: 500;
}

.dropzone small {
  font-size: 0.78rem;
  color: var(--muted);
  letter-spacing: 0.04em;
}

/* ───── Upload list ───── */
.upload-block { display: grid; gap: 0.7rem; }

.upload-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.4rem 0;
}

.upload-toolbar strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--accent);
  font-weight: 500;
  margin-right: 0.2rem;
}

.upload-toolbar-actions {
  display: inline-flex;
  gap: 0.4rem;
}

.upload-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.upload-item {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 0.95rem;
  padding: 0.85rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  align-items: start;
  transition: border-color 0.2s ease;
}

.upload-item.status-saved { border-color: rgba(34, 139, 34, 0.4); }
.upload-item.status-error { border-color: rgba(192, 57, 43, 0.45); }

.upload-thumb {
  position: relative;
  width: 96px;
  aspect-ratio: 1;
  background: #f0eeec;
  border-radius: 6px;
  overflow: hidden;
}

.upload-thumb img { width: 100%; height: 100%; object-fit: cover; }

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #1a1d24;
  transition: width 0.3s ease;
}

.upload-pill {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 1px 6px;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  border-radius: 3px;
  background: #fff;
  border: 1px solid var(--line);
  color: #1a1d24;
}

.upload-pill.is-ok { background: #228b22; color: #fff; border-color: transparent; }
.upload-pill.is-error { background: #c0392b; color: #fff; border-color: transparent; }
.upload-pill.is-busy { background: rgba(22, 24, 31, 0.6); color: #fff; border-color: transparent; }

.upload-fields {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: 1fr 1fr;
}

.upload-toggles {
  grid-column: 1 / -1;
  display: flex;
  gap: 1rem;
  font-size: 0.82rem;
  color: var(--muted);
  padding-top: 0.2rem;
}

.upload-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.74rem;
  color: var(--muted);
}

.upload-meta-error { color: #c0392b; }

@media (max-width: 760px) {
  .upload-item { grid-template-columns: 1fr; }
  .upload-fields { grid-template-columns: 1fr; }
}

/* ───── Series ───── */
.series-grid {
  display: grid;
  gap: 0.95rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.series-card {
  display: grid;
  gap: 0.7rem;
  padding: 1.05rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.series-card-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--line);
}

.series-card-icon {
  font-size: 1rem;
  color: var(--muted);
}

.series-card-head strong {
  display: block;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.96rem;
  letter-spacing: 0.02em;
}

.series-card-head small {
  font-size: 0.72rem;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.series-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
}

.series-list li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  background: rgba(22, 24, 31, 0.02);
  border-radius: 6px;
  transition: background 0.2s ease;
}

.series-list li:hover { background: rgba(22, 24, 31, 0.04); }

.series-list-info { display: grid; gap: 0.05rem; min-width: 0; }

.series-list-info strong {
  font-size: 0.86rem;
  font-weight: 600;
}

.series-list-info small {
  font-size: 0.72rem;
  color: var(--muted);
}

.series-list-count {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.84rem;
  color: var(--accent);
}

.series-list-actions {
  display: inline-flex;
  gap: 0.2rem;
}

.series-list-empty {
  display: block;
  padding: 0.5rem 0.6rem;
  background: transparent;
  font-size: 0.78rem;
  color: var(--muted);
  font-style: italic;
}

/* ───── Artworks ───── */
.artworks-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.artwork-card {
  display: grid;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.artwork-card.is-featured { border-color: rgba(138, 24, 39, 0.5); }

.artwork-thumb {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: #f0eeec;
}

.artwork-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.artwork-card:hover .artwork-thumb img { transform: scale(1.04); }

.artwork-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.7);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.artwork-card:hover .artwork-overlay { opacity: 1; }

.overlay-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: #fff;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  color: #1a1d24;
  cursor: pointer;
  transition: all 0.2s ease;
}

.overlay-btn:hover {
  background: #1a1d24;
  color: #fff;
  border-color: #1a1d24;
}

.overlay-btn.is-on {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.overlay-btn.is-danger:hover {
  background: #c0392b;
  border-color: #c0392b;
  color: #fff;
}

.artwork-info {
  display: grid;
  gap: 0.18rem;
  padding: 0.7rem 0.8rem 0.85rem;
}

.artwork-info strong {
  font-size: 0.86rem;
  font-weight: 600;
}

.artwork-info small {
  font-size: 0.72rem;
  color: var(--muted);
}

.artwork-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.3rem;
}

.tag {
  font-style: normal;
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  background: rgba(22, 24, 31, 0.05);
  color: var(--muted);
  border-radius: 3px;
}

.tag.tag-accent {
  background: var(--accent);
  color: #fff;
}

/* ───── Home slots ───── */
.home-group {
  display: grid;
  gap: 0.95rem;
}

.home-group + .home-group {
  margin-top: 0.6rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--line);
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
  color: var(--muted);
  line-height: 1.5;
  max-width: 60ch;
}

.home-group-eyebrow {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.78rem;
  color: var(--accent);
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
  color: var(--accent);
  font-weight: 500;
}

.home-group-tally small {
  font-style: italic;
  font-size: 0.74rem;
  color: var(--muted);
}

.home-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.home-slot {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.home-slot.is-set { border-color: rgba(22, 24, 31, 0.24); }

.home-slot-head {
  display: grid;
  gap: 0.15rem;
  padding: 0.7rem 0.85rem 0.5rem;
  border-bottom: 1px solid var(--line);
}

.home-slot-key-id {
  font-family: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  font-size: 0.66rem;
  color: var(--muted);
  letter-spacing: 0.02em;
}

.home-slot-key {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.home-slot-thumb {
  position: relative;
  aspect-ratio: 4 / 5;
  background: #f0eeec;
  overflow: hidden;
}

.home-slot-thumb img { width: 100%; height: 100%; object-fit: cover; }

.home-slot-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.78rem;
}

.home-slot-empty :deep(svg) { font-size: 1.4rem; opacity: 0.55; }

.home-slot-meta {
  display: grid;
  gap: 0.18rem;
  padding: 0.6rem 0.85rem 0.4rem;
  min-height: 2.6rem;
}

.home-slot-meta strong {
  font-size: 0.84rem;
  font-weight: 600;
}

.home-slot-meta small {
  font-size: 0.72rem;
  color: var(--muted);
}

.home-slot-default {
  font-style: italic;
  color: var(--muted);
}

.home-slot-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  padding: 0.5rem 0.85rem 0.7rem;
}

.home-slot-pos {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.74rem;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.home-slot-add {
  display: grid;
  place-items: center;
  gap: 0.4rem;
  min-height: 100%;
  padding: 1.4rem 1rem;
  background: rgba(22, 24, 31, 0.02);
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  color: var(--muted);
  font-family: inherit;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.home-slot-add:hover {
  background: rgba(22, 24, 31, 0.04);
  border-color: #1a1d24;
  color: #1a1d24;
}

.home-slot-add :deep(svg) { font-size: 1.2rem; }

/* ───── Picker ───── */
.modal.modal-wide { width: min(960px, 100%); max-height: 90vh; overflow: hidden; display: grid; grid-template-rows: auto auto auto 1fr; }

.picker-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.7rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--line);
}

.picker-toolbar .field { min-width: 160px; }
.picker-toolbar .picker-search { flex: 1; min-width: 200px; }

.picker-grid {
  list-style: none;
  margin: 0;
  padding: 0.4rem 0.1rem 0.1rem;
  display: grid;
  gap: 0.6rem;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  overflow-y: auto;
}

.picker-card {
  display: grid;
  grid-template-rows: auto auto;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.picker-card:hover {
  border-color: #1a1d24;
  transform: translateY(-1px);
}

.picker-thumb {
  aspect-ratio: 4 / 5;
  background: #f0eeec;
  overflow: hidden;
}

.picker-thumb img { width: 100%; height: 100%; object-fit: cover; }

.picker-info {
  display: grid;
  gap: 0.1rem;
  padding: 0.5rem 0.6rem 0.6rem;
}

.picker-info strong {
  font-size: 0.78rem;
  font-weight: 600;
}

.picker-info small {
  font-size: 0.68rem;
  color: var(--muted);
}

/* ───── Modal ───── */
.modal-shade {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(15, 16, 20, 0.45);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.modal {
  width: min(640px, 100%);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1.2rem 1.4rem 1.4rem;
  display: grid;
  gap: 0.95rem;
  box-shadow: 0 20px 50px rgba(15, 16, 20, 0.18);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid var(--line);
}

.modal-head h3 {
  margin: 0;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.modal-form {
  display: grid;
  gap: 0.75rem;
}

.form-row-3 {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: 1fr 1fr 1fr;
}

@media (max-width: 720px) {
  .form-row-3 { grid-template-columns: 1fr; }
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  padding-top: 0.4rem;
  border-top: 1px solid var(--line);
}

/* ───── Status toast ───── */
.status-toast {
  position: fixed;
  right: 1.2rem;
  bottom: 1.2rem;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 0.82rem;
  color: var(--muted);
  box-shadow: 0 8px 18px rgba(15, 16, 20, 0.08);
}

.spin { animation: spin 1.4s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
