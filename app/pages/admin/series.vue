<script setup lang="ts">
definePageMeta({ layout: false })

const store = useAdminStore()
const { adminApi, categories, seriesList, artworks, loadAll, categoryLabel } = store
const { t, localizedCategoryLabel, localizedSeriesDescription, localizedSeriesName } = useAdminI18n()

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
const submittingSeries = ref(false)

const showAttachPicker = ref(false)
const pickerSearch = ref('')
const pickerSelectedIds = ref<string[]>([])
const linkBusy = ref(false)

const orderedLinkedIds = ref<string[]>([])
const isReordering = ref(false)
const dragSourceId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

watchEffect(() => {
  if (isReordering.value) {
    return
  }
  if (!editingSeriesId.value) {
    orderedLinkedIds.value = []
    return
  }
  const sid = editingSeriesId.value
  orderedLinkedIds.value = artworks.value
    .filter(a => a.seriesIds.includes(sid))
    .map((a) => {
      const entry = a.seriesEntries.find(e => e.seriesId === sid)
      return { id: a.id, order: entry?.sortOrder ?? 0, createdAt: a.createdAt }
    })
    .sort((a, b) => a.order - b.order || b.createdAt - a.createdAt)
    .map(x => x.id)
})

const linkedArtworks = computed(() => {
  return orderedLinkedIds.value
    .map(id => artworks.value.find(a => a.id === id))
    .filter((a): a is typeof artworks.value[number] => Boolean(a))
})

const pickerCandidates = computed(() => {
  if (!editingSeriesId.value) {
    return []
  }
  const sid = editingSeriesId.value
  const query = pickerSearch.value.trim().toLowerCase()
  return artworks.value.filter((a) => {
    if (a.seriesIds.includes(sid)) {
      return false
    }
    if (!query) {
      return true
    }
    return [
      a.titleEn, a.titleZh, a.titleJa,
      a.primarySeriesNameEn, a.primarySeriesNameZh, a.primarySeriesNameJa,
    ].some(v => v.toLowerCase().includes(query))
  })
})

function togglePickerSelection(id: string) {
  const idx = pickerSelectedIds.value.indexOf(id)
  if (idx === -1) {
    pickerSelectedIds.value.push(id)
  }
  else {
    pickerSelectedIds.value.splice(idx, 1)
  }
}

function openAttachPicker() {
  pickerSearch.value = ''
  pickerSelectedIds.value = []
  showAttachPicker.value = true
}

function closeAttachPicker() {
  showAttachPicker.value = false
}

async function detachArtwork(item: typeof artworks.value[number]) {
  if (!editingSeriesId.value) {
    return
  }
  const sid = editingSeriesId.value
  const remaining = item.seriesIds.filter(id => id !== sid)
  if (remaining.length === 0) {
    alert(t('cannotDetachLastSeries'))
    return
  }
  const name = item.titleEn || item.primarySeriesNameEn || item.id
  if (!confirm(t('confirmDetachArtwork', { name }))) {
    return
  }
  const newPrimary = item.primarySeriesId === sid ? remaining[0] : item.primarySeriesId
  linkBusy.value = true
  try {
    await adminApi.fetch(`/api/admin/artworks/${item.id}`, {
      method: 'PATCH',
      body: { seriesIds: remaining, primarySeriesId: newPrimary },
    })
    await loadAll()
  }
  catch (error) {
    console.error('detach artwork failed', error)
  }
  finally {
    linkBusy.value = false
  }
}

async function attachSelectedArtworks() {
  if (!editingSeriesId.value || pickerSelectedIds.value.length === 0) {
    return
  }
  const sid = editingSeriesId.value
  linkBusy.value = true
  try {
    for (const id of pickerSelectedIds.value) {
      const art = artworks.value.find(a => a.id === id)
      if (!art || art.seriesIds.includes(sid)) {
        continue
      }
      await adminApi.fetch(`/api/admin/artworks/${id}`, {
        method: 'PATCH',
        body: {
          seriesIds: [...art.seriesIds, sid],
          primarySeriesId: art.primarySeriesId,
        },
      })
    }
    pickerSelectedIds.value = []
    showAttachPicker.value = false
    await loadAll()
  }
  catch (error) {
    console.error('attach artworks failed', error)
  }
  finally {
    linkBusy.value = false
  }
}

