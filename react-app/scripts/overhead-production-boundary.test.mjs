import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'

test('published essay SSR contains the new responsive hero and all six retained scenes without a query flag or repeated embedded materials', () => {
  const route = new URL('../dist/posts/your-agents-need-a-system-of-record/index.html', import.meta.url)
  assert(fs.existsSync(route), 'run the production build before this boundary check')
  const html = fs.readFileSync(route, 'utf8')
  for (const scene of ['archiveHeroDesktop', 'archiveHeroMobile', 'connectedRecordsProof', 'syntheticSourcesProof', 'invoiceOverheadProof', 'governedCollaborationProof', 'competingClaimsProof', 'explanationsImpactProof']) {
    assert(html.includes(`data-paper-scene="${scene}"`), scene)
  }
  assert(!html.includes('visual=overhead-proof'))
  assert(!html.includes('data:image/webp;base64,'), 'inline paper textures must load from content-addressed assets')
  assert(html.includes('/images/posts/neotoma-paper/materials/'))
  assert(Buffer.byteLength(html) < 2_000_000, 'prerendered essay must stay usable on mobile')
})
