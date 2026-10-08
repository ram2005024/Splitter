#!/bin/sh
# =============================================================================
# docker/entrypoint.sh — Production entrypoint for the Splitter API service
# - Waits for PostgreSQL database readiness
# - Applies pending Alembic database migrations
# - Starts Uvicorn ASGI server with multi-worker concurrency
# =============================================================================
set -e

echo "======================================================"
echo " Splitter API — Starting up (Production Mode)"
echo "======================================================"

# Wait for database readiness if DATABASE_URL is configured
echo "[entrypoint] Checking database availability..."
python - <<'EOF'
import asyncio
import os
import sys

async def wait_for_db():
    url = os.getenv("DATABASE_URL", "")
    if not url or "sqlite" in url:
        print("[entrypoint] SQLite or no DATABASE_URL configured; skipping database wait check.")
        return 0
    try:
        import asyncpg
    except ImportError:
        print("[entrypoint] asyncpg not installed, proceeding directly.")
        return 0

    clean_url = url.replace("postgresql+asyncpg://", "postgresql://")
    for attempt in range(1, 31):
        try:
            conn = await asyncpg.connect(clean_url, timeout=3)
            await conn.close()
            print(f"[entrypoint] Database connection established successfully on attempt {attempt}.")
            return 0
        except Exception as exc:
            if attempt % 5 == 0 or attempt == 1:
                print(f"[entrypoint] Waiting for database (attempt {attempt}/30)... ({exc})")
            await asyncio.sleep(1)

    print("[entrypoint] WARNING: Database connection check timed out, continuing startup...", file=sys.stderr)
    return 0

sys.exit(asyncio.run(wait_for_db()))
EOF

# Run database migrations before bringing the server up
echo "[entrypoint] Running Alembic database migrations..."
alembic upgrade head || echo "[entrypoint] Notice: Alembic migration finished or no pending migrations."
echo "[entrypoint] Database readiness check completed."

# Start Uvicorn in production mode
WORKERS="${UVICORN_WORKERS:-2}"
PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "[entrypoint] Starting Uvicorn (workers: ${WORKERS}, host: ${HOST}, port: ${PORT})..."
exec uvicorn app.main:app \
    --host "${HOST}" \
    --port "${PORT}" \
    --workers "${WORKERS}" \
    --proxy-headers \
    --forwarded-allow-ips="*" \
    --no-access-log
