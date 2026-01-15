import React from 'react'
import { AlertCircle, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen">
          <div className="flex justify-center items-center min-h-screen py-20 px-8">
            <div className="max-w-[600px] w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-[#dc2626]" />
                <h1 className="text-[28px] font-medium tracking-tight">Something went wrong</h1>
              </div>
              <div className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
                An unexpected error occurred
              </div>

              <div className="text-[15px] leading-[1.75] font-light mb-8">
                <p className="mb-6">We're sorry, but something unexpected happened. Please try refreshing the page or return to the home page.</p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 p-4 bg-[#f5f5f5] rounded-md border border-[#e0e0e0]">
                    <summary className="cursor-pointer text-[13px] font-medium text-[#666] mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-[11px] text-[#333] overflow-auto mt-2">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#e0e0e0] hover:border-[#999] hover:bg-[#fafafa] transition-all text-[15px] font-medium"
                >
                  <span>Refresh Page</span>
                </button>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#e0e0e0] hover:border-[#999] hover:bg-[#fafafa] transition-all text-[15px] font-medium"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Home</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
