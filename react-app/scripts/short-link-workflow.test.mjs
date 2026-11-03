import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

const workflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8')

function command(name) {
  const section = workflow.split(`      - name: ${name}\n`)[1]?.split('\n      - name:')[0]
  assert.ok(section, `missing binding control: ${name}`)
  const run = section.split('        run: |\n')[1]
  assert.ok(run, `missing executable control: ${name}`)
  return run.split('\n').filter(line => line.startsWith('          ')).map(line => line.slice(10)).join('\n')
}

test('manual alias rebuild is default-branch confined and serialized with ordinary Pages deploys', () => {
  assert.match(workflow, /workflow_dispatch:\n    inputs:\n      alias_request_id:/)
  assert.match(workflow, /expected_source_sha:\n[\s\S]*?required: true/)
  assert.match(workflow, /run-name:.*Rendered page aliases/)
  assert.match(workflow, /concurrency:\n  group: pages-production\n  cancel-in-progress: false/)
  assert.match(workflow, /if: github.ref == format\('refs\/heads\/\{0\}', github.event.repository.default_branch\)/)
  assert.ok(workflow.indexOf('Refuse an outdated source before publishing') < workflow.indexOf('name: Setup Pages'))
})

test('actual workflow shell guards reject stale dispatch sources and main that moves during the build', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'alias-workflow-'))
  try {
    writeFileSync(path.join(directory, 'git'), '#!/bin/sh\nprintf "%s\\trefs/heads/main\\n" "$REMOTE_SHA"\n', { mode: 0o700 })
    const env = {
      PATH: directory + path.delimiter + process.env.PATH,
      DEFAULT_BRANCH: 'main', EVENT_NAME: 'workflow_dispatch',
      GITHUB_SHA: 'a'.repeat(40), DISPATCH_SOURCE_SHA: 'a'.repeat(40), REMOTE_SHA: 'a'.repeat(40),
    }
    const run = (name, overrides = {}) => execFileSync('sh', ['-e', '-c', command(name)], { env: { ...env, ...overrides } })
    run('Verify current production source')
    assert.throws(() => run('Verify current production source', { DISPATCH_SOURCE_SHA: 'b'.repeat(40) }))
    assert.throws(() => run('Verify current production source', { REMOTE_SHA: 'b'.repeat(40) }))
    run('Verify current production source', { EVENT_NAME: 'push', DISPATCH_SOURCE_SHA: '' })
    run('Refuse an outdated source before publishing')
    assert.throws(() => run('Refuse an outdated source before publishing', { REMOTE_SHA: 'b'.repeat(40) }))
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