function onLinkDragStart(event: DragEvent, id: string) {
  dragSourceId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }
}

function onLinkDragOver(event: DragEvent, id: string) {
  if (!dragSourceId.value || dragSourceId.value === id) {
    return
  }
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverId.value = id
}

function onLinkDragLeave(id: string) {
  if (dragOverId.value === id) {
    dragOverId.value = null
  }
}

function onLinkDragEnd() {
  dragSourceId.value = null
  dragOverId.value = null
}

async function onLinkDrop(event: DragEvent, targetId: string) {
  event.preventDefault()
  const srcId = dragSourceId.value
  dragSourceId.value = null
  dragOverId.value = null
  if (!srcId || srcId === targetId || !editingSeriesId.value) {
    return
  }
  const list = [...orderedLinkedIds.value]
  const srcIdx = list.indexOf(srcId)
  const tgtIdx = list.indexOf(targetId)
  if (srcIdx === -1 || tgtIdx === -1) {
    return
  }
  list.splice(srcIdx, 1)
  list.splice(tgtIdx, 0, srcId)
  orderedLinkedIds.value = list
  await persistLinkedOrder()
}

async function persistLinkedOrder() {
  if (!editingSeriesId.value) {
    return
  }
  const sid = editingSeriesId.value
  const ids = [...orderedLinkedIds.value]
  isReordering.value = true
  try {
    await adminApi.fetch(`/api/admin/series/${sid}/artwork-order`, {
      method: 'PATCH',
      body: { artworkIds: ids },
    })
    await loadAll()
  }
  catch (error) {
    console.error('reorder failed', error)
  }
  finally {
    isReordering.value = false
  }
}

const seriesByCategory = computed(() => {
  const map: Record<string, typeof seriesList.value> = {}
  for (const cat of categories.value) {
    map[cat.id] = []
  }
  for (const s of seriesList.value) {
    if (!map[s.categoryId]) {
      map[s.categoryId] = []
    }
    map[s.categoryId]!.push(s)
  }
  return map
})

function seriesCoverUrl(item: typeof seriesList.value[number]): string | null {
  if (item.coverArtworkId) {
    const cover = artworks.value.find(a => a.id === item.coverArtworkId)
    if (cover) {
      return cover.url
    }
  }
  const fallback = artworks.value.find(a => a.seriesIds.includes(item.id))
  return fallback?.url ?? null
}

function resetSeriesForm(presetCategoryId?: string) {
  seriesForm.slug = ''
  seriesForm.categoryId = presetCategoryId ?? categories.value[0]?.id ?? ''
  seriesForm.nameZh = ''
  seriesForm.nameEn = ''
  seriesForm.nameJa = ''
  seriesForm.descriptionZh = ''
  seriesForm.descriptionEn = ''
  seriesForm.descriptionJa = ''
  seriesForm.sortOrder = 0
  editingSeriesId.value = null
}

function openSeriesCreate(presetCategoryId?: string) {
  resetSeriesForm(presetCategoryId)
  showSeriesForm.value = true
}

