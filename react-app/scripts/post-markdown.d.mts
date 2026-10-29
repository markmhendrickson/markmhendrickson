export function composePostMarkdown(post: Record<string, unknown>, options?: { body?: unknown; summary?: unknown; postscript?: unknown; takeawaysLabel?: string }): string
export function createPostMarkdownRepository(root: string, options?: { defaultLocale?: string }): {
  resolve(slug: string, locale?: string, options?: { allowDrafts?: boolean }): string | null
  publishedOutputs(): Array<{ outputPath: string; body: string }>
}
