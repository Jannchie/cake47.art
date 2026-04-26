export interface HomeSlotDef {
  key: string
  group: 'hero' | 'category' | 'ekac'
  label: string
}

export const HOME_SLOTS: HomeSlotDef[] = [
  { key: 'hero', group: 'hero', label: 'Hero / 主推作品' },
  { key: 'category.fan-works', group: 'category', label: 'Category · Fan Works' },
  { key: 'category.original-oc', group: 'category', label: 'Category · Original Characters' },
  { key: 'category.commercial-commission', group: 'category', label: 'Category · Commercial' },
  { key: 'ekac.0', group: 'ekac', label: 'Ekac · Hero' },
  { key: 'ekac.1', group: 'ekac', label: 'Ekac · Thumb 1' },
  { key: 'ekac.2', group: 'ekac', label: 'Ekac · Thumb 2' },
  { key: 'ekac.3', group: 'ekac', label: 'Ekac · Thumb 3' },
]

export const HOME_SLOT_KEYS = new Set(HOME_SLOTS.map(s => s.key))
export const SELECTED_PREFIX = 'selected.'
export const CAROUSEL_PREFIX = 'carousel.'
