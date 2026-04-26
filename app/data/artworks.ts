import type { Locale } from '~/utils/useLocale'

type LocalizedText = Record<Locale, string>

export type ArtworkCategoryId =
  | 'game-fanart'
  | 'anime-fanart'
  | 'original-oc'
  | 'commercial-commission'

export type SeriesId =
  | 'original'
  | 'danganronpa'
  | 'star-rail'
  | 'duet-night-abyss'
  | 'magical-girl-witch-trials'
  | 'onmyoji'
  | 'vocaloid'
  | 'sousou-no-frieren'
  | 'code-geass'
  | 'commission'

export interface ArtworkCategory {
  id: ArtworkCategoryId
  icon: string
  label: LocalizedText
  description: LocalizedText
}

export interface Artwork {
  series: SeriesId
  category: ArtworkCategoryId
  src: string
  featured?: boolean
  /**
   * Optional CSS `object-position` override for cropped (cover) renders such as
   * thumbnails and category cards. Defaults are applied per-component when this
   * is omitted.
   */
  objectPosition?: string
}

export const seriesLabels: Record<SeriesId, LocalizedText> = {
  'original': {
    'zh-CN': '原创',
    en: 'Original',
    ja: 'オリジナル',
  },
  'danganronpa': {
    'zh-CN': '弹丸论破',
    en: 'Danganronpa',
    ja: 'ダンガンロンパ',
  },
  'star-rail': {
    'zh-CN': '崩坏：星穹铁道',
    en: 'Honkai: Star Rail',
    ja: '崩壊：スターレイル',
  },
  'duet-night-abyss': {
    'zh-CN': 'Duet Night Abyss',
    en: 'Duet Night Abyss',
    ja: 'Duet Night Abyss',
  },
  'magical-girl-witch-trials': {
    'zh-CN': '魔法少女审判',
    en: 'Magical Girl Witch Trials',
    ja: '魔法少女ウィッチ・トライアル',
  },
  'onmyoji': {
    'zh-CN': '阴阳师',
    en: 'Onmyoji',
    ja: '陰陽師',
  },
  'vocaloid': {
    'zh-CN': 'VOCALOID',
    en: 'VOCALOID',
    ja: 'VOCALOID',
  },
  'sousou-no-frieren': {
    'zh-CN': '葬送的芙莉莲',
    en: 'Frieren: Beyond Journey\'s End',
    ja: '葬送のフリーレン',
  },
  'code-geass': {
    'zh-CN': '反叛的鲁路修',
    en: 'Code Geass',
    ja: 'コードギアス',
  },
  'commission': {
    'zh-CN': '委托',
    en: 'Commission',
    ja: '依頼',
  },
}

export const artworkCategories: ArtworkCategory[] = [
  {
    id: 'game-fanart',
    icon: 'lucide:gamepad-2',
    label: {
      'zh-CN': '游戏同人',
      en: 'Game Fanart',
      ja: 'ゲーム同人',
    },
    description: {
      'zh-CN': '游戏角色的同人插画与角色诠释。',
      en: 'Fan illustrations and character studies for game titles.',
      ja: 'ゲーム作品のファンアートとキャラクター表現。',
    },
  },
  {
    id: 'anime-fanart',
    icon: 'lucide:film',
    label: {
      'zh-CN': '动漫同人',
      en: 'Anime Fanart',
      ja: 'アニメ同人',
    },
    description: {
      'zh-CN': '动画、漫画与虚拟歌手相关作品。',
      en: 'Works inspired by anime, manga, and virtual singers.',
      ja: 'アニメ、漫画、バーチャルシンガー関連の作品。',
    },
  },
  {
    id: 'original-oc',
    icon: 'lucide:sparkles',
    label: {
      'zh-CN': '原创 OC 角色',
      en: 'Original OC',
      ja: 'オリジナル OC',
    },
    description: {
      'zh-CN': '原创角色、生日图与个人创作。',
      en: 'Original characters, birthday pieces, and personal works.',
      ja: 'オリジナルキャラクター、誕生日絵、個人制作。',
    },
  },
  {
    id: 'commercial-commission',
    icon: 'lucide:briefcase-business',
    label: {
      'zh-CN': '商单或委托',
      en: 'Commercial / Commission',
      ja: '商業・依頼',
    },
    description: {
      'zh-CN': '商稿、委托与可公开展示的样例。',
      en: 'Commercial work, commissions, and public samples.',
      ja: '商業案件、依頼作品、公開可能なサンプル。',
    },
  },
]

export const artworks: Artwork[] = [
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-1.png', featured: true },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-2.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-3.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/Ekac/Ekac-4.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/butterfly-portrait.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/white-hair-snake.jpg' },
  { series: 'original', category: 'original-oc', src: '/images/snowcake47/original-oc/snow-portrait.jpg', featured: true },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/chiaki-nanami.jpg' },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/tsumugi-shirogane.jpg' },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/sayaka-maizono.jpg' },
  { series: 'danganronpa', category: 'game-fanart', src: '/images/snowcake47/game-fanart/danganronpa/kaede-akamatsu.jpg' },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/evernight.jpg', featured: true },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/march-7th.jpg' },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/Firefly.png', featured: true },
  { series: 'star-rail', category: 'game-fanart', src: '/images/snowcake47/game-fanart/honkai-star-rail/Hysilens.png' },
  { series: 'duet-night-abyss', category: 'game-fanart', src: '/images/snowcake47/game-fanart/duet-night-abyss/rebecca.jpg', featured: true },
  { series: 'magical-girl-witch-trials', category: 'game-fanart', src: '/images/snowcake47/game-fanart/magical-girl-witch-trials/black-red-portrait.jpg' },
  { series: 'onmyoji', category: 'game-fanart', src: '/images/snowcake47/game-fanart/onmyoji/HEVm68RbYAUmYxD.jpg', featured: true },
  { series: 'vocaloid', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/vocaloid/hatsune-miku.jpg' },
  { series: 'vocaloid', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/vocaloid/racing-miku.jpg', featured: true },
  { series: 'sousou-no-frieren', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/sousou-no-frieren/flamme.jpg' },
  { series: 'sousou-no-frieren', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/sousou-no-frieren/red-dress-portrait.jpg', featured: true },
  { series: 'code-geass', category: 'anime-fanart', src: '/images/snowcake47/anime-fanart/code-geass/euphemia-good-night.jpg', featured: true },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-accent-portrait.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-white-mage.jpg', featured: true },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/wisteria-twins.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/wedding-blue.jpg', featured: true },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-black-dress.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/red-crown-portrait.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/lemonne-birthday.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-hair-scythe.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/purple-spear.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/violet-duo.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/red-violinist.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/white-violinist.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/blue-birthday-portrait.jpg' },
  { series: 'commission', category: 'commercial-commission', src: '/images/snowcake47/commercial-commission/january-blue-commission.jpg' },
]
