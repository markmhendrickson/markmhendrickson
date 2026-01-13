import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function NewsletterConfirm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email')
  
  const [role, setRole] = useState('')
  const [aiUsage, setAiUsage] = useState([])
  const [challenge, setChallenge] = useState('')
  const [crypto, setCrypto] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) {
      navigate('/newsletter')
    }
  }, [email, navigate])

  const handleAiUsageChange = (value, checked) => {
    if (checked) {
      setAiUsage([...aiUsage, value])
    } else {
      setAiUsage(aiUsage.filter(v => v !== value))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const surveyData = {
      role: role || null,
      ai_usage: aiUsage,
      challenge: challenge || null,
      crypto: crypto || null,
      team_size: teamSize || null
    }

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

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'newsletter_survey_completed', {
            'event_category': 'engagement',
            'event_label': 'survey_completed'
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

  const handleSkip = () => {
    setSuccess(true)
  }

  if (!email) {
    return null
  }

  return (
    <div className="flex justify-center items-center min-h-screen py-20 px-8">
      <div className="max-w-[600px] w-full">
        <Link to="/" className="text-[13px] text-black no-underline border-b border-black pb-[1px] font-[450] mb-8 inline-flex items-center gap-1 hover:border-transparent">
          <ArrowLeft className="h-3 w-3" />
          Back home
        </Link>
        
        <Alert className="mb-8 border-[#4caf50] bg-[#e8f5e9]">
          <CheckCircle2 className="h-4 w-4 text-[#2e7d32]" />
          <AlertDescription className="text-[#2e7d32]">
            <strong>Email confirmed!</strong> We've sent a confirmation email to <strong>{email}</strong>
          </AlertDescription>
        </Alert>

        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Help Us Understand Your Interests</h1>
        <p className="text-[17px] text-[#666] mb-12 font-light tracking-wide">
          These questions help us tailor content to your needs. All responses are optional and stored privately.
        </p>

        {success ? (
          <Alert className="border-[#4caf50] bg-[#e8f5e9]">
            <CheckCircle2 className="h-4 w-4 text-[#2e7d32]" />
            <AlertDescription className="text-[#2e7d32]">
              Thank you! Your responses have been saved.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-[#e0e0e0]">
              <CardContent className="pt-6 space-y-6">
                {/* Role */}
                <div>
                  <Label htmlFor="role" className="text-[15px] font-medium mb-2 block">
                    What best describes your role?
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select an option (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai-native-operator">AI-Native Individual Operator (heavy ChatGPT/Claude/Cursor user)</SelectItem>
                      <SelectItem value="knowledge-worker">High-Context Knowledge Worker (analyst, researcher, consultant, lawyer)</SelectItem>
                      <SelectItem value="founder">Founder or Small Team Lead (2-20 people)</SelectItem>
                      <SelectItem value="developer">Developer or Technical Integrator</SelectItem>
                      <SelectItem value="product-ops">Product/Operations Team Member</SelectItem>
                      <SelectItem value="solopreneur">Cross-Border Solopreneur</SelectItem>
                      <SelectItem value="crypto-power-user">Crypto-Native Power User (staking, LPs, vaults)</SelectItem>
                      <SelectItem value="other">Other / Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* AI Usage */}
                <div>
                  <Label className="text-[15px] font-medium mb-2 block">
                    How do you primarily use AI tools? (Select all that apply)
                  </Label>
                  <div className="space-y-3">
                    {[
                      { id: 'ai-chatgpt', value: 'chatgpt-claude', label: 'ChatGPT/Claude for daily work' },
                      { id: 'ai-cursor', value: 'cursor-raycast', label: 'Cursor/Raycast for development' },
                      { id: 'ai-agents', value: 'agents', label: 'AI agents for automation' },
                      { id: 'ai-research', value: 'research', label: 'Research and analysis' },
                      { id: 'ai-content', value: 'content', label: 'Content creation' },
                      { id: 'ai-not-heavy', value: 'not-heavy', label: 'Not a heavy AI user' }
                    ].map((option) => (
                      <div key={option.id} className="flex items-start gap-3">
                        <Checkbox
                          id={option.id}
                          checked={aiUsage.includes(option.value)}
                          onCheckedChange={(checked) => handleAiUsageChange(option.value, checked)}
                        />
                        <Label
                          htmlFor={option.id}
                          className="text-[15px] font-normal cursor-pointer leading-relaxed"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenge */}
                <div>
                  <Label htmlFor="challenge" className="text-[15px] font-medium mb-2 block">
                    What's your biggest challenge with AI tools?
                  </Label>
                  <Select value={challenge} onValueChange={setChallenge}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select an option (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fragmented-memory">Fragmented memory across tools</SelectItem>
                      <SelectItem value="no-provenance">No provenance/verification of AI answers</SelectItem>
                      <SelectItem value="platform-lockin">Platform lock-in (can't export data)</SelectItem>
                      <SelectItem value="context-loss">Context loss between sessions</SelectItem>
                      <SelectItem value="privacy-concerns">Privacy concerns with provider-controlled data</SelectItem>
                      <SelectItem value="other">Other / Not applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Crypto */}
                <div>
                  <Label htmlFor="crypto" className="text-[15px] font-medium mb-2 block">
                    Are you involved in crypto/blockchain?
                  </Label>
                  <Select value={crypto} onValueChange={setCrypto}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select an option (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actively">Yes, actively (trading, staking, DeFi)</SelectItem>
                      <SelectItem value="occasionally">Yes, occasionally</SelectItem>
                      <SelectItem value="interested">No, but interested</SelectItem>
                      <SelectItem value="not-relevant">No, not relevant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Size */}
                <div>
                  <Label htmlFor="team_size" className="text-[15px] font-medium mb-2 block">
                    What's your company/team size?
                  </Label>
                  <Select value={teamSize} onValueChange={setTeamSize}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select an option (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo operator</SelectItem>
                      <SelectItem value="2-20">2-20 people</SelectItem>
                      <SelectItem value="21-200">21-200 people</SelectItem>
                      <SelectItem value="200+">200+ people</SelectItem>
                      <SelectItem value="na">Not applicable / Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-black text-white hover:bg-[#333] text-[15px]"
              >
                {loading ? 'Saving...' : 'Save Responses'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="text-[15px]"
              >
                Skip
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <p className="text-[13px] text-[#666] mt-8 leading-relaxed">
              <strong>Privacy & Sovereignty:</strong> Your survey responses are stored in a user-owned database. 
              We use this information to tailor content to your interests and identify qualified leads for Neotoma pilots.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
