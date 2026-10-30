import { buttonVariants } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { SupportedLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

/** A product reference for this essay, separate from the exported article content. */
export function NeotomaEssayStrip({ slug, locale }: { slug: string; locale: SupportedLocale }) {
  if (slug !== 'your-agents-need-a-system-of-record') return null
  return (
    <div className="essay-product-strip">
      <span role="img" aria-label="Neotoma" className="shrink-0">
        <img src="/brand/neotoma/n2-nav-light.svg" width="133" height="28" alt="" className="block h-7 w-auto dark:hidden" />
        <img src="/brand/neotoma/n2-nav-dark.svg" width="133" height="28" alt="" className="hidden h-7 w-auto dark:block" />
      </span>
      <a href={`https://neotoma.io/${locale === 'es' ? 'es' : 'en'}/`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'min-h-11' })}>
        {getDictionary(locale).visitNeotoma}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </a>
    </div>
  )
}
