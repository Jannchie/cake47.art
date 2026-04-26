<script setup lang="ts">
definePageMeta({ layout: false })

const store = useAdminStore()
const {
  authed,
  checkingAuth,
  tokenInput,
  tokenError,
  verifyToken,
  login,
  logout,
  loadAll,
  loadingData,
} = store

const tabs = [
  { id: 'upload', label: 'Upload', sub: '上传', to: '/admin/upload' },
  { id: 'artworks', label: 'Artworks', sub: '作品', to: '/admin/artworks' },
  { id: 'series', label: 'Series', sub: '系列', to: '/admin/series' },
  { id: 'home', label: 'Home', sub: '首页', to: '/admin/home' },
] as const

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
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.id"
              :to="tab.to"
              class="topbar-tab"
              active-class="is-active"
            >
              {{ tab.label }}
            </NuxtLink>
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
          <NuxtPage />
        </div>
      </section>
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
  border: 1px solid var(--admin-line);
  border-radius: 8px;
  display: grid;
  gap: 1.25rem;
}

.login-head { display: grid; gap: 0.4rem; }

.login-brand {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--admin-muted);
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
  color: var(--admin-muted);
  line-height: 1.5;
}

.login-form { display: grid; gap: 0.75rem; }

.login-hint {
  font-size: 0.78rem;
  color: var(--admin-muted);
  text-align: center;
}

.login-hint code {
  font-family: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  background: rgba(22, 24, 31, 0.05);
  border: 1px solid var(--admin-line);
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
  border-bottom: 1px solid var(--admin-line);
}

.topbar-brand { display: flex; align-items: center; gap: 0.6rem; }

.topbar-mark {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--admin-line);
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
  color: var(--admin-muted);
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
  color: var(--admin-muted);
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

.topbar-actions { display: inline-flex; align-items: center; gap: 0.4rem; }

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
  border: 1px solid var(--admin-line);
  border-radius: 6px;
  font-size: 0.82rem;
  color: var(--admin-muted);
  box-shadow: 0 8px 18px rgba(15, 16, 20, 0.08);
}

.spin { animation: spin 1.4s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style>
/* Shared admin utility styles, scoped to .admin via descendant selector
   so they leak only inside the admin tree but reach NuxtPage children. */
.admin {
  --admin-line: rgba(22, 24, 31, 0.1);
  --admin-line-strong: rgba(22, 24, 31, 0.16);
  --admin-muted: #6b7280;
  --admin-accent: #8a1827;
}

.admin .page { display: grid; gap: 1.2rem; }

.admin .page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 0.6rem;
}

.admin .page-head h2 {
  margin: 0 0 0.2rem;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #1a1d24;
}

.admin .page-head p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--admin-muted);
  line-height: 1.5;
}

.admin .btn {
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
.admin .btn-sm { padding: 0.4rem 0.7rem; font-size: 0.8rem; }
.admin .btn-block { width: 100%; }
.admin .btn-primary {
  background: #1a1d24;
  color: #fff;
  border-color: #1a1d24;
}
.admin .btn-primary:hover:not(:disabled) { background: #2a2e36; border-color: #2a2e36; }
.admin .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.admin .btn-ghost {
  background: #fff;
  color: #1a1d24;
  border-color: var(--admin-line-strong);
}
.admin .btn-ghost:hover { background: rgba(22, 24, 31, 0.04); border-color: rgba(22, 24, 31, 0.24); }

.admin .icon-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--admin-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}
.admin .icon-btn:hover {
  background: rgba(22, 24, 31, 0.06);
  color: #1a1d24;
}
.admin .icon-btn.is-danger:hover {
  background: rgba(192, 57, 43, 0.1);
  color: #c0392b;
}

.admin .field { display: grid; gap: 0.3rem; min-width: 0; }
.admin .field > span {
  font-size: 0.74rem;
  color: var(--admin-muted);
  font-weight: 500;
}
.admin .field input,
.admin .field select,
.admin .field textarea {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  background: #fff;
  border: 1px solid var(--admin-line-strong);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #1a1d24;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.admin .field input:focus,
.admin .field select:focus,
.admin .field textarea:focus {
  border-color: #1a1d24;
  box-shadow: 0 0 0 3px rgba(22, 24, 31, 0.06);
}
.admin .field textarea {
  resize: vertical;
  min-height: 56px;
  line-height: 1.5;
}

.admin .check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.84rem;
  cursor: pointer;
  color: #1a1d24;
}

.admin .toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  background: #fff;
  border: 1px solid var(--admin-line);
  border-radius: 8px;
}
.admin .toolbar .field { min-width: 180px; }

.admin .toolbar-count {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  align-self: center;
}
.admin .toolbar-count strong {
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 1.1rem;
  color: var(--admin-accent);
  font-weight: 500;
}
.admin .toolbar-count small {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--admin-muted);
}

.admin .empty {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  padding: 4rem 1rem;
  background: #fff;
  border: 1px dashed var(--admin-line-strong);
  border-radius: 8px;
  color: var(--admin-muted);
  font-size: 0.9rem;
}
.admin .empty svg { font-size: 2rem; opacity: 0.55; }
.admin .empty p { margin: 0; }

.admin .modal-shade {
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
.admin .modal {
  width: min(640px, 100%);
  background: #fff;
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  padding: 1.2rem 1.4rem 1.4rem;
  display: grid;
  gap: 0.95rem;
  box-shadow: 0 20px 50px rgba(15, 16, 20, 0.18);
}
.admin .modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid var(--admin-line);
}
.admin .modal-head h3 {
  margin: 0;
  font-family: 'Shippori Mincho', 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.admin .modal-form { display: grid; gap: 0.75rem; }
.admin .form-row-3 {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: 1fr 1fr 1fr;
}
@media (max-width: 720px) {
  .admin .form-row-3 { grid-template-columns: 1fr; }
}
.admin .modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  padding-top: 0.4rem;
  border-top: 1px solid var(--admin-line);
}
</style>
