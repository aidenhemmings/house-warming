#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "[entrypoint] Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."

# Wait for postgres to accept connections (up to 30 seconds)
MAX_RETRIES=30
RETRY=0
until node -e "
  const net = require('net');
  const s = new net.Socket();
  s.setTimeout(1000);
  s.connect(Number(process.env.DB_PORT || 5432), process.env.DB_HOST || 'db', () => { s.destroy(); process.exit(0); });
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

# Start the application
echo "[entrypoint] Starting server..."
exec node src/index.js
