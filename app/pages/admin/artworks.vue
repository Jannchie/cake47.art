<script setup lang="ts">
definePageMeta({ layout: false })

const store = useAdminStore()
const { adminApi, categories, seriesList, artworks, loadAll, bytesLabel, categoryLabel, seriesNameById } = store
const {
  t,
  localizedArtworkTitle,
  localizedCategoryLabel,
  localizedSeriesName,
} = useAdminI18n()

const filterSeries = ref<string>('')
const filterCategory = ref<string>('')

const filteredArtworks = computed(() => {
  return artworks.value.filter((a) => {
    if (filterSeries.value && !a.seriesIds.includes(filterSeries.value)) {
      return false
    }
    if (filterCategory.value && !a.categoryIds.includes(filterCategory.value)) {
      return false
    }
    return true
  })
})

const groupedArtworks = computed(() => {
  return categories.value
    .map((cat) => {
      const catItems = filteredArtworks.value.filter(a => a.categoryIds.includes(cat.id))
      if (catItems.length === 0) {
        return null
      }
      const seriesInCat = seriesList.value.filter(s => s.categoryId === cat.id)
      const seriesGroups = seriesInCat
        .map(series => ({
          series,
          items: catItems.filter(a => a.seriesIds.includes(series.id)),
        }))
        .filter(g => g.items.length > 0)
      const knownSeriesIds = new Set(seriesInCat.map(s => s.id))
      const orphanItems = catItems.filter(a =>
        !a.seriesIds.some(id => knownSeriesIds.has(id))
        && a.primaryCategoryId === cat.id,
      )
      return {
        category: cat,
        items: catItems,
        seriesGroups,
        orphanItems,
      }
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
})

function clearFilters() {
  filterCategory.value = ''
  filterSeries.value = ''
}

async function deleteArtwork(item: typeof artworks.value[number]) {
  if (!confirm(t('confirmDeleteArtwork', { name: localizedArtworkTitle(item, localizedSeriesName(item)) }))) {
    return
  }
  await adminApi.fetch(`/api/admin/artworks/${item.id}`, { method: 'DELETE' })
  await loadAll()
}

const showEdit = ref(false)
const editingId = ref<string | null>(null)
const editingUrl = ref<string>('')
const editingMeta = ref<{ width: number; height: number; sizeBytes: number; mimeType: string }>({
  width: 0,
  height: 0,
  sizeBytes: 0,
  mimeType: '',
})
const submittingEdit = ref(false)
const editError = ref<string>('')

const editForm = reactive({
  seriesIds: [] as string[],
  primarySeriesId: '',
  titleEn: '',
  titleZh: '',
  titleJa: '',
  descriptionEn: '',
  descriptionZh: '',
  descriptionJa: '',
  objectPosition: '',
  sortOrder: 0,
  setAsCover: false,
})

const editSeriesByCategory = computed(() => {
  return categories.value
    .map(cat => ({
      category: cat,
      series: seriesList.value.filter(s => s.categoryId === cat.id),
    }))
    .filter(g => g.series.length > 0)
})

function toggleSeriesInForm(seriesId: string) {
  const idx = editForm.seriesIds.indexOf(seriesId)
  if (idx === -1) {
    editForm.seriesIds.push(seriesId)
    if (!editForm.primarySeriesId) {
      editForm.primarySeriesId = seriesId
    }
  }
  else {
    editForm.seriesIds.splice(idx, 1)
    if (editForm.primarySeriesId === seriesId) {
      editForm.primarySeriesId = editForm.seriesIds[0] ?? ''
    }
  }
}

const replaceFileInput = ref<HTMLInputElement | null>(null)
const replacePending = ref<{ file: File; preview: string; width: number; height: number; thumbHash: string | null } | null>(null)
const replacing = ref(false)

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.addEventListener('load', () => resolve({ width: img.naturalWidth, height: img.naturalHeight }))
    img.addEventListener('error', () => resolve({ width: 0, height: 0 }))
    img.src = URL.createObjectURL(file)
  })
}

