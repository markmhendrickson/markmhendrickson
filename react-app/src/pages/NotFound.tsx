import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, FileText } from 'lucide-react'
import { getPostImageSrc } from '@/lib/utils'

const HERO_IMAGE = '404-hero.png'

export default function NotFound() {
  const pageTitle = 'Page not found — Mark Hendrickson'
  const pageDesc = "This path isn't in the graph. Return to the homepage or browse posts."
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
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">404</h1>
          <div className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
            This path isn't in the graph
          </div>

          <div className="text-[15px] leading-[1.75] font-light mb-8">
            <p className="mb-6">
              The page you're looking for doesn't exist or has been moved. You can head back to the homepage or browse recent posts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#e0e0e0] hover:border-[#999] hover:bg-[#fafafa] transition-all text-[15px] font-medium"
              >
                <Home className="w-4 h-4" />
                <span>Go home</span>
              </Link>
              <Link
                to="/posts"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#e0e0e0] hover:border-[#999] hover:bg-[#fafafa] transition-all text-[15px] font-medium"
              >
                <FileText className="w-4 h-4" />
                <span>Browse posts</span>
              </Link>
          </div>
        </div>
      </div>
    </>
  )
}
