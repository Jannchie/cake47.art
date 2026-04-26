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
    'zh-CN': 'snowcake47 / 私期的个人作品集，收录游戏同人、动漫同人、原创 OC 与商单委托作品。',
    'ja': 'snowcake47 / 私期のポートフォリオ。ゲーム同人、アニメ同人、オリジナル OC、商業・依頼作品を掲載。',
    'en': 'Portfolio for snowcake47, featuring game fanart, anime fanart, original characters, and commission samples.',
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
}

export function t(key: keyof typeof i18nData) {
  const locale = useLocale()
  return i18nData[key][locale]
}
