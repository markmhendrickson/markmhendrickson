import { FileCode2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/components/ui/tooltip'
import { markNavigatingToRawMarkdown } from '@/lib/rawMarkdownNav'

interface MarkdownLinkActionProps {
  href: string
  label: string
}

/** Icon link to a post's raw markdown, shown in the top-right of the app header. */
export function MarkdownLinkAction({ href, label }: MarkdownLinkActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          aria-label={label}
          onClick={() => markNavigatingToRawMarkdown()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FileCode2 className="h-4 w-4" aria-hidden />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
