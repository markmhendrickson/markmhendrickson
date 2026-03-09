import postsDefault from '@cache/posts.json'
import postsEn from '@cache/posts.en.json'
import postsEs from '@cache/posts.es.json'
import postsCa from '@cache/posts.ca.json'
import { type SupportedLocale } from '@/i18n/config'

type PostRecord = Record<string, unknown>

export function getLocalizedPublicPosts(locale: SupportedLocale): PostRecord[] {
  if (locale === 'es') return postsEs as PostRecord[]
  if (locale === 'ca') return postsCa as PostRecord[]
  return postsEn as PostRecord[]
}

export function getDefaultPublicPosts(): PostRecord[] {
  return postsDefault as PostRecord[]
}
