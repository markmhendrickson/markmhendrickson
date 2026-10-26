import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

/** How long the "Copied" state stays visible after a successful copy. */
const COPIED_RESET_MS = 1500

/** Plain text of a React node tree (react-markdown hands `<code>` children over as strings). */
export function nodeToPlainText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeToPlainText).join('')
  if (React.isValidElement(node)) {
    return nodeToPlainText((node.props as { children?: React.ReactNode }).children)
  }
  return ''
}

/** Drop the trailing newline(s) markdown parsers leave on fenced bodies; keep all other whitespace. */
export function normalizeCodeText(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\n+$/, '')
}

/** Clipboard write with an `execCommand` fallback. Browser-only: call from event handlers, never render. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  let textarea: HTMLTextAreaElement | null = null
  let previouslyFocused: HTMLElement | null = null
  try {
    previouslyFocused = document.activeElement as HTMLElement | null
    textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.setAttribute('aria-hidden', 'true')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea?.remove()
    previouslyFocused?.focus?.()
  }
}

export interface CodeBlockProps {
  /** Raw code text. Trailing newlines are trimmed for both display and copy. */
  code: string
  /** Fence language (e.g. `bash`). Shown as a small muted label top-left; omit for none. */
  language?: string | null
  /** Overrides `language` as the top-left label (e.g. "Agent prompt"). */
  label?: string
  /** Wrap long lines instead of scrolling horizontally (used for prose-like prompt fences). */
  wrap?: boolean
  copyLabel?: string
  copiedLabel?: string
  failureLabel?: string
  /** Called after a successful copy (analytics). */
  onCopy?: () => void
  className?: string
}

/**
 * The single renderer for every code snippet on the site: consistent padding, border and theme
 * tokens, horizontal scroll, optional language label and a copy button in the top-right corner.
 * Render-safe for SSR: no `window` / `navigator` access outside event handlers and effects.
 */
export function CodeBlock({
  code,
  language,
  label,
  wrap = false,
  copyLabel = 'Copy code',
  copiedLabel = 'Copied',
  failureLabel = 'Copy failed. Try again.',
  onCopy,
  className,
}: CodeBlockProps) {
  const text = normalizeCodeText(code)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heading = label ?? (language ? language : '')

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )

  const handleCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(text)
    if (!ok) {
      if (resetTimer.current) clearTimeout(resetTimer.current)
      setCopyState('failed')
      return
    }
    onCopy?.()
    setCopyState('copied')
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopyState('idle'), COPIED_RESET_MS)
  }, [text, onCopy])

  const copied = copyState === 'copied'
  const failed = copyState === 'failed'
  const buttonText = copied ? copiedLabel : copyLabel

  return (
    <div className={cn('code-block not-prose group relative my-5 flex items-start rounded-lg border border-border bg-muted/40', className)}>
      {heading ? (
        <span className="code-block__label pointer-events-none absolute left-5 top-2 select-none text-[0.6875rem] font-medium leading-none tracking-wide text-muted-foreground">
          {heading}
        </span>
      ) : null}
      <pre
        className={cn(
          'code-block__pre m-0 min-w-0 flex-1 rounded-l-lg bg-transparent px-5 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          heading ? 'pb-4 pt-7' : 'py-4',
          wrap ? 'overflow-x-hidden' : 'overflow-x-auto',
        )}
        tabIndex={0}
      >
        <code
          className={cn(
            'code-block__code block bg-transparent p-0 font-mono',
            wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
          )}
        >
          {text}
        </code>
      </pre>
      <div className="shrink-0 p-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={buttonText}
          title={buttonText}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-opacity hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            // Touch devices have no hover: always visible. Hover-capable: reveal on hover / focus.
            '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100',
            copied && '[@media(hover:hover)]:opacity-100 text-foreground',
          )}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </button>
        <span className={failed ? 'block max-w-32 text-xs text-destructive' : 'sr-only'} role="status" aria-live="polite">
          {failed ? failureLabel : copied ? copiedLabel : ''}
        </span>
      </div>
    </div>
  )
}

const LANGUAGE_CLASS = /\blanguage-([^\s]+)/

/**
 * Drop-in `pre` override for react-markdown (`components={{ pre: MarkdownPre }}`): turns every
 * fenced / indented block into a CodeBlock. Inline `code` is untouched.
 */
export function MarkdownPre({
  children,
  copyLabel,
  copiedLabel,
  failureLabel,
}: React.ComponentPropsWithoutRef<'pre'> & { copyLabel?: string; copiedLabel?: string; failureLabel?: string }) {
  const codeEl = React.Children.toArray(children).find(
    (c): c is React.ReactElement<{ className?: string; children?: React.ReactNode }> =>
      React.isValidElement(c) && c.type === 'code',
  )
  const className = codeEl?.props.className ?? ''
  const language = LANGUAGE_CLASS.exec(className)?.[1] ?? null
  const raw = nodeToPlainText(codeEl ? codeEl.props.children : children)
  return <CodeBlock code={raw} language={language} copyLabel={copyLabel} copiedLabel={copiedLabel} failureLabel={failureLabel} />
}

/** Spread into any `<ReactMarkdown components={...}>` so fenced code renders through CodeBlock. */
export const markdownCodeComponents = {
  pre: MarkdownPre,
}

export function markdownCodeComponentsWithLabels(labels: Pick<CodeBlockProps, 'copyLabel' | 'copiedLabel' | 'failureLabel'>) {
  return {
    pre: (props: React.ComponentPropsWithoutRef<'pre'>) => <MarkdownPre {...props} {...labels} />,
  }
}
