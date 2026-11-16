import { buttonVariants } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { SupportedLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import constaraWordmark from '@/assets/constara/wordmark.png'
import constaraWordmarkDark from '@/assets/constara/wordmark-dark.png'

const essayProducts = {
  'your-agents-need-a-system-of-record': {
    name: 'Neotoma',
    lightWordmark: '/brand/neotoma/n2-nav-light.svg',
    darkWordmark: '/brand/neotoma/n2-nav-dark.svg',
    width: 133,
    height: 28,
  },
  'launching-constara': {
    name: 'Constara',
    lightWordmark: constaraWordmark,
    darkWordmark: constaraWordmarkDark,
    width: 779,
    height: 176,
  },
}

/** A product reference for an essay, separate from the exported article content. */
export function EssayProductStrip({ slug, locale }: { slug: string; locale: SupportedLocale }) {
  if (slug !== 'your-agents-need-a-system-of-record' && slug !== 'launching-constara') return null

  const product = essayProducts[slug]
  const url = slug === 'launching-constara'
    ? 'https://constara.ai/'
    : `https://neotoma.io/${locale === 'es' ? 'es' : 'en'}/`
  const linkLabel = getDictionary(locale).visitNeotoma.replace('Neotoma', product.name)

  return (
    <div className="essay-product-strip">
      <span role="img" aria-label={product.name} className="shrink-0">
        <img src={product.lightWordmark} width={product.width} height={product.height} alt="" className="block h-7 w-auto dark:hidden" />
        <img src={product.darkWordmark} width={product.width} height={product.height} alt="" className="hidden h-7 w-auto dark:block" />
      </span>
      <a href={url} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'min-h-11' })}>
        {linkLabel}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </a>
    </div>
  )
}
