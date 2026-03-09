import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, FileText } from 'lucide-react'
import { getPostImageSrc } from '@/lib/utils'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'

const HERO_IMAGE = '404-hero.png'

export default function NotFound() {
  const { locale, t } = useLocale()
  const pageTitle = `${t.notFoundTitle} — Mark Hendrickson`
  const pageDesc = t.notFoundDescription
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
        <div className="max-w-[600px] w-full">
          <div className="w-full aspect-[16/10] rounded-lg mb-8 bg-black flex items-center justify-center overflow-hidden">
            <img
              src={getPostImageSrc(HERO_IMAGE)}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">{t.notFoundTitle}</h1>
          <div className="text-[17px] text-muted-foreground dark:text-foreground/80 mb-12 font-normal tracking-wide">
            {t.notFoundSubtitle}
          </div>

          <div className="text-[15px] leading-[1.75] font-light mb-8">
            <p className="mb-6">
              {t.notFoundDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
              <Link
                to={localizePath('/', locale)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:border-muted-foreground hover:bg-muted transition-all text-[15px] font-medium text-foreground"
              >
                <Home className="w-4 h-4" />
                <span>{t.goHome}</span>
              </Link>
              <Link
                to={localizePath('/posts', locale)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:border-muted-foreground hover:bg-muted transition-all text-[15px] font-medium text-foreground"
              >
                <FileText className="w-4 h-4" />
                <span>{t.browsePosts}</span>
              </Link>
          </div>
        </div>
      </div>
    </>
  )
}