function clearReplacePending() {
  if (replacePending.value) {
    URL.revokeObjectURL(replacePending.value.preview)
  }
  replacePending.value = null
}

function openEdit(item: typeof artworks.value[number]) {
  editingId.value = item.id
  editingUrl.value = item.url
  editingMeta.value = {
    width: item.width,
    height: item.height,
    sizeBytes: item.sizeBytes,
    mimeType: item.mimeType,
  }
  editForm.seriesIds = [...item.seriesIds]
  editForm.primarySeriesId = item.primarySeriesId
  editForm.titleEn = item.titleEn
  editForm.titleZh = item.titleZh
  editForm.titleJa = item.titleJa
  editForm.descriptionEn = item.descriptionEn
  editForm.descriptionZh = item.descriptionZh
  editForm.descriptionJa = item.descriptionJa
  editForm.objectPosition = item.objectPosition ?? ''
  const primaryEntry = item.seriesEntries.find(e => e.isPrimary)
  editForm.sortOrder = primaryEntry?.sortOrder ?? 0
  editForm.setAsCover = false
  clearReplacePending()
  editError.value = ''
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editingId.value = null
  clearReplacePending()
}

async function onPickReplaceFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) {
    return
  }
  if (!file.type.startsWith('image/')) {
    editError.value = t('imageOnly')
    return
  }
  const [dims, thumbHash] = await Promise.all([
    readImageDimensions(file),
    createThumbHashFromFile(file),
  ])
  if (dims.width === 0 || dims.height === 0) {
    editError.value = t('imageUnreadable')
    return
  }
  clearReplacePending()
  replacePending.value = {
    file,
    preview: URL.createObjectURL(file),
    width: dims.width,
    height: dims.height,
    thumbHash,
  }
}

async function submitEdit() {
  if (!editingId.value) {
    return
  }
  if (editForm.seriesIds.length === 0) {
    editError.value = t('atLeastOneSeries')
    return
  }
  if (!editForm.seriesIds.includes(editForm.primarySeriesId)) {
    editError.value = t('primaryMustBeSelected')
    return
  }
  submittingEdit.value = true
  editError.value = ''
  try {
    if (replacePending.value) {
      replacing.value = true
      const formData = new FormData()
      formData.append('file', replacePending.value.file, replacePending.value.file.name)
      formData.append('width', String(replacePending.value.width))
      formData.append('height', String(replacePending.value.height))
      formData.append('thumbHash', replacePending.value.thumbHash ?? '')
      await adminApi.fetch(`/api/admin/artworks/${editingId.value}/replace-image`, {
        method: 'POST',
        body: formData,
      })
      replacing.value = false
    }

    await adminApi.fetch(`/api/admin/artworks/${editingId.value}`, {
      method: 'PATCH',
      body: {
        seriesIds: editForm.seriesIds,
        primarySeriesId: editForm.primarySeriesId,
        titleEn: editForm.titleEn,
        titleZh: editForm.titleZh,
        titleJa: editForm.titleJa,
        descriptionEn: editForm.descriptionEn,
        descriptionZh: editForm.descriptionZh,
        descriptionJa: editForm.descriptionJa,
        objectPosition: editForm.objectPosition.trim() === '' ? null : editForm.objectPosition.trim(),
        sortOrder: editForm.sortOrder,
        setAsCover: editForm.setAsCover,
      },
    })

    closeEdit()
    await loadAll()
  }
  catch (error: unknown) {
    editError.value = (error as { statusMessage?: string; message?: string }).statusMessage
      ?? (error as { message?: string }).message
      ?? t('saveFailed')
  }
  finally {
    submittingEdit.value = false
    replacing.value = false
  }
}

</script>

