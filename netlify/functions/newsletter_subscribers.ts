import type { Context } from '@netlify/functions'
import { loadSubscribers } from './newsletter_storage'

function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed =
    origin &&
    (origin === 'https://markmhendrickson.com' ||
      origin.startsWith('http://localhost:') ||
      origin.endsWith('.netlify.app'))
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://markmhendrickson.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

function jsonResponse(body: object, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers })
}

function requireAuth(req: Request): boolean {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  const expected = process.env.NEWSLETTER_ADMIN_API_KEY
  return !!expected && token === expected
}

export default async function handler(req: Request, _context: Context): Promise<Response> {
  const origin = req.headers.get('Origin')
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  if (!requireAuth(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  const subscribers = await loadSubscribers()
  return jsonResponse(subscribers, 200, headers)
}
