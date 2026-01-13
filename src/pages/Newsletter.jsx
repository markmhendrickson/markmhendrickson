import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function Newsletter() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      })

      const result = await response.json()

      if (response.ok) {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'newsletter_subscribe', {
            'event_category': 'engagement',
            'event_label': 'newsletter_signup'
          })
        }
        // Redirect to confirmation page with email
        navigate(`/newsletter/confirm?email=${encodeURIComponent(email)}`)
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen py-20 px-8">
      <div className="max-w-[600px] w-full">
        <Link to="/" className="text-[13px] text-black no-underline border-b border-black pb-[1px] font-[450] mb-8 inline-flex items-center gap-1 hover:border-transparent">
          <ArrowLeft className="h-3 w-3" />
          Back home
        </Link>
        
        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Subscribe to updates</h1>
        <p className="text-[17px] text-[#666] mb-12 font-light tracking-wide">
          Get profesional updates from me in your email inbox
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-[15px] font-medium mb-2 block">
              Email Address <span className="text-red-600">*</span>
            </Label>
            <Input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="text-[15px]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-[#333] text-[15px]"
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-[13px] text-[#666] mt-8 leading-relaxed">
            Your email will never be shared with third parties. You can unsubscribe at any time.
          </p>
        </form>
      </div>
    </div>
  )
}
