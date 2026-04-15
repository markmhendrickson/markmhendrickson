/** Minimal typing for Umami tracker injected via script (see NETLIFY_SETUP.md). */
type UmamiApi = {
  track?: (eventName: string, eventData?: Record<string, unknown>) => void | Promise<unknown>
}

declare global {
  interface Window {
    umami?: UmamiApi
  }
}

/**
 * Fire a custom Umami event when the tracker is present (production / dev with env).
 * No-ops if `window.umami` is missing so local builds stay quiet.
 */
export function trackUmamiEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean | null | undefined>,
): void {
  try {
    const umami = window.umami
    const track = umami?.track
    if (typeof track !== 'function') return
    const out = track.call(umami, eventName, eventData)
    if (out != null && typeof (out as Promise<unknown>).catch === 'function') {
      void (out as Promise<unknown>).catch(() => {})
    }
  } catch {
    // ignore
  }
}
