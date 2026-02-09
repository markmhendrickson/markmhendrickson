import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve post image src: use URL as-is if absolute, else prepend /images/posts/ */
export function getPostImageSrc(pathOrUrl: string): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  return `/images/posts/${pathOrUrl}`
}

/** Remove markdown links and bare URLs from text (e.g. post excerpts) */
export function stripLinksFromExcerpt(text: string): string {
  if (!text || typeof text !== 'string') return text
  let result = text
  // Replace markdown links [text](url) with just the link text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // Remove bare URLs (http, https, www.)
  result = result.replace(/https?:\/\/[^\s]+/g, '')
  result = result.replace(/www\.[^\s]+/g, '')
  // Clean up multiple spaces and trim
  return result.replace(/\s+/g, ' ').trim()
}
