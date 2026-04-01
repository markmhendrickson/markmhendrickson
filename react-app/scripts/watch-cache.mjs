#!/usr/bin/env node

import { watch } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(appRoot, '../../../..')
const generateScript = path.join(repoRoot, 'execution', 'scripts', 'generate_website_cache.py')

const watchedTargets = [
  path.join(appRoot, 'src', 'content', 'posts'),
]

let timer = null
let running = false
let queued = false

function log(message) {
  process.stdout.write(`[watch:cache] ${message}\n`)
}

function runGenerate() {
  if (running) {
    queued = true
    return
  }
  running = true
  const cmd = spawn('python3', [generateScript], {
    cwd: appRoot,
    stdio: 'inherit',
    env: process.env,
  })

  cmd.on('exit', (code) => {
    if (code === 0) {
      log('cache regenerated')
    } else {
      log(`cache regeneration failed (exit ${code ?? 'unknown'})`)
    }
    running = false
    if (queued) {
      queued = false
      runGenerate()
    }
  })
}

function scheduleGenerate(eventType, filename) {
  const label = filename ? `${eventType}: ${filename}` : eventType
  log(`change detected (${label})`)

  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    timer = null
    runGenerate()
  }, 500)
}

for (const target of watchedTargets) {
  watch(target, { recursive: true }, (eventType, filename) => {
    // Only react to post content/metadata files relevant for publish/unpublish flow.
    if (!filename) {
      scheduleGenerate(eventType, filename)
      return
    }
    const normalized = filename.toString()
    if (
      normalized.endsWith('.md') ||
      normalized.endsWith('.summary.md') ||
      normalized.endsWith('.tweet.md') ||
      normalized.endsWith('posts.json')
    ) {
      scheduleGenerate(eventType, normalized)
    }
  })
  log(`watching ${target}`)
}

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
