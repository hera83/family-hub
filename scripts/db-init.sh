#!/usr/bin/env bash
set -euo pipefail

echo "⏳ Waiting for Postgres to be ready..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
  sleep 1
done
echo "✅ Postgres is ready."

# Check if schema is already initialised by looking for a core table
TABLE_EXISTS=$(psql -t -A -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='recipes');")

if [ "$TABLE_EXISTS" = "t" ]; then
  echo "ℹ️  Database already initialised (table 'recipes' exists). Skipping migrations."
  exit 0
fi

echo "🚀 Running migrations..."
for f in /migrations/*.sql; do
  echo "  ➜ Applying $(basename "$f") ..."
  psql -v ON_ERROR_STOP=1 -f "$f"
done

# Optional seed
if [ -f /seed/seed.sql ]; then
  echo "🌱 Running seed.sql ..."
  psql -v ON_ERROR_STOP=1 -f /seed/seed.sql
fi

echo "✅ All migrations applied successfully."
