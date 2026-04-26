<script setup lang="ts">
definePageMeta({ layout: false })

const store = useAdminStore()
const { adminApi, seriesList, loadAll, bytesLabel, categoryLabel } = store

interface UploadResult {
  key: string
  url: string
  contentType: string
  size: number
}

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
</script>

<template>
  <section class="page">
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
</template>

<style scoped>
.dropzone {
  display: grid;
  place-items: center;
  gap: 0.4rem;
  padding: 3.4rem 1.4rem;
  background: #fff;
  border: 1px dashed rgba(22, 24, 31, 0.16);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dropzone:hover, .dropzone.is-over {
  border-color: #1a1d24;
  background: rgba(22, 24, 31, 0.02);
}
.dropzone-icon { font-size: 2rem; color: #6b7280; }
.dropzone-title {
  margin: 0;
  font-size: 1rem;
  color: #1a1d24;
  font-weight: 500;
}
.dropzone small { font-size: 0.78rem; color: #6b7280; letter-spacing: 0.04em; }

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
  color: #8a1827;
  font-weight: 500;
  margin-right: 0.2rem;
}
.upload-toolbar-actions { display: inline-flex; gap: 0.4rem; }

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
  border: 1px solid rgba(22, 24, 31, 0.1);
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
  border: 1px solid rgba(22, 24, 31, 0.1);
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

.upload-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.74rem;
  color: #6b7280;
}
.upload-meta-error { color: #c0392b; }

@media (max-width: 760px) {
  .upload-item { grid-template-columns: 1fr; }
  .upload-fields { grid-template-columns: 1fr; }
}
</style>