<template>
  <section class="page">
    <header class="page-head">
      <div>
        <h2>{{ t('artworksTitle') }}</h2>
        <p>{{ t('artworksDescription', { count: artworks.length }) }}</p>
      </div>
    </header>

    <div class="toolbar">
      <label class="field">
        <span>{{ t('category') }}</span>
        <select v-model="filterCategory">
          <option value="">
            {{ t('allCategories') }}
          </option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ localizedCategoryLabel(c) }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('series') }}</span>
        <select v-model="filterSeries">
          <option value="">
            {{ t('allSeries') }}
          </option>
          <option
            v-for="s in seriesList.filter(x => !filterCategory || x.categoryId === filterCategory)"
            :key="s.id"
            :value="s.id"
          >
            [{{ categoryLabel(s.categoryId) }}] {{ localizedSeriesName(s) }}
          </option>
        </select>
      </label>
      <button
        v-if="filterCategory || filterSeries"
        type="button"
        class="btn btn-ghost btn-sm toolbar-clear"
        @click="clearFilters"
      >
        <Icon name="lucide:x" />
        <span>{{ t('clearFilters') }}</span>
      </button>
      <span class="toolbar-count">
        <strong>{{ filteredArtworks.length }}</strong>
        <small>{{ t('filtered') }}</small>
      </span>
    </div>

    <div v-if="filteredArtworks.length === 0" class="empty">
      <Icon name="lucide:inbox" />
      <p>{{ t('noArtworks') }}</p>
    </div>

    <div v-else class="artwork-stack">
      <article
        v-for="group in groupedArtworks"
        :key="group.category.id"
        class="artwork-section"
      >
        <header class="artwork-section-head">
          <span class="artwork-section-mark" aria-hidden="true">
            <Icon :name="group.category.icon" />
          </span>
          <div class="artwork-section-title">
            <strong>{{ localizedCategoryLabel(group.category) }}</strong>
            <small>{{ group.category.id }}</small>
          </div>
          <span class="artwork-section-count">
            <strong>{{ group.items.length }}</strong>
            <small>{{ t('artworksUnit') }}</small>
          </span>
        </header>
        <div class="artwork-subsections">
          <section
            v-for="sg in group.seriesGroups"
            :key="sg.series.id"
            class="artwork-subsection"
          >
            <header class="artwork-subsection-head">
              <div class="artwork-subsection-title">
                <strong>{{ localizedSeriesName(sg.series) }}</strong>
                <small>{{ sg.series.slug }}</small>
              </div>
              <span class="artwork-subsection-count">
                <strong>{{ sg.items.length }}</strong>
                <small>{{ sg.items.length > 1 ? t('worksUnit') : t('workUnit') }}</small>
              </span>
            </header>
            <ul class="artworks-grid">
              <li
                v-for="item in sg.items"
                :key="`${sg.series.id}-${item.id}`"
                class="artwork-card"
                :class="{ 'is-shadow': item.primarySeriesId !== sg.series.id }"
              >
                <div class="artwork-thumb">
                  <img :src="item.url" :alt="localizedArtworkTitle(item, localizedSeriesName(item))" loading="lazy">
                  <div class="artwork-overlay">
                    <button type="button" class="overlay-btn" :title="t('commonEdit')" @click="openEdit(item)">
                      <Icon name="lucide:edit-3" />
                    </button>
                    <button type="button" class="overlay-btn is-danger" :title="t('commonDelete')" @click="deleteArtwork(item)">
                      <Icon name="lucide:trash" />
                    </button>
                  </div>
                  <span
                    v-if="item.seriesIds.length > 1"
                    class="artwork-badge artwork-multi"
                    :title="t('multiSeriesTitle', { count: item.seriesIds.length })"
                  >
                    <Icon name="lucide:layers" />
                    <em>{{ item.seriesIds.length }}</em>
                  </span>
                  <span
                    v-if="item.primarySeriesId !== sg.series.id"
                    class="artwork-secondary-flag"
                    :title="t('primarySeriesTitle', { name: localizedSeriesName(item) })"
                  >{{ t('secondary') }}</span>
                </div>
                <div class="artwork-info">
                  <strong>{{ localizedArtworkTitle(item, localizedSeriesName(sg.series)) }}</strong>
                  <span class="artwork-tags">
                    <em class="tag">{{ item.width }}×{{ item.height }}</em>
                    <em class="tag">{{ bytesLabel(item.sizeBytes) }}</em>
                  </span>
                </div>
              </li>
            </ul>
          </section>

          <section v-if="group.orphanItems.length" class="artwork-subsection is-orphan">
            <header class="artwork-subsection-head">
              <div class="artwork-subsection-title">
                <strong>{{ t('orphan') }}</strong>
                <small>{{ t('orphanHint') }}</small>
              </div>
              <span class="artwork-subsection-count">
                <strong>{{ group.orphanItems.length }}</strong>
                <small>{{ group.orphanItems.length > 1 ? t('worksUnit') : t('workUnit') }}</small>
              </span>
            </header>
            <ul class="artworks-grid">
              <li
                v-for="item in group.orphanItems"
                :key="item.id"
                class="artwork-card"
              >
                <div class="artwork-thumb">
                  <img :src="item.url" :alt="localizedArtworkTitle(item, localizedSeriesName(item))" loading="lazy">
                  <div class="artwork-overlay">
                    <button type="button" class="overlay-btn" :title="t('commonEdit')" @click="openEdit(item)">
                      <Icon name="lucide:edit-3" />
                    </button>
                    <button type="button" class="overlay-btn is-danger" :title="t('commonDelete')" @click="deleteArtwork(item)">
                      <Icon name="lucide:trash" />
                    </button>
                  </div>
                </div>
                <div class="artwork-info">
                  <strong>{{ localizedArtworkTitle(item, localizedSeriesName(item)) }}</strong>
                  <small>{{ seriesNameById(item.primarySeriesId) }}</small>
                  <span class="artwork-tags">
                    <em class="tag">{{ item.width }}×{{ item.height }}</em>
                    <em class="tag">{{ bytesLabel(item.sizeBytes) }}</em>
                  </span>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </div>

    <AdminModal v-model="showEdit" :title="t('editArtwork')" size="wide" @close="closeEdit">
      <form class="modal-form" @submit.prevent="submitEdit">
        <div class="edit-grid">
          <div class="edit-image">
            <div class="edit-image-frame">
              <img v-if="replacePending" :src="replacePending.preview" :alt="t('newImagePreview')">
              <img v-else :src="editingUrl" :alt="t('currentImage')">
            </div>
            <div class="edit-image-meta">
              <small v-if="replacePending">
                {{ t('newImage') }} · {{ replacePending.width }}×{{ replacePending.height }} · {{ bytesLabel(replacePending.file.size) }}
              </small>
              <small v-else>
                {{ editingMeta.width }}×{{ editingMeta.height }} · {{ bytesLabel(editingMeta.sizeBytes) }} · {{ editingMeta.mimeType }}
              </small>
            </div>
            <div class="edit-image-actions">
              <input
                ref="replaceFileInput"
                type="file"
                accept="image/*"
                hidden
                @change="onPickReplaceFile"
              >
              <button type="button" class="btn btn-ghost btn-sm" @click="replaceFileInput?.click()">
                <Icon name="lucide:replace" />
                <span>{{ t('chooseNewImage') }}</span>
              </button>
              <button
                v-if="replacePending"
                type="button"
                class="btn btn-ghost btn-sm"
                @click="clearReplacePending"
              >
                <Icon name="lucide:x" />
                <span>{{ t('cancelReplace') }}</span>
              </button>
            </div>
          </div>

          <div class="edit-fields">
            <div class="field">
              <span>{{ t('seriesPickerLabel') }}</span>
              <div class="series-picker">
                <div
                  v-for="group in editSeriesByCategory"
                  :key="group.category.id"
                  class="series-picker-group"
                >
                  <span class="series-picker-cat">{{ localizedCategoryLabel(group.category) }}</span>
                  <div class="series-picker-row">
                    <div
                      v-for="s in group.series"
                      :key="s.id"
                      class="series-chip"
                      role="button"
                      tabindex="0"
                      :class="{
                        'is-on': editForm.seriesIds.includes(s.id),
                        'is-primary': editForm.primarySeriesId === s.id,
                      }"
                      @click="toggleSeriesInForm(s.id)"
                      @keydown.enter.prevent="toggleSeriesInForm(s.id)"
                      @keydown.space.prevent="toggleSeriesInForm(s.id)"
                    >
                      <span class="series-chip-name">{{ localizedSeriesName(s) }}</span>
                      <button
                        v-if="editForm.seriesIds.includes(s.id)"
                        type="button"
                        class="series-chip-star"
                        :class="{ 'is-primary': editForm.primarySeriesId === s.id }"
                        :title="editForm.primarySeriesId === s.id ? t('primarySeries') : t('setPrimary')"
                        @click.stop="editForm.primarySeriesId = s.id"
                      >
                        <Icon :name="editForm.primarySeriesId === s.id ? 'lucide:star' : 'lucide:star-off'" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row-3">
              <label class="field">
                <span>{{ t('titleEn') }}</span>
                <input v-model="editForm.titleEn" type="text">
              </label>
              <label class="field">
                <span>{{ t('titleZh') }}</span>
                <input v-model="editForm.titleZh" type="text">
              </label>
              <label class="field">
                <span>{{ t('titleJa') }}</span>
                <input v-model="editForm.titleJa" type="text">
              </label>
            </div>

            <div class="form-row-3">
              <label class="field">
                <span>{{ t('descriptionEn') }}</span>
                <textarea v-model="editForm.descriptionEn" rows="2" />
              </label>
              <label class="field">
                <span>{{ t('descriptionZh') }}</span>
                <textarea v-model="editForm.descriptionZh" rows="2" />
              </label>
              <label class="field">
                <span>{{ t('descriptionJa') }}</span>
                <textarea v-model="editForm.descriptionJa" rows="2" />
              </label>
            </div>

            <div class="form-row-3">
              <label class="field">
                <span>object-position</span>
                <input v-model="editForm.objectPosition" type="text" placeholder="50% 30%">
              </label>
              <label class="field">
                <span>{{ t('order') }}</span>
                <input v-model.number="editForm.sortOrder" type="number">
              </label>
              <label class="field field-checks">
                <span>{{ t('options') }}</span>
                <span class="check-row">
                  <label class="check">
                    <input v-model="editForm.setAsCover" type="checkbox">
                    <span>{{ t('setAsPrimaryCover') }}</span>
                  </label>
                </span>
              </label>
            </div>
          </div>
        </div>

        <p v-if="editError" class="edit-error">
          {{ editError }}
        </p>

        <footer class="modal-foot">
          <button type="button" class="btn btn-ghost" :disabled="submittingEdit" @click="closeEdit">
            {{ t('commonCancel') }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submittingEdit">
            <Icon :name="replacing ? 'lucide:loader-2' : 'lucide:save'" :class="{ 'icon-spin': replacing }" />
            <span>{{ replacing ? t('uploading') : t('commonSave') }}</span>
          </button>
        </footer>
      </form>
    </AdminModal>
  </section>
</template>

<style scoped>
.toolbar-clear {
  align-self: end;
}

.artwork-stack {
  display: grid;
  gap: 1.6rem;
}

.artwork-section {
  display: grid;
  gap: 0.85rem;
}

.artwork-section-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(22, 24, 31, 0.1);
}

