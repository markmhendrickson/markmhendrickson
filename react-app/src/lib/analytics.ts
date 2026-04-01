import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Umami tracker (script injected by Vite when env vars are set). */
export interface UmamiTracker {
  track(
    eventNameOrPayload:
      | string
      | Record<string, unknown>
      | ((props: Record<string, unknown>) => Record<string, unknown>),
    data?: Record<string, unknown>
  ): void
}

declare global {
  interface Window {
    umami?: UmamiTracker
  }
}

const MAX_UMAMI_WAIT_MS = 4000
const POLL_MS = 50

/** Fire a custom event (e.g. newsletter signup). No-op if Umami is not loaded. */
export function trackUmamiEvent(eventName: string, data?: Record<string, unknown>): void {
  const u = window.umami
  if (!u?.track) return
  if (data && Object.keys(data).length > 0) u.track(eventName, data)
  else u.track(eventName)
}

/**
 * SPA pageviews: script uses data-auto-track="false", so we send one view per route.
 * Only runs in the browser; no-op when the tracker script has not loaded yet.
 */
export function UmamiRouteTracker() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const started = Date.now()

    const tryTrack = () => {
      if (cancelled) return
      const u = window.umami
      if (!u?.track) {
        if (Date.now() - started < MAX_UMAMI_WAIT_MS) {
          window.setTimeout(tryTrack, POLL_MS)
        }
        return
      }
      u.track((props: Record<string, unknown>) => ({
        ...props,
        url: window.location.pathname + window.location.search,
        title: typeof document !== 'undefined' ? document.title : '',
      }))
    }

    tryTrack()
    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search])

  return null
}
