import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const command = process.platform === 'win32' ? 'next.cmd' : 'next'
const stashRoot = join(process.cwd(), '.static-build-stash')
const moves = [
  ['app/api', 'app-api'],
  ['app/.well-known', 'app-well-known'],
  ['app/og.png', 'app-og-png'],
  ['proxy.ts', 'proxy.ts'],
]

function moveIfExists(from, to) {
  const source = join(process.cwd(), from)
  const target = join(stashRoot, to)
  if (!existsSync(source)) return false
  renameSync(source, target)
  return true
}

function restore(moved) {
  for (const [from, to] of [...moved].reverse()) {
    const source = join(stashRoot, to)
    const target = join(process.cwd(), from)
    if (existsSync(source)) renameSync(source, target)
  }
  if (existsSync(stashRoot)) rmSync(stashRoot, { recursive: true, force: true })
}

if (existsSync(stashRoot)) rmSync(stashRoot, { recursive: true, force: true })
if (existsSync(join(process.cwd(), '.next'))) rmSync(join(process.cwd(), '.next'), { recursive: true, force: true })
mkdirSync(stashRoot)
const moved = moves.filter(([from, to]) => moveIfExists(from, to))

const child = spawn(command, ['build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    STATIC_EXPORT: '1',
  },
})

child.on('exit', (code) => {
  restore(moved)
  process.exit(code ?? 1)
})

child.on('error', (error) => {
  restore(moved)
  console.error(error)
  process.exit(1)
})
