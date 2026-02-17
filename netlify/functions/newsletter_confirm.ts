import type { Context } from '@netlify/functions'
import { loadSubscribers, saveSubscribers } from './newsletter_storage'

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

function jsonResponse(body: object, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers })
}

function validateEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
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

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, headers)
  }

  const email = (body.email || '').toString().trim().toLowerCase()

  if (!email) {
    return jsonResponse({ error: 'Email address is required' }, 400, headers)
  }
  if (!validateEmail(email)) {
    return jsonResponse({ error: 'Invalid email address format' }, 400, headers)
  }

  const subscribers = await loadSubscribers()
  const existing = subscribers.find((s) => s.email === email)

  if (!existing) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, headers)
  }

  const now = new Date().toISOString()
  existing.confirmed_at = existing.confirmed_at || now
  existing.updated_at = now
  await saveSubscribers(subscribers)

  return jsonResponse(
    {
      success: true,
      message: 'Confirmation recorded',
    },
    200,
    headers
  )
}
