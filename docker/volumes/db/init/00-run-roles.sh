#!/bin/bash
set -e

# This wrapper runs the SQL init script, passing POSTGRES_PASSWORD as a psql variable.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v db_pass="'${POSTGRES_PASSWORD}'" \
  -f /docker-entrypoint-initdb.d/00-supabase-roles.sql
