<script setup lang="ts">
definePageMeta({ layout: false })

const store = useAdminStore()
const { adminApi, categories, seriesList, artworks, loadAll } = store

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
  const fallback = artworks.value.find(a => a.seriesId === item.id)
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
  if (!confirm(`确认删除系列「${item.nameEn}」？相关作品文件也将被移除。`)) {
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
        <h2>系列</h2>
        <p>分类共 {{ categories.length }} 项（固定）。系列归属于分类，请先创建系列再上传作品。</p>
      </div>
      <div class="page-head-meta">
        <span class="head-stat">
          <strong>{{ seriesList.length }}</strong>
          <small>series total</small>
        </span>
        <button type="button" class="btn btn-primary" @click="openSeriesCreate()">
          <Icon name="lucide:plus" />
          <span>新增系列</span>
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
            <strong>{{ cat.labelEn }}</strong>
            <small>{{ cat.labelZh }} · {{ cat.labelJa }}</small>
          </div>
          <span class="series-section-count">
            <strong>{{ seriesByCategory[cat.id]?.length ?? 0 }}</strong>
            <small>series</small>
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="openSeriesCreate(cat.id)"
          >
            <Icon name="lucide:plus" />
            <span>新增</span>
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
                :alt="s.nameEn"
                loading="lazy"
              >
              <span v-else class="series-card-thumb-empty">
                <Icon name="lucide:image-off" />
              </span>
              <span class="series-card-count" :title="`${s.artworkCount} 件作品`">
                <Icon name="lucide:layers" />
                <em>{{ s.artworkCount }}</em>
              </span>
              <div class="series-card-overlay">
                <button
                  type="button"
                  class="overlay-btn"
                  title="编辑"
                  @click="openSeriesEdit(s)"
                >
                  <Icon name="lucide:edit-3" />
                </button>
                <button
                  type="button"
                  class="overlay-btn is-danger"
                  title="删除"
                  @click="deleteSeries(s)"
                >
                  <Icon name="lucide:trash" />
                </button>
              </div>
            </div>
            <div class="series-card-info">
              <strong class="series-card-name">{{ s.nameEn }}</strong>
              <small class="series-card-sub">{{ s.nameZh }} · {{ s.nameJa }}</small>
              <p
                v-if="s.descriptionEn || s.descriptionZh"
                class="series-card-desc"
              >
                {{ s.descriptionEn || s.descriptionZh }}
              </p>
            </div>
          </li>
        </ul>
        <div v-else class="series-section-empty">
          <Icon name="lucide:folder-open" />
          <p>暂无系列</p>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="openSeriesCreate(cat.id)"
          >
            <Icon name="lucide:plus" />
            <span>添加第一个系列</span>
          </button>
        </div>
      </article>
    </div>

    <AdminModal v-model="showSeriesForm" @close="closeSeriesForm">
      <template #title>
        {{ editingSeriesId ? '编辑系列' : '新增系列' }}
      </template>
      <form class="modal-form" @submit.prevent="submitSeries">
        <div class="form-row-2">
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
        </div>
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
        <label class="field field-narrow">
          <span>排序</span>
          <input v-model.number="seriesForm.sortOrder" type="number" min="0">
        </label>
        <footer class="modal-foot">
          <button type="button" class="btn btn-ghost" @click="closeSeriesForm">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submittingSeries">
            <Icon name="lucide:save" />
            <span>{{ editingSeriesId ? '保存' : '创建' }}</span>
          </button>
        </footer>
      </form>
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
.series-section-empty > :global(svg),
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
</style>
