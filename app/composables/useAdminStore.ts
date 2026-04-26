export interface CategoryItem {
  id: string
  icon: string
  labelEn: string
  labelZh: string
  labelJa: string
  sortOrder: number
}

export interface SeriesItem {
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

export interface ArtworkItem {
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

export interface HomeSlotData {
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
  position: number
}

export function useAdminStore() {
  const adminApi = useAdminApi()
  const tokenInput = useState<string>('admin-token-input', () => '')
  const tokenError = useState<string>('admin-token-error', () => '')
  const authed = useState<boolean>('admin-authed', () => false)
  const checkingAuth = useState<boolean>('admin-checkauth', () => true)

  const categories = useState<CategoryItem[]>('admin-categories', () => [])
  const seriesList = useState<SeriesItem[]>('admin-series', () => [])
  const artworks = useState<ArtworkItem[]>('admin-artworks', () => [])
  const homeSlotMap = useState<Record<string, HomeSlotData>>('admin-home-slots', () => ({}))
  const homeSelected = useState<HomeSlotData[]>('admin-home-selected', () => [])
  const homeCarousel = useState<HomeSlotData[]>('admin-home-carousel', () => [])
  const loadingData = useState<boolean>('admin-loading', () => false)

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
        adminApi.fetch<{
          slots: Record<string, HomeSlotData>
          selected: HomeSlotData[]
          carousel: HomeSlotData[]
        }>('/api/admin/home/layout'),
      ])
      categories.value = cats.items
      seriesList.value = series.items
      artworks.value = arts.items
      homeSlotMap.value = home.slots
      homeSelected.value = home.selected ?? []
      homeCarousel.value = home.carousel ?? []
    }
    catch (error) {
      console.error('load admin data failed', error)
    }
    finally {
      loadingData.value = false
    }
  }

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

  function categoryLabel(id: string): string {
    return categories.value.find(c => c.id === id)?.labelEn ?? id
  }

  function seriesNameById(id: string): string {
    return seriesList.value.find(s => s.id === id)?.nameEn ?? id
  }

  return {
    adminApi,
    tokenInput,
    tokenError,
    authed,
    checkingAuth,
    categories,
    seriesList,
    artworks,
    homeSlotMap,
    homeSelected,
    homeCarousel,
    loadingData,
    verifyToken,
    login,
    logout,
    loadAll,
    bytesLabel,
    categoryLabel,
    seriesNameById,
  }
}
