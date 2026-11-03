import { pathToFileURL } from 'node:url'

const positiveInteger = value => Number.isSafeInteger(value) && value > 0
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && Number.isFinite(Date.parse(value))

/** Public metadata only. Never attach a token or echo an upstream body. */
async function readPublicJson(url) {
  const response = await fetch(url, {
    redirect: 'error',
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(30000),
  })
  if (response.status !== 200) throw new Error('unavailable')
  return response.json()
}

export async function verifyLatestPagesRun(env, readJson = readPublicJson) {
  const runId = Number(env.GITHUB_RUN_ID)
  const runNumber = Number(env.GITHUB_RUN_NUMBER)
  const api = new URL(env.GITHUB_API_URL)
  if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash ||
      !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.GITHUB_REPOSITORY ?? '') ||
      !positiveInteger(runId) || !positiveInteger(runNumber) || !sha(env.GITHUB_SHA) ||
      !env.DEFAULT_BRANCH) throw new Error('invalid binding')
  const root = `${api.href.replace(/\/$/, '')}/repos/${env.GITHUB_REPOSITORY}/actions`
  const current = await readJson(`${root}/runs/${runId}`)
  if (current.id !== runId || current.run_number !== runNumber ||
      current.head_sha !== env.GITHUB_SHA || current.head_branch !== env.DEFAULT_BRANCH ||
      !positiveInteger(current.workflow_id) || !timestamp(current.created_at)) {
    throw new Error('current run mismatch')
  }
  const query = new URLSearchParams({
    branch: env.DEFAULT_BRANCH, created: `>=${current.created_at}`, per_page: '100',
  })
  const history = await readJson(`${root}/workflows/${current.workflow_id}/runs?${query}`)
  // A normal new run has only a small recent window. An old rerun with more
  // history holds rather than claiming the newest run from a partial page.
  if (!positiveInteger(history.total_count) || history.total_count > 100 ||
      !Array.isArray(history.workflow_runs) || history.workflow_runs.length !== history.total_count) {
    throw new Error('incomplete run history')
  }
  const seen = new Set()
  let found = false
  for (const run of history.workflow_runs) {
    if (!positiveInteger(run.id) || seen.has(run.id) || !positiveInteger(run.run_number) ||
        run.workflow_id !== current.workflow_id || run.head_branch !== env.DEFAULT_BRANCH ||
        !sha(run.head_sha) || !timestamp(run.created_at) || run.created_at < current.created_at) {
      throw new Error('invalid run history')
    }
    seen.add(run.id)
    // A cancelled, skipped, or failed newer run still supersedes this run's
    // queue-time secret snapshot. Recovery dispatches a fresh run.
    if (run.run_number > runNumber) throw new Error('superseded run')
    if (run.id === runId) {
      if (run.run_number !== runNumber || run.head_sha !== env.GITHUB_SHA ||
          run.created_at !== current.created_at) throw new Error('current run mismatch')
      found = true
    }
  }
  if (!found) throw new Error('current run missing')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await verifyLatestPagesRun(process.env)
    console.log('Verified latest Pages workflow run.')
  } catch {
    console.error('Pages publication held: latest workflow run could not be verified. Dispatch a fresh default-branch build after reconciling outstanding work.')
    process.exitCode = 1
  }
}