function openSeriesEdit(item: typeof seriesList.value[number]) {
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

function closeSeriesForm() {
  showSeriesForm.value = false
  showAttachPicker.value = false
  pickerSelectedIds.value = []
}

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

async function deleteSeries(item: typeof seriesList.value[number]) {
  if (!confirm(t('confirmDeleteSeries', { name: localizedSeriesName(item) }))) {
    return
  }
  await adminApi.fetch(`/api/admin/series/${item.id}`, { method: 'DELETE' })
  await loadAll()
}

</script>

<template>
  <section class="page">
    <header class="page-head">
      <div>
        <h2>{{ t('seriesTitle') }}</h2>
        <p>{{ t('seriesDescription', { count: categories.length }) }}</p>
      </div>
      <div class="page-head-meta">
        <span class="head-stat">
          <strong>{{ seriesList.length }}</strong>
          <small>{{ t('seriesTotal') }}</small>
        </span>
        <button type="button" class="btn btn-primary" @click="openSeriesCreate()">
          <Icon name="lucide:plus" />
          <span>{{ t('addSeries') }}</span>
        </button>
      </div>
    </header>

    <div class="series-stack">
      <article v-for="cat in categories" :key="cat.id" class="series-section">
        <header class="series-section-head">
          <span class="series-section-mark" aria-hidden="true">
            <Icon :name="cat.icon" />
          </span>
          <div class="series-section-title">
            <strong>{{ localizedCategoryLabel(cat) }}</strong>
            <small>{{ cat.id }}</small>
          </div>
          <span class="series-section-count">
            <strong>{{ seriesByCategory[cat.id]?.length ?? 0 }}</strong>
            <small>{{ t('series') }}</small>
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="openSeriesCreate(cat.id)"
          >
            <Icon name="lucide:plus" />
            <span>{{ t('commonAdd') }}</span>
          </button>
        </header>

        <ul
          v-if="seriesByCategory[cat.id]?.length"
          class="series-grid"
        >
          <li
            v-for="s in seriesByCategory[cat.id]"
            :key="s.id"
            class="series-card"
          >
            <div class="series-card-thumb">
              <img
                v-if="seriesCoverUrl(s)"
                :src="seriesCoverUrl(s)!"
                :alt="localizedSeriesName(s)"
                loading="lazy"
              >
              <span v-else class="series-card-thumb-empty">
                <Icon name="lucide:image-off" />
              </span>
              <span class="series-card-count" :title="t('artworkCountTitle', { count: s.artworkCount })">
                <Icon name="lucide:layers" />
                <em>{{ s.artworkCount }}</em>
              </span>
              <div class="series-card-overlay">
                <button
                  type="button"
                  class="overlay-btn"
                  :title="t('commonEdit')"
                  @click="openSeriesEdit(s)"
                >
                  <Icon name="lucide:edit-3" />
                </button>
                <button
                  type="button"
                  class="overlay-btn is-danger"
                  :title="t('commonDelete')"
                  @click="deleteSeries(s)"
                >
                  <Icon name="lucide:trash" />
                </button>
              </div>
            </div>
            <div class="series-card-info">
              <strong class="series-card-name">{{ localizedSeriesName(s) }}</strong>
              <small class="series-card-sub">{{ s.slug }}</small>
              <p
                v-if="localizedSeriesDescription(s)"
                class="series-card-desc"
              >
                {{ localizedSeriesDescription(s) }}
              </p>
            </div>
          </li>
        </ul>
        <div v-else class="series-section-empty">
          <Icon name="lucide:folder-open" />
          <p>{{ t('emptySeries') }}</p>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="openSeriesCreate(cat.id)"
          >
            <Icon name="lucide:plus" />
            <span>{{ t('addFirstSeries') }}</span>
          </button>
        </div>
      </article>
    </div>

    <AdminModal v-model="showSeriesForm" @close="closeSeriesForm">
      <template #title>
        {{ editingSeriesId ? t('editSeries') : t('createSeries') }}
      </template>
      <form class="modal-form" @submit.prevent="submitSeries">
        <div class="form-row-2">
          <label class="field">
            <span>{{ t('category') }}</span>
            <select v-model="seriesForm.categoryId" required>
              <option value="" disabled>
                {{ t('selectCategory') }}
              </option>
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ localizedCategoryLabel(c) }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>{{ t('slugOptional') }}</span>
            <input v-model="seriesForm.slug" type="text" :placeholder="t('slugPlaceholder')">
          </label>
        </div>
        <div class="form-row-3">
          <label class="field">
            <span>{{ t('nameEn') }}</span>
            <input v-model="seriesForm.nameEn" type="text" required>
          </label>
          <label class="field">
            <span>{{ t('nameZh') }}</span>
            <input v-model="seriesForm.nameZh" type="text" required>
          </label>
          <label class="field">
            <span>{{ t('nameJa') }}</span>
            <input v-model="seriesForm.nameJa" type="text" required>
          </label>
        </div>
        <div class="form-row-3">
          <label class="field">
            <span>{{ t('descriptionEn') }}</span>
            <textarea v-model="seriesForm.descriptionEn" rows="2" />
          </label>
          <label class="field">
            <span>{{ t('descriptionZh') }}</span>
            <textarea v-model="seriesForm.descriptionZh" rows="2" />
          </label>
          <label class="field">
            <span>{{ t('descriptionJa') }}</span>
            <textarea v-model="seriesForm.descriptionJa" rows="2" />
          </label>
        </div>
        <label class="field field-narrow">
          <span>{{ t('order') }}</span>
          <input v-model.number="seriesForm.sortOrder" type="number" min="0">
        </label>

        <section v-if="editingSeriesId" class="link-section">
          <header class="link-section-head">
            <div>
              <strong>{{ t('linkedArtworks') }}</strong>
              <small>{{ t('linkedArtworksHint') }}</small>
            </div>
            <span class="link-section-count">
              <strong>{{ linkedArtworks.length }}</strong>
              <small>{{ linkedArtworks.length > 1 ? t('worksUnit') : t('workUnit') }}</small>
            </span>
          </header>

          <ul v-if="linkedArtworks.length > 0" class="link-grid">
            <li
              v-for="art in linkedArtworks"
              :key="art.id"
              class="link-card"
              :class="{
                'is-dragging': dragSourceId === art.id,
                'is-drop-target': dragOverId === art.id && dragSourceId !== art.id,
              }"
              draggable="true"
              @dragstart="onLinkDragStart($event, art.id)"
              @dragover="onLinkDragOver($event, art.id)"
              @dragleave="onLinkDragLeave(art.id)"
              @drop="onLinkDrop($event, art.id)"
              @dragend="onLinkDragEnd"
            >
              <div class="link-thumb">
                <img :src="art.url" :alt="art.titleEn || art.primarySeriesNameEn" loading="lazy" draggable="false">
                <span class="link-drag-handle" :title="t('dragToReorder')">
                  <Icon name="lucide:grip-vertical" />
                </span>
                <button
                  type="button"
                  class="link-detach"
                  :disabled="linkBusy"
                  :title="t('detachArtwork')"
                  @click="detachArtwork(art)"
                >
                  <Icon name="lucide:x" />
                </button>
                <span
                  v-if="art.primarySeriesId === editingSeriesId"
                  class="link-primary-flag"
                  :title="t('primarySeriesTitle', { name: localizedSeriesName(art) })"
                >
                  <Icon name="lucide:star" />
                </span>
              </div>
              <div class="link-info">
                <strong>{{ art.titleEn || art.primarySeriesNameEn }}</strong>
                <small v-if="art.seriesIds.length > 1">+{{ art.seriesIds.length - 1 }}</small>
              </div>
            </li>
          </ul>
          <p v-else class="link-empty">
            {{ t('noLinkedArtworks') }}
          </p>

          <div class="link-add-row">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="linkBusy" @click="openAttachPicker">
              <Icon name="lucide:plus" />
              <span>{{ t('attachArtworks') }}</span>
            </button>
            <small>{{ t('attachArtworksHint') }}</small>
          </div>
        </section>

        <footer class="modal-foot">
          <button type="button" class="btn btn-ghost" @click="closeSeriesForm">
            {{ t('commonCancel') }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submittingSeries">
            <Icon name="lucide:save" />
            <span>{{ editingSeriesId ? t('commonSave') : t('commonCreate') }}</span>
          </button>
        </footer>
      </form>
    </AdminModal>

    <AdminModal v-model="showAttachPicker" size="picker" @close="closeAttachPicker">
      <template #title>
        {{ t('attachArtworks') }}
      </template>
      <div class="attach-picker-toolbar">
        <div class="attach-picker-search">
          <Icon name="lucide:search" class="attach-picker-search-icon" />
          <input v-model="pickerSearch" type="text" :placeholder="t('searchTitleOrSeries')">
        </div>
        <span class="attach-picker-count">
          <strong>{{ pickerSelectedIds.length }}</strong>
          <small>/ {{ pickerCandidates.length }}</small>
        </span>
      </div>

      <div class="attach-picker-body">
        <p v-if="pickerCandidates.length === 0" class="link-empty">
          {{ t('pickerNoCandidates') }}
        </p>
        <ul v-else class="attach-picker-grid">
          <li
            v-for="art in pickerCandidates"
            :key="art.id"
            class="attach-picker-card"
            :class="{ 'is-selected': pickerSelectedIds.includes(art.id) }"
            @click="togglePickerSelection(art.id)"
          >
            <div class="attach-picker-thumb">
              <img :src="art.url" :alt="art.titleEn || art.primarySeriesNameEn" loading="lazy">
              <span v-if="pickerSelectedIds.includes(art.id)" class="attach-picker-tick">
                <Icon name="lucide:check" />
              </span>
            </div>
            <div class="attach-picker-info">
              <strong>{{ art.titleEn || art.primarySeriesNameEn }}</strong>
              <small>{{ localizedSeriesName(art) }} · {{ categoryLabel(art.primaryCategoryId) }}</small>
            </div>
          </li>
        </ul>
      </div>

      <footer class="attach-picker-foot">
        <button type="button" class="btn btn-ghost" @click="closeAttachPicker">
          {{ t('commonCancel') }}
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="pickerSelectedIds.length === 0 || linkBusy"
          @click="attachSelectedArtworks"
        >
          <Icon name="lucide:link" />
          <span>{{ t('attachSelected', { count: pickerSelectedIds.length }) }}</span>
        </button>
      </footer>
    </AdminModal>
  </section>
</template>

<style scoped>
.page-head-meta {
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;
}

.head-stat {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
}
.head-stat strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1.25rem;
  font-weight: 500;
  color: #8a1827;
}
.head-stat small {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
  margin-top: 1px;
}

