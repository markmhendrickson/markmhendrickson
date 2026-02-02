import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
