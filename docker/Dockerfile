# =============================================================================
# Stage 1: Dependency Builder (uses standard python:3.12-slim-bookworm + uv)
# Avoids ghcr.io authentication issues by installing uv directly from PyPI
# =============================================================================
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

# Install uv binary from PyPI
RUN pip install --no-cache-dir uv

# Enable bytecode compilation and copy link mode for caching
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy dependency definition files
COPY pyproject.toml uv.lock ./

# Install production dependencies into /app/.venv
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev


# =============================================================================
# Stage 2: Shared Base Runtime
# =============================================================================
FROM python:3.12-slim-bookworm AS base

WORKDIR /app

# Install minimal runtime utilities (curl for container health checks, ca-certificates for TLS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Security: create a dedicated non-root application user and group
RUN groupadd --system --gid 1000 appgroup && \
    useradd --system --uid 1000 --gid appgroup --create-home appuser

# Copy isolated virtual environment from builder stage
COPY --from=builder /app/.venv /app/.venv

# Configure environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1


# =============================================================================
# Stage 3: Development Environment (Hot-Reloading & Debugging)
# =============================================================================
FROM base AS development

LABEL maintainer="Splitter Team" \
      environment="development" \
      description="Splitter API & Worker - Development Image"

# Copy source files (in dev, usually overridden by volume mount .:/app)
COPY . /app

# Normalize shell script line endings (prevents Windows CRLF errors) and make executable
RUN sed -i 's/\r$//' /app/docker/*.sh && chmod +x /app/docker/*.sh

EXPOSE 8000

# Default entrypoint runs database readiness check, migrations, and uvicorn with --reload
CMD ["/app/docker/entrypoint.dev.sh"]


# =============================================================================
# Stage 4: Production Environment (Lean, Secure, Multi-Worker)
# =============================================================================
FROM base AS production

LABEL maintainer="Splitter Team" \
      environment="production" \
      description="Splitter API & Worker - Production Image"

# Copy application source with non-root ownership
COPY --chown=appuser:appgroup . /app

# Normalize shell script line endings and set permissions
RUN sed -i 's/\r$//' /app/docker/*.sh && chmod +x /app/docker/*.sh

# Switch to non-root user for security compliance
USER appuser

EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production entrypoint runs database migrations then starts multi-worker Uvicorn
CMD ["/app/docker/entrypoint.sh"]
