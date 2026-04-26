<script setup lang="ts">
definePageMeta({ layout: false })

const store = useAdminStore()
const { adminApi, categories, seriesList, artworks, loadAll, bytesLabel, categoryLabel, seriesNameById } = store

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

async function deleteArtwork(item: typeof artworks.value[number]) {
  if (!confirm(`确认删除作品「${item.titleEn || item.seriesNameEn}」？`)) {
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
  seriesId: '',
  titleEn: '',
  titleZh: '',
  titleJa: '',
  descriptionEn: '',
  descriptionZh: '',
  descriptionJa: '',
  objectPosition: '',
  featured: false,
  sortOrder: 0,
  setAsCover: false,
})

const replaceFileInput = ref<HTMLInputElement | null>(null)
const replacePending = ref<{ file: File; preview: string; width: number; height: number } | null>(null)
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
  editForm.seriesId = item.seriesId
  editForm.titleEn = item.titleEn
  editForm.titleZh = item.titleZh
  editForm.titleJa = item.titleJa
  editForm.descriptionEn = item.descriptionEn
  editForm.descriptionZh = item.descriptionZh
  editForm.descriptionJa = item.descriptionJa
  editForm.objectPosition = item.objectPosition ?? ''
  editForm.featured = item.featured
  editForm.sortOrder = item.sortOrder
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
    editError.value = '只能上传图片'
    return
  }
  const dims = await readImageDimensions(file)
  if (dims.width === 0 || dims.height === 0) {
    editError.value = '无法读取图片尺寸'
    return
  }
  clearReplacePending()
  replacePending.value = {
    file,
    preview: URL.createObjectURL(file),
    width: dims.width,
    height: dims.height,
  }
}

async function submitEdit() {
  if (!editingId.value) {
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
      await adminApi.fetch(`/api/admin/artworks/${editingId.value}/replace-image`, {
        method: 'POST',
        body: formData,
      })
      replacing.value = false
    }

    await adminApi.fetch(`/api/admin/artworks/${editingId.value}`, {
      method: 'PATCH',
      body: {
        seriesId: editForm.seriesId,
        titleEn: editForm.titleEn,
        titleZh: editForm.titleZh,
        titleJa: editForm.titleJa,
        descriptionEn: editForm.descriptionEn,
        descriptionZh: editForm.descriptionZh,
        descriptionJa: editForm.descriptionJa,
        objectPosition: editForm.objectPosition.trim() === '' ? null : editForm.objectPosition.trim(),
        featured: editForm.featured,
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
      ?? '保存失败'
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
        <h2>作品</h2>
        <p>{{ artworks.length }} 件 · 编辑元数据、替换图片或删除。</p>
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
      >
        <div class="artwork-thumb">
          <img :src="item.url" :alt="item.titleEn || item.seriesNameEn" loading="lazy">
          <div class="artwork-overlay">
            <button type="button" class="overlay-btn" title="编辑" @click="openEdit(item)">
              <Icon name="lucide:edit-3" />
            </button>
            <button type="button" class="overlay-btn is-danger" title="删除" @click="deleteArtwork(item)">
              <Icon name="lucide:trash" />
            </button>
          </div>
          <span v-if="item.featured" class="artwork-badge">★</span>
        </div>
        <div class="artwork-info">
          <strong>{{ item.titleEn || item.seriesNameEn }}</strong>
          <small>{{ seriesNameById(item.seriesId) }} · {{ categoryLabel(item.categoryId) }}</small>
          <span class="artwork-tags">
            <em class="tag">{{ item.width }}×{{ item.height }}</em>
            <em class="tag">{{ bytesLabel(item.sizeBytes) }}</em>
          </span>
        </div>
      </li>
    </ul>

    <Transition name="fade">
      <div v-if="showEdit" class="modal-shade" @click.self="closeEdit">
        <div class="modal modal-wide">
          <header class="modal-head">
            <h3>编辑作品</h3>
            <button type="button" class="icon-btn" @click="closeEdit">
              <Icon name="lucide:x" />
            </button>
          </header>
          <form class="modal-form" @submit.prevent="submitEdit">
            <div class="edit-grid">
              <div class="edit-image">
                <div class="edit-image-frame">
                  <img v-if="replacePending" :src="replacePending.preview" alt="新图预览">
                  <img v-else :src="editingUrl" alt="当前图片">
                </div>
                <div class="edit-image-meta">
                  <small v-if="replacePending">
                    新图 · {{ replacePending.width }}×{{ replacePending.height }} · {{ bytesLabel(replacePending.file.size) }}
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
                    <span>选择新图</span>
                  </button>
                  <button
                    v-if="replacePending"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="clearReplacePending"
                  >
                    <Icon name="lucide:x" />
                    <span>取消替换</span>
                  </button>
                </div>
              </div>

              <div class="edit-fields">
                <label class="field">
                  <span>系列</span>
                  <select v-model="editForm.seriesId" required>
                    <option v-for="s in seriesList" :key="s.id" :value="s.id">
                      [{{ categoryLabel(s.categoryId) }}] {{ s.nameEn }}
                    </option>
                  </select>
                </label>

                <div class="form-row-3">
                  <label class="field">
                    <span>Title (EN)</span>
                    <input v-model="editForm.titleEn" type="text">
                  </label>
                  <label class="field">
                    <span>标题 (ZH)</span>
                    <input v-model="editForm.titleZh" type="text">
                  </label>
                  <label class="field">
                    <span>標題 (JA)</span>
                    <input v-model="editForm.titleJa" type="text">
                  </label>
                </div>

                <div class="form-row-3">
                  <label class="field">
                    <span>Description (EN)</span>
                    <textarea v-model="editForm.descriptionEn" rows="2" />
                  </label>
                  <label class="field">
                    <span>描述 (ZH)</span>
                    <textarea v-model="editForm.descriptionZh" rows="2" />
                  </label>
                  <label class="field">
                    <span>説明 (JA)</span>
                    <textarea v-model="editForm.descriptionJa" rows="2" />
                  </label>
                </div>

                <div class="form-row-3">
                  <label class="field">
                    <span>object-position</span>
                    <input v-model="editForm.objectPosition" type="text" placeholder="50% 30%">
                  </label>
                  <label class="field">
                    <span>排序</span>
                    <input v-model.number="editForm.sortOrder" type="number">
                  </label>
                  <label class="field field-checks">
                    <span>选项</span>
                    <span class="check-row">
                      <label class="check">
                        <input v-model="editForm.featured" type="checkbox">
                        <span>Featured</span>
                      </label>
                      <label class="check">
                        <input v-model="editForm.setAsCover" type="checkbox">
                        <span>设为系列封面</span>
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
                取消
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submittingEdit">
                <Icon :name="replacing ? 'lucide:loader-2' : 'lucide:save'" :class="{ 'icon-spin': replacing }" />
                <span>{{ replacing ? '上传中…' : '保存' }}</span>
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
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

.modal-wide { max-width: min(960px, 92vw); }

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
</style>
