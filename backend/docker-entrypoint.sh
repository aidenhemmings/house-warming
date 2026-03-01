#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────
# DEPLOY TOGGLE: Comment/uncomment the line below to control
# whether the database is wiped and reseeded on every deploy.
# ──────────────────────────────────────────────────────────
FRESH_SEED=true          # ← set to false or comment out to keep existing data
# FRESH_SEED=false       # ← uncomment this line (and comment above) to skip wipe+reseed
# ──────────────────────────────────────────────────────────

# --- Parse DB host/port from DATABASE_URL or fallback to env vars ---
if [ -n "$DATABASE_URL" ]; then
  # Extract host and port from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
  DB_PORT="${DB_PORT:-5432}"
else
  DB_HOST="${DB_HOST:-db}"
  DB_PORT="${DB_PORT:-5432}"
fi

echo "[entrypoint] Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."

# Wait for postgres to accept connections (up to 30 seconds)
MAX_RETRIES=30
RETRY=0
until node -e "
  const net = require('net');
  const s = new net.Socket();
  s.setTimeout(1000);
  s.connect($DB_PORT, '$DB_HOST', () => { s.destroy(); process.exit(0); });
  s.on('error', () => { s.destroy(); process.exit(1); });
  s.on('timeout', () => { s.destroy(); process.exit(1); });
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "[entrypoint] ERROR: PostgreSQL not reachable after ${MAX_RETRIES}s. Exiting."
    exit 1
  fi
  echo "[entrypoint] Postgres not ready yet... retrying ($RETRY/$MAX_RETRIES)"
  sleep 1
done

echo "[entrypoint] PostgreSQL is ready!"

# Run database setup (creates DB if needed, applies schema, seeds admin)
echo "[entrypoint] Running database setup..."
node src/setup-db.js

# Wipe and reseed if enabled
if [ "$FRESH_SEED" = "true" ]; then
  echo "[entrypoint] FRESH_SEED is enabled — wiping data and reseeding..."
  node src/seed.js
  echo "[entrypoint] Seed complete."
else
  echo "[entrypoint] FRESH_SEED is disabled — keeping existing data."
fi

# Start the application
echo "[entrypoint] Starting server..."
exec node src/index.js
