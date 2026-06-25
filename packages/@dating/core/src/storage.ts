// Unified Storage: Telegram CloudStorage + localStorage fallback

interface TgWebApp {
  version: string
  ready: () => void
  expand: () => void
  setHeaderColor: (color: string) => void
  initData: string
  initDataUnsafe: {
    user?: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; is_premium?: boolean }
    start_param?: string
  }
  CloudStorage: {
    setItem: (key: string, value: string, cb?: (err: string | null, done: boolean) => void) => void
    getItems: (keys: string[], cb: (err: string | null, result: Record<string, string>) => void) => void
  }
  openTelegramLink: (url: string) => void
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void
  openInvoice: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void
  close: () => void
  showPopup: (params: { title?: string; message: string; buttons?: { id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }[] }, cb?: (buttonId: string) => void) => void
  requestLocation?: (callback: (location: { latitude: number; longitude: number } | null) => void) => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
  }
}

export function getTg(): TgWebApp | undefined {
  try { return (window as any).Telegram?.WebApp } catch { return undefined }
}

export function isInTelegram(): boolean {
  try {
    const tg = (window as any).Telegram?.WebApp
    // Be lenient: WebApp object exists = we're in Telegram
    // initData may be empty when opened from bot menu button
    return !!tg && typeof tg.ready === 'function'
  } catch { return false }
}

export function getUserId(): number | null {
  return getTg()?.initDataUnsafe?.user?.id || null
}

export function getTgUser() {
  return getTg()?.initDataUnsafe?.user
}

// ─── Cached Telegram user ID ─────────────────────────────────────────
// Persisted to localStorage so it survives page reloads and works
// when initDataUnsafe is empty (e.g. group opens).
let _cachedUserId: number | null = null

export function setCachedUserId(id: number) {
  _cachedUserId = id
  try { localStorage.setItem('_tg_uid', String(id)) } catch {}
}

export function getCachedUserId(): number | null {
  if (_cachedUserId) return _cachedUserId
  try {
    const saved = localStorage.getItem('_tg_uid')
    if (saved) { const id = parseInt(saved); if (!isNaN(id) && id > 0) { _cachedUserId = id; return id } }
  } catch {}
  return null
}

/** Extract Telegram user from ALL possible sources. */
export function extractTgUser(): { id: number; first_name: string; username?: string; photo_url?: string; is_premium?: boolean } | null {
  const fromUnsafe = getTg()?.initDataUnsafe?.user
  if (fromUnsafe?.id) return fromUnsafe

  const initData = getTg()?.initData
  if (initData && initData.length > 10) {
    try {
      const params = new URLSearchParams(initData)
      const userJson = params.get('user')
      if (userJson) { const user = JSON.parse(decodeURIComponent(userJson)); if (user?.id) return user }
    } catch { /* ignore */ }
  }

  try {
    const hash = window.location.hash
    if (hash && hash.includes('tgWebAppData=')) {
      const dataMatch = hash.match(/tgWebAppData=([^&]+)/)
      if (dataMatch) {
        const decoded = decodeURIComponent(dataMatch[1])
        const params = new URLSearchParams(decoded)
        const userJson = params.get('user')
        if (userJson) { const user = JSON.parse(decodeURIComponent(userJson)); if (user?.id) return user }
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const tgData = urlParams.get('tgWebAppData')
    if (tgData) {
      const decoded = decodeURIComponent(tgData)
      const params = new URLSearchParams(decoded)
      const userJson = params.get('user')
      if (userJson) { const user = JSON.parse(decodeURIComponent(userJson)); if (user?.id) return user }
    }
  } catch { /* ignore */ }

  return null
}

/** Check if Telegram WebApp supports openInvoice (requires v6.1+) */
export function supportsPayments(): boolean {
  const tg = getTg()
  if (!tg) return false
  const v = (tg as any).version || '1.0'
  const major = parseInt(v.split('.')[0], 10)
  return major >= 6 && typeof tg.openInvoice === 'function'
}

function cloudSet(key: string, value: string): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = getTg()
    if (!tg?.CloudStorage) { resolve(false); return }
    tg.CloudStorage.setItem(key, value, (err, done) => resolve(!err && done))
  })
}

function cloudGetAll(keys: string[]): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    const tg = getTg()
    if (!tg?.CloudStorage) { resolve(null); return }
    tg.CloudStorage.getItems(keys, (err, result) => {
      if (err) { console.error('CloudStorage get error:', err); resolve(null); return }
      resolve(result || {})
    })
  })
}

function userKey(key: string, prefix: string): string {
  const uid = getUserId()
  return uid ? `${prefix}_${uid}_${key}` : `${prefix}_${key}`
}

export function lsSet(key: string, value: string, prefix: string) {
  const k = userKey(key, prefix)
  try { localStorage.setItem(k, value) } catch {}
}

export function lsGet(key: string, prefix: string): string | null {
  const k = userKey(key, prefix)
  try { return localStorage.getItem(k) } catch { return null }
}

export function lsGetAll(prefix: string): Record<string, string> {
  const r: Record<string, string> = {}
  const uid = getUserId()
  const pfx = uid ? `${prefix}_${uid}_` : `${prefix}_`
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(pfx)) {
        const shortKey = k.replace(pfx, '')
        r[shortKey] = localStorage.getItem(k) || ''
      }
    })
  } catch {}
  return r
}

export interface StorageConfig {
  prefix: string
}

export function createStorage(config: StorageConfig) {
  const { prefix } = config
  return {
    async set(key: string, value: string): Promise<void> {
      lsSet(key, value, prefix)
      const k = userKey(key, prefix)
      await cloudSet(k, value)
    },
    async get(key: string): Promise<string | null> {
      const k = userKey(key, prefix)
      const cloud = await cloudGetAll([k])
      if (cloud && cloud[k]) return cloud[k]
      return lsGet(key, prefix)
    },
    async getAll(keys?: string[]): Promise<Record<string, string>> {
      const ls = lsGetAll(prefix)
      const result: Record<string, string> = { ...ls }
      if (keys && keys.length > 0) {
        const allKeys = keys.map(k => userKey(k, prefix))
        const cloud = await cloudGetAll(allKeys)
        const uid = getUserId()
        if (cloud && uid) {
          Object.entries(cloud).forEach(([k, v]) => {
            const shortKey = k.replace(`${prefix}_${uid}_`, '')
            result[shortKey] = v
          })
        }
      } else {
        for (const key of Object.keys(ls)) {
          const cloudValue = await this.get(key)
          if (cloudValue !== null) result[key] = cloudValue
        }
      }
      return result
    },
    remove(key: string) {
      const k = userKey(key, prefix)
      try { localStorage.removeItem(k) } catch {}
    },
  }
}

/** @deprecated Use createStorage({ prefix }) instead */
export function makeStorage(prefix: string) {
  return createStorage({ prefix })
}
