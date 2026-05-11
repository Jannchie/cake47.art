import type { Locale } from '~/utils/useLocale'

const i18nData = {
  login: {
    'zh-CN': '登录',
    'ja': 'ログイン',
    'en': 'Login',
  },
  logout: {
    'zh-CN': '登出',
    'ja': 'ログアウト',
    'en': 'Logout',
  },
  title: {
    'zh-CN': '私期的画室',
    'ja': '私期の画室',
    'en': 'snowcake47 Illustration',
  },
  description: {
    'zh-CN': 'snowcake47 / 私期的个人插画作品集，收录同人创作、Vocaloid 同人、原创角色设计、生日贺图与商业委托样稿，三语展示。',
    'ja': 'snowcake47 / 私期のイラストポートフォリオ。同人・ファンアート、Vocaloid 二次創作、オリジナルキャラクター、商業・依頼作品を三言語で掲載。',
    'en': 'Portfolio for snowcake47 / 私期 — anime-style illustrations: fan works, Vocaloid art, original characters, birthday pieces, and commercial commission samples.',
  },
  x: {
    'zh-CN': 'X',
    'ja': 'X',
    'en': 'X',
  },
  weibo: {
    'zh-CN': '微博',
    'ja': 'ウェイボー',
    'en': 'Weibo',
  },
} satisfies Record<string, Record<Locale, string>>

export type I18nKey = keyof typeof i18nData

export function tForLocale(key: I18nKey, locale: Locale) {
  return i18nData[key][locale]
}

export function t(key: I18nKey) {
  return tForLocale(key, useLocale())
}
