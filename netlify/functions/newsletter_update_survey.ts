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

function jsonResponse(body: object, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers })
}

function validateEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
}

async function loadSubscribers(): Promise<{ email: string; survey: Record<string, unknown> }[]> {
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

async function saveSubscribers(
  subscribers: { email: string; survey: Record<string, unknown> }[]
): Promise<void> {
  const store = getStore({ name: STORE_NAME })
  await store.set(BLOB_KEY, JSON.stringify(subscribers, null, 2))
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
  const existing = subscribers.find((s) => s.email === email)

  if (!existing) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, headers)
  }

  existing.survey = { ...existing.survey, ...survey }
  await saveSubscribers(subscribers)

  return jsonResponse(
    {
      success: true,
      message: 'Survey updated',
    },
    200,
    headers
  )
}