.artwork-section-mark {
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

.artwork-section-title { display: grid; line-height: 1.2; min-width: 0; }
.artwork-section-title strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #1a1d24;
}
.artwork-section-title small {
  font-size: 0.74rem;
  color: #6b7280;
  letter-spacing: 0.04em;
  margin-top: 1px;
}

.artwork-section-count {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
}
.artwork-section-count strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1rem;
  color: #8a1827;
  font-weight: 500;
}
.artwork-section-count small {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

.artwork-subsections {
  display: grid;
  gap: 1.05rem;
}

.artwork-subsection { display: grid; gap: 0.55rem; }

.artwork-subsection-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.15rem 0 0.15rem 0.65rem;
  border-left: 2px solid #8a1827;
}

.artwork-subsection.is-orphan .artwork-subsection-head {
  border-left-color: rgba(22, 24, 31, 0.25);
}

.artwork-subsection-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; min-width: 0; }
.artwork-subsection-title strong {
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #1a1d24;
}
.artwork-subsection-title small {
  font-size: 0.72rem;
  color: #6b7280;
  letter-spacing: 0.02em;
}

.artwork-subsection.is-orphan .artwork-subsection-title strong {
  color: #6b7280;
  font-style: italic;
}

.artwork-subsection-count {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
}
.artwork-subsection-count strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.92rem;
  font-weight: 500;
  color: #8a1827;
}
.artwork-subsection-count small {
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

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
  border: 1px solid rgba(22, 24, 31, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
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

.artwork-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 0.78rem;
  border-radius: 3px;
  background: #8a1827;
  color: #fff;
}

.artwork-info {
  display: grid;
  gap: 0.18rem;
  padding: 0.7rem 0.8rem 0.85rem;
}
.artwork-info strong { font-size: 0.86rem; font-weight: 600; }
.artwork-info small { font-size: 0.72rem; color: #6b7280; }

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
  color: #6b7280;
  border-radius: 3px;
}
.tag.tag-accent {
  background: #8a1827;
  color: #fff;
}

.edit-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.1rem;
  align-items: start;
}
@media (max-width: 760px) {
  .edit-grid { grid-template-columns: 1fr; }
}

