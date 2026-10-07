#!/bin/sh
# =============================================================================
# docker/entrypoint.dev.sh — Development entrypoint for the Splitter API service
# - Waits for PostgreSQL database readiness
# - Applies pending Alembic database migrations
# - Starts Uvicorn with hot-reload enabled
# =============================================================================
set -e

echo "======================================================"
echo " Splitter API — Development Mode (Hot-Reload Enabled)"
echo "======================================================"

# Wait for database readiness if DATABASE_URL is configured
echo "[dev-entrypoint] Checking database availability..."
python - <<'EOF'
import asyncio
import os
import sys

async def wait_for_db():
    url = os.getenv("DATABASE_URL", "")
    if not url or "sqlite" in url:
        print("[dev-entrypoint] SQLite or no DATABASE_URL configured; skipping database wait check.")
        return 0
    try:
        import asyncpg
    except ImportError:
        print("[dev-entrypoint] asyncpg not installed, proceeding directly.")
        return 0

    clean_url = url.replace("postgresql+asyncpg://", "postgresql://")
    for attempt in range(1, 31):
        try:
            conn = await asyncpg.connect(clean_url, timeout=3)
            await conn.close()
            print(f"[dev-entrypoint] Database connection established successfully on attempt {attempt}.")
            return 0
        except Exception as exc:
            if attempt % 5 == 0 or attempt == 1:
                print(f"[dev-entrypoint] Waiting for database (attempt {attempt}/30)... ({exc})")
            await asyncio.sleep(1)

    print("[dev-entrypoint] ERROR: Database connection timed out after 30 seconds!", file=sys.stderr)
    return 1

sys.exit(asyncio.run(wait_for_db()))
EOF

# Run database migrations before bringing the dev server up
echo "[dev-entrypoint] Running Alembic database migrations..."
alembic upgrade head
echo "[dev-entrypoint] Database migrations applied successfully."

# Start Uvicorn in development mode with reload
PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"
LOG_LEVEL="${LOG_LEVEL:-debug}"

echo "[dev-entrypoint] Starting Uvicorn with --reload (host: ${HOST}, port: ${PORT}, log-level: ${LOG_LEVEL})..."
exec uvicorn app.main:app \
    --host "${HOST}" \
    --port "${PORT}" \
    --reload \
    --log-level "${LOG_LEVEL}"
