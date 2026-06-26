# Supabase Backend + GCP Frontend

This mode avoids a full-stack Cloud Run backend.

- Backend: Supabase Edge Function `drishti-api`
- Frontend: static Next export on Firebase Hosting.

Current live deployment:

```text
Cloud Run gateway: https://drishti-sentinelmesh-or2awz4nzq-el.a.run.app
Frontend:          https://drishti-sentinelmesh-500608.web.app
Backend:           https://bkzbcolbucbvnvyqveoe.supabase.co/functions/v1/drishti-api
API gateway:       https://drishti-sentinelmesh-or2awz4nzq-el.a.run.app/api/*
Nasiko probe:      https://drishti-sentinelmesh-or2awz4nzq-el.a.run.app/api/nasiko/probe
Gemini model:      gemini-2.5-flash
```

Note: `drishti-500608` still needs `firebase.projects.update` to become a Firebase project. The current public URL is hosted as a new additional Firebase Hosting site under the existing accessible project `sample-firebase-ai-app-5e44c`, without overwriting that project's default site.

## Required Supabase Values

Create or open a Supabase project, then collect:

```env
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_PROJECT_REF=your-project-ref
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Project ref is in the Supabase project URL:

```text
https://PROJECT_REF.supabase.co
```

Create access token:

```text
Supabase Dashboard -> Account -> Access Tokens -> Generate token
```

Find anon key:

```text
Project Settings -> API -> Project API keys -> anon public
```

## Deploy Supabase Backend

```powershell
npx supabase@latest login --token $env:SUPABASE_ACCESS_TOKEN
npx supabase@latest link --project-ref $env:SUPABASE_PROJECT_REF
npx supabase@latest secrets set OPENAI_API_KEY="$env:OPENAI_API_KEY" TELEGRAM_BOT_TOKEN="$env:TELEGRAM_BOT_TOKEN"
npx supabase@latest functions deploy drishti-api --no-verify-jwt
```

If `secrets set` returns a Supabase access-control error, deploy still works in fallback mode. OpenAI/Telegram enrichment will remain disabled until the Supabase token has owner/admin privileges on the project.

Backend URL:

```text
https://SUPABASE_PROJECT_REF.supabase.co/functions/v1/drishti-api
```

Smoke test:

```powershell
curl.exe https://SUPABASE_PROJECT_REF.supabase.co/functions/v1/drishti-api/api/health
curl.exe https://SUPABASE_PROJECT_REF.supabase.co/functions/v1/drishti-api/api/agents/run -H "Content-Type: application/json" -d "{\"role\":\"citizen\"}"
```

## Deploy GCP Frontend

Set frontend env before building:

```powershell
$env:NEXT_PUBLIC_DRISHTI_API_BASE="https://drishti-sentinelmesh-or2awz4nzq-el.a.run.app"
$env:NEXT_PUBLIC_SUPABASE_URL="https://SUPABASE_PROJECT_REF.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
$env:NEXT_PUBLIC_GEMINI_BADGE="live"
npm run deploy:gcp-frontend
```

The deploy command runs:

1. `npm run build:static`
2. `npx firebase-tools@latest deploy --only hosting --project drishti-500608`

## Verify

Open:

```text
https://drishti-sentinelmesh-or2awz4nzq-el.a.run.app
https://drishti-sentinelmesh-500608.web.app
https://drishti-sentinelmesh-500608.web.app/mobile
https://drishti-sentinelmesh-500608.web.app/nfc
```

Then click `DEMO MODE` and verify agent output comes from Supabase Edge Function.