.edit-image { display: grid; gap: 0.5rem; }
.edit-image-frame {
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #f0eeec;
  border-radius: 8px;
  overflow: hidden;
  display: grid;
  place-items: center;
}
.edit-image-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.edit-image-meta small {
  display: block;
  font-size: 0.72rem;
  color: #6b7280;
}
.edit-image-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.edit-fields { display: grid; gap: 0.7rem; }

.field-checks .check-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  padding: 0.55rem 0.7rem;
  background: rgba(22, 24, 31, 0.04);
  border-radius: 6px;
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #1a1d24;
  cursor: pointer;
}
.check input { width: 14px; height: 14px; }

.edit-error {
  margin: 0;
  padding: 0.5rem 0.7rem;
  background: rgba(192, 57, 43, 0.08);
  color: #c0392b;
  font-size: 0.78rem;
  border-radius: 6px;
}

.icon-spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.artwork-card.is-shadow { opacity: 0.78; }
.artwork-card.is-shadow:hover { opacity: 1; }
.artwork-card.is-shadow .artwork-thumb img { filter: saturate(0.85); }
.artwork-card.is-shadow:hover .artwork-thumb img { filter: none; }

.artwork-multi {
  position: absolute;
  top: 6px;
  right: 6px;
  left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  width: auto;
  height: auto;
  padding: 2px 8px;
  font-size: 0.72rem;
  background: rgba(15, 16, 20, 0.78);
  color: #fff;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}
.artwork-multi em {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 500;
}
.artwork-multi :deep(svg) { font-size: 0.78rem; }

.artwork-secondary-flag {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  padding: 2px 7px;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(22, 24, 31, 0.62);
  backdrop-filter: blur(4px);
  border-radius: 4px;
}

.series-picker {
  display: grid;
  gap: 0.55rem;
  padding: 0.65rem 0.7rem;
  background: rgba(22, 24, 31, 0.03);
  border: 1px solid rgba(22, 24, 31, 0.08);
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
}
.series-picker-group { display: grid; gap: 0.3rem; }
.series-picker-cat {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 500;
}
.series-picker-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.series-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.55rem;
  font-family: inherit;
  font-size: 0.78rem;
  background: #fff;
  border: 1px solid rgba(22, 24, 31, 0.16);
  color: #1a1d24;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.series-chip:hover { border-color: rgba(22, 24, 31, 0.36); }
.series-chip.is-on {
  background: rgba(22, 24, 31, 0.92);
  color: #fff;
  border-color: rgba(22, 24, 31, 0.92);
}
.series-chip.is-on.is-primary {
  background: #8a1827;
  border-color: #8a1827;
}
.series-chip-star {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  padding: 0;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.series-chip-star:hover { opacity: 1; transform: scale(1.1); }
.series-chip-star.is-primary { opacity: 1; color: #fbbf24; }
.series-chip-star :deep(svg) { font-size: 0.85rem; }
</style>
