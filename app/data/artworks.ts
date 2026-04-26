import type { Locale } from '~/utils/useLocale'

type LocalizedText = Record<Locale, string>

export type ArtworkCategoryId =
  | 'game-fanart'
  | 'anime-fanart'
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
