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
    'en': 'Cake47\'s Illustration Studio',
  },
  description: {
    'zh-CN': '欢迎来到私期的画室。',
    'ja': '私期の画室へようこそ。',
    'en': 'Welcome to Cake47\'s Illustration Studio.',
  },
  twitter: {
    'zh-CN': '推特',
    'ja': 'ツイッター',
    'en': 'Twitter',
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