.series-stack {
  display: grid;
  gap: 1.6rem;
}

.series-section {
  display: grid;
  gap: 0.85rem;
}

.series-section-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(22, 24, 31, 0.1);
}

.series-section-mark {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(22, 24, 31, 0.05);
  color: #1a1d24;
  font-size: 1.05rem;
  flex: 0 0 auto;
}

.series-section-title { display: grid; line-height: 1.2; min-width: 0; }
.series-section-title strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #1a1d24;
}
.series-section-title small {
  font-size: 0.74rem;
  color: #6b7280;
  letter-spacing: 0.04em;
  margin-top: 1px;
}

.series-section-count {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
}
.series-section-count strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1rem;
  color: #8a1827;
  font-weight: 500;
}
.series-section-count small {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

.series-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.series-card {
  display: grid;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.series-card:hover {
  border-color: rgba(22, 24, 31, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(15, 16, 20, 0.06);
}

.series-card-thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f0eeec;
}
.series-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.series-card:hover .series-card-thumb img { transform: scale(1.04); }

.series-card-thumb-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(22, 24, 31, 0.25);
  font-size: 1.6rem;
}

.series-card-count {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(22, 24, 31, 0.12);
  border-radius: 999px;
  font-size: 0.72rem;
  color: #1a1d24;
  backdrop-filter: blur(4px);
}
.series-card-count em {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 500;
  color: #8a1827;
}

.series-card-overlay {
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
.series-card:hover .series-card-overlay { opacity: 1; }

.overlay-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.16);
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
.overlay-btn.is-danger:hover {
  background: #c0392b;
  border-color: #c0392b;
  color: #fff;
}

.series-card-info {
  display: grid;
  gap: 0.25rem;
  padding: 0.7rem 0.8rem 0.85rem;
  min-width: 0;
}
.series-card-name {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #1a1d24;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.series-card-sub {
  font-size: 0.74rem;
  color: #6b7280;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.series-card-desc {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-section-empty {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: #fff;
  border: 1px dashed rgba(22, 24, 31, 0.16);
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.84rem;
}
.series-section-empty p { margin: 0; }
.series-section-empty :deep(svg) {
  font-size: 1.1rem;
  opacity: 0.6;
}
.series-section-empty .btn { margin-left: auto; }

.form-row-2 {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 720px) {
  .form-row-2 { grid-template-columns: 1fr; }
}

.field-narrow { max-width: 200px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.link-section {
  display: grid;
  gap: 0.55rem;
  padding-top: 0.85rem;
  margin-top: 0.5rem;
  border-top: 1px solid rgba(22, 24, 31, 0.1);
}

.link-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.6rem;
}
.link-section-head strong {
  display: block;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.98rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #1a1d24;
}
.link-section-head small {
  display: block;
  font-size: 0.74rem;
  color: #6b7280;
  line-height: 1.4;
  margin-top: 2px;
}

.link-section-count {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  flex-shrink: 0;
}
.link-section-count strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1rem;
  color: #8a1827;
  font-weight: 500;
}
.link-section-count small {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

.link-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
}

