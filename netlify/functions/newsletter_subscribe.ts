import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'

const STORE_NAME = 'newsletter-subscribers'
const BLOB_KEY = 'subscribers'

function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed =
    origin &&
    (origin === 'https://markmhendrickson.com' ||
      origin.startsWith('http://localhost:') ||
      origin.endsWith('.netlify.app'))
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://markmhendrickson.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function jsonResponse(body: object, status: number, headers = corsHeaders()) {
  return new Response(JSON.stringify(body), { status, headers })
}

function validateEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
}

async function loadSubscribers(): Promise<Subscriber[]> {
  const store = getStore({ name: STORE_NAME })
  const raw = await store.get(BLOB_KEY)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

async function saveSubscribers(subscribers: Subscriber[]): Promise<void> {
  const store = getStore({ name: STORE_NAME })
  await store.set(BLOB_KEY, JSON.stringify(subscribers, null, 2))
}

interface Subscriber {
  email: string
  survey: Record<string, unknown>
  subscribed_at: string
  updated_at: string
  status: string
}

async function sendConfirmationEmail(email: string): Promise<boolean> {
  const apiKey = process.env.EMAIL_DELIVERY_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@markmhendrickson.com'
  const name = process.env.NEWSLETTER_NAME || 'Mark Hendrickson Newsletter'
  if (!apiKey) return false

  const confirmationUrl = `https://markmhendrickson.com/newsletter/confirm?email=${encodeURIComponent(email)}`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Confirm your subscription to ${name}`,
      html: `
        <h2>Welcome to ${name}</h2>
        <p>Thank you for subscribing! Please confirm your email address by clicking the link below:</p>
        <p><a href="${confirmationUrl}">Confirm Subscription</a></p>
        <p>If you didn't subscribe, you can safely ignore this email.</p>
      `,
    })
    return !error
  } catch {
    return false
  }
}

export default async function handler(req: Request, _context: Context): Promise<Response> {
  const origin = req.headers.get('Origin')
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  let body: { email?: string; survey?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, headers)
  }

  const email = (body.email || '').toString().trim().toLowerCase()
  const survey = body.survey && typeof body.survey === 'object' ? body.survey : {}

  if (!email) {
    return jsonResponse({ error: 'Email address is required' }, 400, headers)
  }
  if (!validateEmail(email)) {
    return jsonResponse({ error: 'Invalid email address format' }, 400, headers)
  }

  const subscribers = await loadSubscribers()
  const now = new Date().toISOString()
  const existing = subscribers.find((s) => s.email === email)

  if (existing) {
    existing.survey = { ...existing.survey, ...survey }
    existing.updated_at = now
  } else {
    subscribers.push({
      email,
      survey,
      subscribed_at: now,
      updated_at: now,
      status: 'subscribed',
    })
  }

  await saveSubscribers(subscribers)
  const emailSent = await sendConfirmationEmail(email)

  return jsonResponse(
    {
      success: true,
      message: 'Successfully subscribed',
      email,
      email_sent: emailSent,
    },
    200,
    headers
  )
}
