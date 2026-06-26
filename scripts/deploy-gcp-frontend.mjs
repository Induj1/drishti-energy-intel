import { spawnSync } from 'node:child_process'

if (!process.env.NEXT_PUBLIC_DRISHTI_API_BASE) {
  console.error('NEXT_PUBLIC_DRISHTI_API_BASE is required for frontend-only GCP deploy.')
  console.error('Example: https://PROJECT_REF.supabase.co/functions/v1/drishti-api')
  process.exit(1)
}

const firebaseProject = process.env.FIREBASE_PROJECT_ID ?? 'sample-firebase-ai-app-5e44c'

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npm', ['run', 'build:static'])
run('npx', ['firebase-tools@latest', 'deploy', '--only', 'hosting', '--project', firebaseProject])