.link-card {
  display: grid;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.1);
  border-radius: 6px;
  overflow: hidden;
  cursor: grab;
  transition: border-color 0.18s ease, transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
  user-select: none;
}
.link-card:hover { border-color: rgba(22, 24, 31, 0.3); transform: translateY(-1px); }
.link-card:active { cursor: grabbing; }
.link-card.is-dragging { opacity: 0.4; transform: scale(0.97); }
.link-card.is-drop-target {
  border-color: #8a1827;
  box-shadow: 0 0 0 2px rgba(138, 24, 39, 0.25);
}
.link-card.is-drop-target .link-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(138, 24, 39, 0.12);
  pointer-events: none;
}

.link-drag-handle {
  position: absolute;
  bottom: 4px;
  left: 4px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: rgba(15, 16, 20, 0.55);
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
.link-drag-handle :deep(svg) { font-size: 0.85rem; }
.link-card:hover .link-drag-handle { opacity: 1; }

.link-thumb {
  position: relative;
  aspect-ratio: 1;
  background: #f0eeec;
  overflow: hidden;
}
.link-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.link-detach {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(22, 24, 31, 0.16);
  border-radius: 4px;
  color: #1a1d24;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.link-card:hover .link-detach { opacity: 1; }
.link-detach:hover {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
}
.link-detach:disabled { opacity: 0.5; cursor: not-allowed; }

.link-primary-flag {
  position: absolute;
  top: 4px;
  left: 4px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  background: rgba(138, 24, 39, 0.92);
  color: #fbbf24;
  border-radius: 4px;
}
.link-primary-flag :deep(svg) { font-size: 0.7rem; }

.link-info {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  padding: 0.4rem 0.5rem 0.5rem;
  min-width: 0;
}
.link-info strong {
  font-size: 0.74rem;
  font-weight: 600;
  color: #1a1d24;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.link-info small {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.7rem;
  color: #8a1827;
  flex-shrink: 0;
}

.link-empty {
  margin: 0;
  padding: 0.7rem 0.85rem;
  background: rgba(22, 24, 31, 0.03);
  border: 1px dashed rgba(22, 24, 31, 0.16);
  border-radius: 6px;
  font-size: 0.78rem;
  color: #6b7280;
  text-align: center;
}

.link-add-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding-top: 0.2rem;
}
.link-add-row small {
  font-size: 0.74rem;
  color: #6b7280;
}

.attach-picker-toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(22, 24, 31, 0.1);
}
.attach-picker-search {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}
.attach-picker-search-icon {
  position: absolute;
  left: 0.6rem;
  font-size: 0.95rem;
  color: #9ca3af;
  pointer-events: none;
}
.attach-picker-search input {
  width: 100%;
  padding: 0.45rem 0.7rem 0.45rem 2rem;
  font-family: inherit;
  font-size: 0.86rem;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.16);
  border-radius: 5px;
  transition: border-color 0.2s ease;
}
.attach-picker-search input:focus { outline: none; border-color: #1a1d24; }

.attach-picker-count {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  flex-shrink: 0;
}
.attach-picker-count strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1.05rem;
  font-weight: 500;
  color: #8a1827;
}
.attach-picker-count small {
  font-size: 0.74rem;
  color: #6b7280;
}

