import { useEffect } from 'react'

// Reloads the page when a new SW has taken control and the app returns to foreground.
// Works around iOS Safari's frozen-tab behavior where visibilitychange fires on resume
// but the new SW assets are already cached — a reload is instant and data-safe.
export function useSwUpdate() {
  useEffect(() => {
    let swUpdated = false

    const onControllerChange = () => {
      swUpdated = true
      // If page is visible right now, reload immediately
      if (document.visibilityState === 'visible') {
        window.location.reload()
      }
    }

    const onVisibilityChange = () => {
      if (swUpdated && document.visibilityState === 'visible') {
        window.location.reload()
      }
    }

    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
}
