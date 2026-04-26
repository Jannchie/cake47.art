import type { Locale } from '~/utils/useLocale'

type LocalizedText = Record<Locale, string>

export type ArtworkCategoryId =
  | 'fan-works'
  | 'original-oc'
  | 'commercial-commission'

export interface ArtworkCategory {
  id: ArtworkCategoryId
  icon: string
  label: LocalizedText
  description: LocalizedText
}

export const artworkCategories: ArtworkCategory[] = [
  {
    id: 'fan-works',
    icon: 'lucide:palette',
    label: {
      'zh-CN': '同人创作',
      en: 'Fan Works',
      ja: 'ファンアート',
    },
    description: {
      'zh-CN': '游戏、动画漫画、虚拟歌手等作品的二次创作。',
      en: 'Fan works inspired by games, anime, manga, virtual singers, and other titles.',
      ja: 'ゲーム、アニメ、漫画、ボカロなどを題材にしたファンアート。',
    },
  },
  {
    id: 'original-oc',
    icon: 'lucide:sparkles',
    label: {
      'zh-CN': '原创角色',
      en: 'Original Characters',
      ja: 'オリジナルキャラクター',
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
