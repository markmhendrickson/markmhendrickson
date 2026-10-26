import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
const tooltipRoot = 'node_modules/@radix-ui/react-tooltip'
const included = Object.entries(lock.packages)
  .filter(([location]) => location === tooltipRoot || location.startsWith(`${tooltipRoot}/node_modules/`))

const noticePath = path.join(root, 'public/THIRD_PARTY_NOTICES.txt')
const shippedPath = path.join(root, 'dist/THIRD_PARTY_NOTICES.txt')

test('the shipped notice includes the exact installed license for every tooltip package', () => {
  assert.equal(included.length, 20, 'known incorporated tooltip dependency closure')
  const notice = fs.readFileSync(noticePath)
  const text = notice.toString('utf8')
  const licenses = included.map(([location, metadata]) => {
    const name = location.slice(location.lastIndexOf('node_modules/') + 'node_modules/'.length)
    const attribution = `- ${name}@${metadata.version}\n`
    assert(text.includes(attribution), `${name}: version attribution`)
    return fs.readFileSync(path.join(root, location, 'LICENSE'))
  })
  for (const license of licenses) {
    assert.deepEqual(license, licenses[0], 'grouped packages carry identical installed license bytes')
  }
  assert(notice.subarray(notice.length - licenses[0].length).equals(licenses[0]), 'exact copyright and permission notice bytes')
  assert(fs.readFileSync(shippedPath).equals(notice), 'served build includes the committed notice unchanged')
})
