import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

test('actual client and SSR production outputs contain no overhead proof code, markup or materials', () => {
  const dist = new URL('../dist/', import.meta.url)
  assert(fs.existsSync(dist), 'run both Vite production builds before this boundary check')
  const files = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else files.push(file)
    }
  }
  walk(dist.pathname)
  assert(files.some((file) => file.endsWith('/server/entry-server.js')), 'SSR artifact was built')
  assert(files.some((file) => /\/assets\/.*\.js$/.test(file)), 'client artifact was built')
  const forbidden = ['hybrid-record-proof', 'invoiceOverheadProof', 'overhead-invoice-proof', 'visual=overhead-proof', '59e2ce139e5606fbc64ecb27abf5b41ac615e8cf86866af21e08158f47fc4773']
  for (const file of files) {
    assert(!/overhead-record|document-packet|observation-slip|entity-dossier/.test(file), file)
    if (!/\.(?:js|css|html|svg|json)$/.test(file)) continue
    const body = fs.readFileSync(file, 'utf8')
    for (const marker of forbidden) assert(!body.includes(marker), `${path.basename(file)} contains proof-only ${marker}`)
  }
})