.attach-picker-body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.attach-picker-grid {
  list-style: none;
  margin: 0;
  padding: 0.4rem 0.1rem 0.1rem;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
}

.attach-picker-card {
  display: grid;
  grid-template-rows: auto auto;
  align-self: start;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.1);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.attach-picker-card:hover {
  border-color: #1a1d24;
  transform: translateY(-1px);
}
.attach-picker-card.is-selected {
  border-color: #8a1827;
  background: #fbf6f6;
}

.attach-picker-thumb {
  position: relative;
  aspect-ratio: 1;
  background: #f0eeec;
  overflow: hidden;
}
.attach-picker-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s ease;
}

.attach-picker-tick {
  position: absolute;
  inset: auto 0.5rem 0.5rem 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  background: rgba(138, 24, 39, 0.92);
  color: #fff;
  border-radius: 999px;
  width: fit-content;
}
.attach-picker-tick :deep(svg) { font-size: 0.95rem; }

.attach-picker-info {
  display: grid;
  gap: 0.18rem;
  padding: 0.55rem 0.7rem 0.7rem;
  min-width: 0;
}
.attach-picker-info strong {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.attach-picker-info small {
  font-size: 0.72rem;
  color: #4a5061;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attach-picker-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(22, 24, 31, 0.1);
}
</style>
