#!/usr/bin/env bash
# Grabs local Supabase credentials and writes them to .env.local
set -e

STATUS=$(supabase status --output env 2>/dev/null) || { echo "ERROR: supabase is not running. Run: supabase start"; exit 1; }

API_URL=$(echo "$STATUS" | grep "^API_URL=" | cut -d= -f2-)
ANON_KEY=$(echo "$STATUS" | grep "^ANON_KEY=" | cut -d= -f2-)

if [[ -z "$API_URL" || -z "$ANON_KEY" ]]; then
  echo "ERROR: Could not read credentials from supabase status"
  exit 1
fi

ENV_FILE=".env.local"
# Replace or insert SUPABASE vars
if grep -q "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" 2>/dev/null; then
  sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=${API_URL}|" "$ENV_FILE"
  sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_SUPABASE_URL=${API_URL}" >> "$ENV_FILE"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}" >> "$ENV_FILE"
fi

echo ""
echo "✅  .env.local updated:"
echo "    NEXT_PUBLIC_SUPABASE_URL=${API_URL}"
echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY:0:20}..."
echo ""
echo "Next: npm run dev"
