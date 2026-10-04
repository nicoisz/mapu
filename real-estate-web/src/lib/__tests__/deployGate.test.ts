import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it, vi } from 'vitest'

it('blocks failed or outdated production migrations and accepts current successful ones', async () => {
  const workflow = readFileSync(resolve('../.github/workflows/deploy.yml'), 'utf8')
  const script = workflow
    .split('          script: |\n')[1]
    .split('\n  deploy:')[0]
    .split('\n')
    .map((line) => line.replace(/^ {12}/, ''))
    .join('\n')
  const runGate = new Function('github', 'context', 'core', `return (async () => {${script}})()`)
  for (const [conclusion, status, blocked] of [
    ['failure', 'ahead', true],
    ['success', 'behind', true],
    ['success', 'ahead', false],
    ['success', 'identical', false],
  ] as const) {
    const setFailed = vi.fn()
    const github = {
      rest: {
        actions: {
          listWorkflowRuns: async () => ({
            data: { workflow_runs: [{ status: 'completed', conclusion, head_sha: 'deployed' }] },
          }),
        },
        repos: {
          listCommits: async () => ({ data: [{ sha: 'required' }] }),
          compareCommitsWithBasehead: async () => ({ data: { status } }),
        },
      },
    }
    await runGate(github, { repo: { owner: 'test', repo: 'test' }, sha: 'release' }, { setFailed })
    expect(setFailed.mock.calls.length > 0).toBe(blocked)
  }
})
