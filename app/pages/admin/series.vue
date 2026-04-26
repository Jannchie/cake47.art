<script setup lang="ts">
definePageMeta({ layout: false })

const store = useAdminStore()
const { adminApi, categories, seriesList, loadAll } = store

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
  </section>
</template>

<style scoped>
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
  border: 1px solid rgba(22, 24, 31, 0.1);
  border-radius: 8px;
}

.series-card-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(22, 24, 31, 0.1);
}

.series-card-icon { font-size: 1rem; color: #6b7280; }

.series-card-head strong {
  display: block;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.96rem;
  letter-spacing: 0.02em;
}

.series-card-head small {
  font-size: 0.72rem;
  color: #6b7280;
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
.series-list-info strong { font-size: 0.86rem; font-weight: 600; }
.series-list-info small { font-size: 0.72rem; color: #6b7280; }

.series-list-count {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.84rem;
  color: #8a1827;
}

.series-list-actions { display: inline-flex; gap: 0.2rem; }

.series-list-empty {
  display: block;
  padding: 0.5rem 0.6rem;
  background: transparent;
  font-size: 0.78rem;
  color: #6b7280;
  font-style: italic;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
