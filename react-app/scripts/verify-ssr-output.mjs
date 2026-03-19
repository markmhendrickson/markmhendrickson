#!/usr/bin/env node
/**
 * Verify that the build output is server-rendered: no SSR placeholder in key HTML files.
 * Run after prerender in build:ci so we never deploy client-only by mistake.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')
const SSR_PLACEHOLDER = '<!--ssr-outlet-->'

const keyFiles = [
  'index.html',
  'posts/index.html',
]

let failed = false
for (const rel of keyFiles) {
  const filePath = path.join(distDir, rel)
  if (!fs.existsSync(filePath)) {
    console.error(`verify-ssr: missing ${rel}`)
    failed = true
    continue
  }
  const html = fs.readFileSync(filePath, 'utf-8')
  if (html.includes(SSR_PLACEHOLDER)) {
    console.error(`verify-ssr: ${rel} still contains SSR placeholder (prerender did not run or failed)`)
    failed = true
  }
  // Prerendered HTML is much larger than the client-only shell (~2k+ for key pages)
  const minBytes = 2000
  if (html.length < minBytes) {
    console.error(`verify-ssr: ${rel} too small (${html.length} bytes), expected prerendered content`)
    failed = true
  }
}

if (failed) {
  process.exit(1)
}
console.log('verify-ssr: OK — key pages contain server-rendered content')
