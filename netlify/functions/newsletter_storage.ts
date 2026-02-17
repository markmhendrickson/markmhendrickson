import { getStore } from '@netlify/blobs'
import * as fs from 'fs'
import * as path from 'path'

const STORE_NAME = 'newsletter-subscribers'
const BLOB_KEY = 'subscribers'
const DEFAULT_DB_PATH = 'data/newsletter_subscribers.json'

export interface Subscriber {
  email: string
  survey: Record<string, unknown>
  subscribed_at: string
  updated_at: string
  status: string
  confirmed_at?: string
}

function useLocalStorage(): boolean {
  return (
    process.env.USE_LOCAL_NEWSLETTER_STORAGE === '1' || process.env.NETLIFY_DEV === 'true'
  )
}

function getDbPath(): string {
  const envPath = process.env.NEWSLETTER_DB_PATH || DEFAULT_DB_PATH
  return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath)
}

export async function loadSubscribers(): Promise<Subscriber[]> {
  if (useLocalStorage()) {
    const dbPath = getDbPath()
    try {
      if (!fs.existsSync(dbPath)) return []
      const raw = fs.readFileSync(dbPath, 'utf-8')
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }
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

export async function saveSubscribers(subscribers: Subscriber[]): Promise<void> {
  if (useLocalStorage()) {
    const dbPath = getDbPath()
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(dbPath, JSON.stringify(subscribers, null, 2), 'utf-8')
    return
  }
  const store = getStore({ name: STORE_NAME })
  await store.set(BLOB_KEY, JSON.stringify(subscribers, null, 2))
}
