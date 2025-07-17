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
    'en': 'snowcake47\'s Illustration',
  },
  description: {
    'zh-CN': '欢迎来到私期的画室。',
    'ja': '私期の画室へようこそ。',
    'en': 'Welcome to snowcake47\'s Illustration.',
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
