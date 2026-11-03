import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { verifyLatestPagesRun } from './verify-latest-pages-run.mjs'

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
  assert.match(workflow, /name: Refuse a superseded workflow run before publishing\n        env:\n          DEFAULT_BRANCH: \$\{\{ github.event.repository.default_branch \}\}\n        run: node react-app\/scripts\/verify-latest-pages-run.mjs/)
  assert.ok(workflow.indexOf('Refuse a superseded workflow run before publishing') > workflow.indexOf('name: Upload artifact'))
  assert.ok(workflow.indexOf('Refuse a superseded workflow run before publishing') < workflow.indexOf('      - name: Deploy to GitHub Pages'))
  assert.doesNotMatch(workflow, /actions: read|actions: write/)
})

const env = {
  GITHUB_API_URL: 'https://api.github.example', GITHUB_REPOSITORY: 'example/site',
  GITHUB_RUN_ID: '400', GITHUB_RUN_NUMBER: '30', GITHUB_SHA: 'a'.repeat(40), DEFAULT_BRANCH: 'main',
}
const currentRun = {
  id: 400, run_number: 30, workflow_id: 10, head_branch: 'main', head_sha: env.GITHUB_SHA,
  created_at: '2026-01-01T12:00:00Z', status: 'in_progress', conclusion: null,
}

function metadataReader(runs, overrides = {}) {
  const calls = []
  const read = async url => {
    calls.push(url)
    return calls.length === 1 ? { ...currentRun, ...overrides.current } : {
      total_count: runs.length, workflow_runs: runs, ...overrides.history,
    }
  }
  return { calls, read }
}

test('latest-run boundary accepts current source and refuses older same-source runs for every newer outcome', async () => {
  const current = metadataReader([currentRun, { ...currentRun, id: 399, run_number: 29 }])
  await verifyLatestPagesRun(env, current.read)
  assert.equal(current.calls[0], 'https://api.github.example/repos/example/site/actions/runs/400')
  const request = new URL(current.calls[1])
  assert.equal(request.pathname, '/repos/example/site/actions/workflows/10/runs')
  assert.deepEqual([...request.searchParams], [['branch', 'main'], ['created', '>=2026-01-01T12:00:00Z'], ['per_page', '100']])
  for (const conclusion of [null, 'success', 'failure', 'cancelled', 'skipped']) {
    const newer = { ...currentRun, id: 401, run_number: 31, status: conclusion ? 'completed' : 'queued', conclusion }
    const metadata = metadataReader([currentRun, newer])
    await assert.rejects(verifyLatestPagesRun(env, metadata.read), /superseded run/)
  }
})

test('unreadable, partial and misbound run metadata fail closed', async () => {
  for (const overrides of [
    { current: { head_sha: 'b'.repeat(40) } }, { current: { head_branch: 'other' } },
    { current: { created_at: undefined } }, { current: { workflow_id: undefined } },
    { history: { total_count: 2 } }, { history: { total_count: 101 } },
    { history: { total_count: 0, workflow_runs: [] } }, { history: { workflow_runs: null } },
  ]) {
    const metadata = metadataReader([currentRun], overrides)
    await assert.rejects(verifyLatestPagesRun(env, metadata.read))
  }
  for (const run of [
    { ...currentRun, id: 399 }, { ...currentRun, workflow_id: 11 },
    { ...currentRun, head_branch: 'other' }, { ...currentRun, head_sha: 'b'.repeat(40) },
    { ...currentRun, created_at: 'invalid' }, { ...currentRun, run_number: undefined },
  ]) {
    const metadata = metadataReader([run])
    await assert.rejects(verifyLatestPagesRun(env, metadata.read))
  }
  await assert.rejects(verifyLatestPagesRun(env, async () => { throw new Error('unreadable upstream') }))
})

test('actual latest-run CLI sends no authorization and sanitizes upstream failures', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'latest-pages-run-'))
  try {
    const fixture = path.join(directory, 'fetch-fixture.mjs')
    const calls = path.join(directory, 'requests.jsonl')
    writeFileSync(fixture, `import { appendFileSync } from 'node:fs';\nlet count = 0;\nglobalThis.fetch = async (url, options) => {\n  appendFileSync(${JSON.stringify(calls)}, JSON.stringify({url,options})+'\\n');\n  return {status:process.env.TEST_HTTP_FAILURE ? 503 : 200,json:async()=>++count === 1 ? ${JSON.stringify(currentRun)} : ${JSON.stringify({ total_count: 1, workflow_runs: [currentRun] })}};\n};\n`)
    const script = new URL('./verify-latest-pages-run.mjs', import.meta.url)
    const run = overrides => execFileSync(process.execPath, ['--import', fixture, script.pathname], {
      env: { ...env, GH_TOKEN: 'synthetic-existing-token', ...overrides }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    })
    assert.match(run({}), /Verified latest Pages workflow run/)
    const sent = readFileSync(calls, 'utf8').trim().split('\n').map(JSON.parse)
    assert.equal(sent.length, 2)
    for (const request of sent) {
      assert.deepEqual(request.options.headers, { Accept: 'application/vnd.github+json' })
      assert.equal(request.options.redirect, 'error')
    }
    assert.throws(() => run({ TEST_HTTP_FAILURE: '1' }), error => {
      assert.equal(error.status, 1)
      assert.doesNotMatch(error.stderr.toString(), /synthetic-existing-token|503|api.github.example/)
      return true
    })
  } finally { rmSync(directory, { recursive: true, force: true }) }
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
