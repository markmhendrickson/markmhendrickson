#!/usr/bin/env node
/**
 * Dev newsletter API server for localhost development without Netlify.
 * Implements POST /api/newsletter/subscribe, POST /api/newsletter/confirm,
 * POST /api/newsletter/update-survey, GET /api/newsletter/subscribers.
 * Uses local JSON file for storage.
 *
 * Usage: npm run dev:api (or node scripts/dev-newsletter-api.mjs)
 * Vite proxy forwards /api/newsletter to this server when running npm run dev.
 */

import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(__dirname, '..', '..')
const defaultDbPath = path.join(siteRoot, 'data', 'newsletter_subscribers.json')
const dbPath = path.resolve(
  siteRoot,
  process.env.NEWSLETTER_DB_PATH || 'data/newsletter_subscribers.json'
)
const port = parseInt(process.env.NEWSLETTER_DEV_API_PORT || '3456', 10)

function loadSubscribers() {
  try {
    if (!fs.existsSync(dbPath)) return []
    const raw = fs.readFileSync(dbPath, 'utf-8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveSubscribers(subscribers) {
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(dbPath, JSON.stringify(subscribers, null, 2), 'utf-8')
}

function validateEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
}

function corsHeaders(req) {
  const origin = req.headers.origin || ''
  const allowed =
    origin.startsWith('http://localhost:') || origin.endsWith('.netlify.app')
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

function requireAuth(req) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  const expected = process.env.NEWSLETTER_ADMIN_API_KEY
  return !!expected && token === expected
}

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  const headers = corsHeaders(req)
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  next()
})

app.post('/api/newsletter/subscribe', (req, res) => {
  const body = req.body || {}
  const email = String(body.email || '').trim().toLowerCase()
  const survey = body.survey && typeof body.survey === 'object' ? body.survey : {}

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' })
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address format' })
  }

  const subscribers = loadSubscribers()
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

  saveSubscribers(subscribers)
  res.status(200).json({
    success: true,
    message: 'Successfully subscribed',
    email,
    email_sent: false,
  })
})

app.post('/api/newsletter/update-survey', (req, res) => {
  const body = req.body || {}
  const email = String(body.email || '').trim().toLowerCase()
  const survey = body.survey && typeof body.survey === 'object' ? body.survey : {}

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' })
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address format' })
  }

  const subscribers = loadSubscribers()
  const existing = subscribers.find((s) => s.email === email)

  if (!existing) {
    return res.status(404).json({ error: 'Subscriber not found' })
  }

  existing.survey = { ...existing.survey, ...survey }
  saveSubscribers(subscribers)
  res.status(200).json({ success: true, message: 'Survey updated' })
})

app.post('/api/newsletter/confirm', (req, res) => {
  const body = req.body || {}
  const email = String(body.email || '').trim().toLowerCase()

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' })
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address format' })
  }

  const subscribers = loadSubscribers()
  const existing = subscribers.find((s) => s.email === email)

  if (!existing) {
    return res.status(404).json({ error: 'Subscriber not found' })
  }

  const now = new Date().toISOString()
  existing.confirmed_at = existing.confirmed_at || now
  existing.updated_at = now
  saveSubscribers(subscribers)
  res.status(200).json({ success: true, message: 'Confirmation recorded' })
})

app.get('/api/newsletter/subscribers', (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production'
  if (!isDev && !requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const subscribers = loadSubscribers()
  res.status(200).json(subscribers)
})

app.listen(port, () => {
  console.log(`Newsletter dev API on http://localhost:${port}`)
  console.log(`Storage: ${dbPath}`)
})
