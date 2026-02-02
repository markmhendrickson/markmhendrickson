import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex justify-center items-center min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
      <div className="max-w-[600px] w-full">
        <h1 className="text-[28px] font-medium mb-2 tracking-tight">404</h1>
        <div className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
          Page not found
        </div>

        <div className="text-[15px] leading-[1.75] font-light mb-8">
          <p className="mb-6">The page you're looking for doesn't exist or has been moved.</p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#e0e0e0] hover:border-[#999] hover:bg-[#fafafa] transition-all text-[15px] font-medium"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  )
}
