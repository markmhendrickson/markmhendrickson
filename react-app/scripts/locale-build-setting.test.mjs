import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('one production setting selects English, Spanish and Catalan for Vite and prerender', (t) => {
  const setting = readFileSync(path.join(app, '.env.production'), 'utf8').trim()
  assert.equal(setting, 'VITE_WEBSITE_LOCALES=en,es,ca')
  assert.equal(loadEnv('production', app, 'VITE_').VITE_WEBSITE_LOCALES, 'en,es,ca')

  const dir = mkdtempSync(path.join(tmpdir(), 'website-locales-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const routesFile = path.join(dir, 'routes.json')
  const { WEBSITE_LOCALES, VITE_WEBSITE_LOCALES, ...env } = process.env
  execFileSync(process.execPath, ['server.js', '--list-post-routes-out', routesFile], {
    cwd: app,
    env: { ...env, NODE_ENV: 'production' },
  })
  const routes = JSON.parse(readFileSync(routesFile, 'utf8'))
  assert(routes.some((route) => route.startsWith('/es/posts/')))
  assert(routes.some((route) => route.startsWith('/ca/posts/')))
  assert(!routes.some((route) => /^\/(zh|hi|ar|fr|pt|ru|bn|ur|id|de)\//.test(route)))
})
