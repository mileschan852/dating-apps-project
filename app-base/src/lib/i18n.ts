// App-specific i18n — extend with your app's translations
import { t as baseT, type Lang } from '@dating/core/i18n'

export type { Lang }

const APP: Record<Lang, Record<string, string>> = {
  en: {
    appTitle: 'My App',
    welcome: 'Welcome!',
  },
  tc: {
    appTitle: '我的應用',
    welcome: '歡迎！',
  },
  sc: {
    appTitle: '我的应用',
    welcome: '欢迎！',
  },
  ru: {
    appTitle: 'Мое Приложение',
    welcome: 'Добро пожаловать!',
  },
}

export function t(lang: Lang, key: string): string {
  return APP[lang]?.[key] || key
}

export function getLangLabel(lang: Lang): string {
  return { en: 'EN', tc: '繁', sc: '简', ru: 'RU' }[lang] || 'EN'
}
