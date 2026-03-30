/** Set before navigating to `/raw/post/*.md` so we can full-reload after back (bfcache breaks React). */
export const RAW_MD_NAV_STORAGE_KEY = 'mh_raw_md_nav'

export function markNavigatingToRawMarkdown(): void {
  try {
    sessionStorage.setItem(RAW_MD_NAV_STORAGE_KEY, '1')
  } catch {
    /* private mode / quota */
  }
}
