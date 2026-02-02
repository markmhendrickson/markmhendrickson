import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
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

interface SurveyData {
  role: string
  ai_usage: string[]
  challenge: string
  crypto: string
  team_size: string
}

export default function NewsletterConfirm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  const [surveyData, setSurveyData] = useState<SurveyData>({
    role: '',
    ai_usage: [],
    challenge: '',
    crypto: '',
    team_size: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!email) {
      navigate('/newsletter')
    }
  }, [email, navigate])

  const handleCheckboxChange = (value: string) => {
    setSurveyData(prev => ({
      ...prev,
      ai_usage: prev.ai_usage.includes(value)
        ? prev.ai_usage.filter(v => v !== value)
        : [...prev.ai_usage, value]
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter/update-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          survey: surveyData
        })
      })

      const result = await response.json() as { error?: string }

      if (response.ok) {
        setSuccess(true)
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'newsletter_survey_completed', {
            'event_category': 'engagement',
            'event_label': 'newsletter_survey'
          })
        }
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex justify-center items-start min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
        <div className="max-w-[600px] w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-[28px] font-medium mb-4 tracking-tight">Thank You!</h1>
          <p className="text-[17px] text-[#666] mb-8">
            Your subscription is confirmed. Check your email for a confirmation message.
          </p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
      <div className="max-w-[600px] w-full">

        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Successfully subscribed! We've sent a confirmation email to <strong>{email}</strong>.
          </AlertDescription>
        </Alert>

        <h2 className="text-[24px] font-medium mb-2 tracking-tight">Optional: Help Us Understand Your Interests</h2>
        <p className="text-[15px] text-[#666] mb-8 leading-relaxed">
          These questions help us tailor content to your needs. All responses are optional and stored privately.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role">What best describes your role?</Label>
            <Input
              id="role"
              type="text"
              placeholder="e.g., Founder, Engineer, Product Manager"
              value={surveyData.role}
              onChange={(e) => setSurveyData(prev => ({ ...prev, role: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>How do you use AI in your work? (Select all that apply)</Label>
            <div className="space-y-2">
              {['Building AI products', 'Using AI tools for productivity', 'Researching AI capabilities', 'Not currently using AI'].map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyData.ai_usage.includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="challenge">What's your biggest challenge with personal data management?</Label>
            <Input
              id="challenge"
              type="text"
              placeholder="e.g., Data fragmentation, Privacy concerns"
              value={surveyData.challenge}
              onChange={(e) => setSurveyData(prev => ({ ...prev, challenge: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crypto">Are you interested in Bitcoin/crypto?</Label>
            <Input
              id="crypto"
              type="text"
              placeholder="e.g., Yes, actively using / Exploring / Not interested"
              value={surveyData.crypto}
              onChange={(e) => setSurveyData(prev => ({ ...prev, crypto: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_size">What's your company/team size?</Label>
            <Input
              id="team_size"
              type="text"
              placeholder="e.g., Solo operator, 2-20 people, 21-200 people"
              value={surveyData.team_size}
              onChange={(e) => setSurveyData(prev => ({ ...prev, team_size: e.target.value }))}
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Responses'}
            </Button>
            <Link to="/">
              <Button type="button" variant="outline">Skip</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
