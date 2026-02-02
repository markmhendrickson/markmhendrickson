import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, string>) => void
  }
}

export default function Newsletter() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

      const result = await response.json() as { error?: string }

      if (response.ok) {
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'newsletter_subscribe', {
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
    <div className="flex justify-center items-start min-h-content py-20 px-8">
      <div className="max-w-[600px] w-full">
        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Subscribe to Newsletter</h1>
        <p className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
          Get technical deep-dives, Neotoma updates, and workflow templates delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-600">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Subscribing...' : 'Subscribe'}
          </Button>

          <p className="text-sm text-[#666] leading-relaxed">
            <strong>Privacy & Sovereignty:</strong> Your email is stored in a user-owned database. 
            We use this information to tailor content to your interests and identify qualified leads for Neotoma pilots. 
            You can unsubscribe at any time.
          </p>
        </form>
      </div>
    </div>
  )
}
