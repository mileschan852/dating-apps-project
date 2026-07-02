import { useState, useEffect } from 'react'

/**
 * Reads the user's Telegram profile photo URL.
 * Re-renders when the photo becomes available (Telegram loads initDataUnsafe async).
 * Returns empty string if no photo or not in Telegram.
 */
export function useTelegramPhoto(): string {
  const [photo, setPhoto] = useState('')

  useEffect(() => {
    const read = () => {
      const url = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || ''
      if (url && url.startsWith('http')) {
        setPhoto(url)
        return true
      }
      return false
    }

    // Try immediately
    if (read()) return

    // Retry every 100ms for up to 3 seconds (Telegram loads async)
    let attempts = 0
    const timer = setInterval(() => {
      attempts++
      if (read() || attempts > 30) clearInterval(timer)
    }, 100)

    return () => clearInterval(timer)
  }, [])

  return photo
}
