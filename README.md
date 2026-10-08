# Splitter — Enterprise Expense Splitter Backend API

[![CI/CD Pipeline](https://github.com/fastapi-practise/splitter/actions/workflows/ci.yml/badge.svg)](https://github.com/fastapi-practise/splitter/actions)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0%20Async-d71f00.svg)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg?logo=redis)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-5.4+-37814A.svg?logo=celery)](https://docs.celeryq.dev/)
[![Docker](https://img.shields.io/badge/Docker-Dev%20%7C%20Prod-2496ED.svg?logo=docker)](https://www.docker.com/)

A clean, modular, and production-grade backend system for group expense management, multi-payer bill splitting, and debt settlements. Built strictly following clean layered architecture (`api` → `service` → `repo` → `database`) with dependency injection via factories.

---

## 📑 Table of Contents

- [Architectural Design](#-architectural-design)
- [Key Features](#-key-features)
- [Split & Settlement Algorithms](#-split--settlement-algorithms)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Standardized Response Envelopes](#-standardized-response-envelopes)
- [Running in Development vs Deploying in Production](#-running-in-development-vs-deploying-in-production)
  - [Environment Matrix Comparison](#environment-matrix-comparison)
  - [1. Development Mode (Local Hot-Reload)](#1-development-mode-local-hot-reload)
    - [Method A: Docker Compose Development (Recommended)](#method-a-docker-compose-development-recommended)
    - [Method B: Local Virtualenv Setup (with uv or pip)](#method-b-local-virtualenv-setup-with-uv-or-pip)
  - [2. Production Deployment (GitHub Container Registry)](#2-production-deployment-github-container-registry)
    - [Production Architecture & GHCR Images](#production-architecture--ghcr-images)
    - [Running with Docker Compose in Production](#running-with-docker-compose-in-production)
  - [3. Complete AWS EC2 Deployment Guide](#3-complete-aws-ec2-deployment-guide)
    - [Step 1: Launch & Configure EC2 Instance](#step-1-launch--configure-ec2-instance)
    - [Step 2: Server Provisioning & Docker Installation](#step-2-server-provisioning--docker-installation)
    - [Step 3: Setup Project Directory & Environment](#step-3-setup-project-directory--environment)
    - [Step 4: Authenticate with GitHub Container Registry](#step-4-authenticate-with-github-container-registry)
    - [Step 5: Pull Containers & Launch Stack](#step-5-pull-containers--launch-stack)
    - [Step 6: Free SSL / HTTPS Setup with Certbot](#step-6-free-ssl--https-setup-with-certbot)
  - [4. Docker Registry Configuration (GHCR)](#4-docker-registry-configuration-ghcr)
- [Continuous Integration & Delivery (CI/CD)](#-continuous-integration--delivery-cicd)
  - [Automated Pipeline Workflow](#automated-pipeline-workflow)
  - [Configuring GitHub Repository Secrets](#configuring-github-repository-secrets)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Database Migrations (Alembic)](#-database-migrations-alembic)
- [License](#-license)

---

## 🏛 Architectural Design

The project enforces strict separation of concerns across all modules:

```
[ HTTP Client / Frontend ]
           │
           ▼
    ┌──────────────┐
    │  API Layer   │  FastAPI Routers, Request Validation (Pydantic), Auth Guards, Response Envelopes
    └──────┬───────┘
           │ Injected via ServiceFactory
           ▼
    ┌──────────────┐
    │Service Layer │  Domain Logic, Mathematical Splits, Anti-Spam (Redis), Celery Job Dispatching
    └──────┬───────┘
           │ Injected via RepoFactory
           ▼
    ┌──────────────┐
    │  Repo Layer  │  Database Queries, Async SQL Execution (BaseRepository + Domain Repos)
    └──────┬───────┘
           │
           ▼
[ PostgreSQL / SQLAlchemy ORM (asyncpg) ]
```

1. **`api` Layer**: Handles route parameters, HTTP status codes, security/auth dependencies, and wraps all payloads into unified success/error envelopes.
2. **`service` Layer**: Implements core business logic: split calculations down to the penny, debt simplification graphs, spam prevention, OTP verification, and dispatching async background jobs.
3. **`repo` Layer**: Encapsulates all SQLAlchemy queries (`select`, `selectinload`, `flush`, `refresh`).
4. **`factories`**: Provides centralized dependency injection (`RepoFactory`, `ServiceFactory`) for decoupled testing and clean extensibility.

---

## 🚀 Key Features

### 1. Authentication & Security
- **Registration**: Validates email format, first name, last name, and password confirmation (`password1` vs `password2`).
- **Automatic Profile Provisioning**: Every user automatically receives an associated `UserProfile` in the database upon registration (currency preferences, avatar, phone, bio, payment handles).
- **Redis Anti-Spam Protection**: Prevents registration spamming via sliding-window IP rate limiting (configurable limit per window).
- **Email Verification**: Generates cryptographically secure 6-digit OTPs stored with TTL in Redis; dispatches emails asynchronously through Celery.
- **Brute-Force & Lockout**: Tracks failed login attempts in Redis; automatically locks accounts for 10 minutes upon 5 consecutive failures.
- **Password Reset**: Secure forgot-password flow via time-limited OTP verification.
- **JWT Authentication**: High-security Bearer access tokens (HS256) and refresh tokens.

### 2. Group Management
- **Role-Based Membership**: Group creator is automatically assigned as the `ADMIN`.
- **Unique Invite Codes**: Automatically generates human-readable 8-character invite codes (e.g. `H7K2M9XP`) for instant group joining.
- **Direct Invitations**: Admins and members can add registered friends directly by email address.
- **Multi-Currency Support**: Groups support configurable base currencies (USD, EUR, GBP, INR, etc.).

### 3. Expense Splitting & Calculations
- **Four Split Mechanisms**:
  1. `EQUAL`: Divides expenses equally, mathematically adjusting remaining cents so sums match the exact total.
  2. `EXACT`: Each member owes an explicit amount; validates that the sum matches the total down to $0.01.
  3. `PERCENTAGE`: Custom percentages; enforces a strict 100.00% sum and auto-adjusts rounding pennies.
  4. `SHARES`: Proportional weighting (e.g. 2 shares vs 1 share).
- **Multi-Payer Support**: Allows any group member to pay on behalf of all or a subset of members.
- **Real-Time Balances**: Computes total spending, total owed, and net balance for each member in the group.

### 4. Settlements & Debt Simplification
- **Direct Payments**: Record repayments between members with payment methods (Cash, UPI, PayPal, Venmo) and reference notes.
- **Splitwise-Style Debt Simplification**: Built-in **Greedy Minimum Cash Flow Graph Algorithm** that minimizes the total number of transactions needed to settle all group debts.
  - *Example*: If Charlie owes Bob $30 and Bob owes Alice $30, the algorithm simplifies it so Charlie pays Alice $30 directly (1 transaction instead of 2).

---

## 🗂 Project Structure

```
Splitter/
├── app/
│   ├── core/                    # Core configuration, security & infrastructure
│   │   ├── config.py            # Pydantic v2 settings (reads from .env)
│   │   ├── database.py          # Async SQLAlchemy engine & session factory
│   │   ├── redis.py             # aioredis connection manager
│   │   ├── rate_limiter.py      # Redis rate limiting & OTP helpers
│   │   ├── security.py          # Password hashing (bcrypt) & JWT handling
│   │   ├── celery_app.py        # Celery broker & backend setup
│   │   └── exceptions.py        # Base exceptions & custom exception handlers
│   ├── modules/                 # Modular Feature Architecture
│   │   ├── common/              # Shared models, base repository, schemas
│   │   ├── auth/                # Authentication module (register, verify, login, OTP)
│   │   ├── users/               # Users & Profiles module
│   │   ├── groups/              # Groups & Memberships module (invite codes, roles)
│   │   ├── expenses/            # Expenses & mathematical splits module
│   │   ├── settlements/         # Settlements & greedy debt simplification module
│   │   └── activities/          # Audit trail activity logging module
│   ├── api/
│   │   ├── dependencies.py      # FastAPI Depends injection (DB, Redis, Services)
│   │   └── v1/
│   │       └── api_router.py    # Master router aggregating all module endpoints
│   ├── factories/
│   │   ├── repo_factory.py      # Centralized Repository Factory
│   │   └── service_factory.py   # Centralized Service Factory
│   ├── models/
│   │   └── __init__.py          # Central Alembic metadata discovery
│   ├── workers/
│   │   └── tasks.py             # Celery background workers (email dispatching)
│   └── main.py                  # FastAPI application entrypoint & lifespan
├── docker/
│   ├── Dockerfile               # Multi-stage Dockerfile (development & production)
│   ├── Dockerfile.celery        # Standalone Celery worker image
│   ├── entrypoint.sh            # Production startup script (DB check + Alembic + multi-worker)
│   ├── entrypoint.dev.sh        # Development startup script (DB check + Alembic + reload)
│   └── nginx.conf               # Production Nginx reverse proxy configuration
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI/CD Pipeline
├── tests/                       # Pytest test suite (unit, integration, split math)
├── .dockerignore                # Excludes host venv, git, and local secrets
├── .gitattributes               # Enforces LF line endings for scripts across OS
├── .env.example                 # Example environment variables reference
├── alembic.ini                  # Alembic database migration config
├── docker-compose.dev.yml       # Development Compose (Hot reload, Mailpit, exposed ports)
├── docker-compose.prod.yml      # Hardened Production Compose
├── docker-compose.yml           # Production default Compose
├── pyproject.toml               # Project specifications & dependencies
└── requirements.txt             # Pinned requirements
```

---

## 📦 Standardized Response Envelopes

Every API endpoint returns a predictable and structured envelope:

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Group created successfully! Share the invite code with members to join.",
  "data": {
    "id": "c1f7b889-cf77-4b71-b0e2-d5cb0bca8085",
    "name": "Trip to Japan",
    "invite_code": "J7K9M2XP",
    "currency": "USD",
    "group_type": "TRIP",
    "members_count": 1
  },
  "meta": null
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `422 Validation Error`, `429 Rate Limit`)
```json
{
  "success": false,
  "message": "Account temporarily locked due to repeated failed login attempts. Try again in 599 seconds.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Account temporarily locked due to repeated failed login attempts. Try again in 599 seconds.",
    "details": null
  }
}
```

---

## 🔄 Running in Development vs Deploying in Production

### Environment Matrix Comparison

| Dimension | 🛠 Development (`docker-compose.dev.yml`) | 🚀 Production (`docker-compose.prod.yml`) |
|---|---|---|
| **FastAPI Server** | Single worker with `--reload` (live code updates) | 4+ Uvicorn workers (`UVICORN_WORKERS=4`) with proxy headers |
| **Code Mounting** | Volume mounted (`.:/app`) for instant feedback | Baked immutably into Docker image |
| **Linux Venv Protection** | Anonymous `/app/.venv` volume prevents host overwrite | Fully self-contained inside the image |
| **PostgreSQL Port (5432)** | Exposed to host (`5432:5432`) for DBeaver / TablePlus | **Not exposed** (internal network only) |
| **Redis Port (6379)** | Exposed to host (`6379:6379`) for RedisInsight / redis-cli | **Not exposed** (internal network only) |
| **Email / OTP Testing** | **Mailpit** web UI enabled at `http://localhost:8025` | Production SMTP provider (SendGrid, Mailgun, AWS SES) |
| **User Privileges** | Root in dev container for flexibility | Dedicated non-root user (`appuser`, UID 1000) |
| **Database Migrations** | Auto-applied on container boot | Auto-applied on container boot via `entrypoint.sh` |
| **Log Management** | Verbose `DEBUG` level streamed to stdout | `INFO` level with automatic `json-file` log rotation |
| **Restart Policy** | `unless-stopped` | `always` |
| **Reverse Proxy** | Direct access to port 8000 | Optional Nginx reverse proxy with rate limiting & SSL |

---

### 1. Development Mode

#### Method A: Docker Compose Development (Recommended)

Docker Compose provides a complete, isolated environment with FastAPI, PostgreSQL, Redis, Celery worker, and Mailpit email inspector running out of the box.

1. **Clone the repository and copy the environment file**:
   ```bash
   git clone <repo-url>
   cd Splitter
   cp .env.example .env
   ```

2. **Start the development stack**:
   ```bash
   # Build and launch all development services
   docker compose -f docker-compose.dev.yml up --build
   ```
   *(Or run in detached background mode)*:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **What happens automatically**:
   - PostgreSQL and Redis containers boot and pass their health checks.
   - The API container runs `entrypoint.dev.sh`, which waits for PostgreSQL, applies all Alembic migrations (`alembic upgrade head`), and starts Uvicorn with hot-reload enabled.
   - Any edits you make to Python files in `app/` are reflected immediately without rebuilding the container.
   - The container's internal Linux virtual environment (`/app/.venv`) is preserved and never overwritten by your host machine's virtual environment.

4. **Accessing Development Services**:
   - **Interactive Swagger API Documentation**: [http://localhost:8001/docs](http://localhost:8001/docs) *(or port `8000` depending on `API_PORT`)*
   - **ReDoc Documentation**: [http://localhost:8001/redoc](http://localhost:8001/redoc)
   - **Health Check**: [http://localhost:8001/health](http://localhost:8001/health)
   - **Mailpit Web UI (Email & OTP Catcher)**: [http://localhost:8025](http://localhost:8025)
     *(Open this in your browser to view all registration OTPs and password reset emails sent by Celery!)*
   - **PostgreSQL Database**: `localhost:5433` *(Mapped to host port 5433 to avoid conflict with local postgres on 5432; User: `postgres`, Password: `postgres`, DB: `splitter_db`)*
   - **Redis**: `localhost:6379`

5. **Viewing Logs & Running Commands in Dev**:
   ```bash
   # Follow live API logs
   docker compose -f docker-compose.dev.yml logs -f api

   # Follow Celery worker logs
   docker compose -f docker-compose.dev.yml logs -f celery_worker

   # Run test suite inside the container
   docker compose -f docker-compose.dev.yml exec api uv run pytest -v

   # Generate a new database migration inside the container
   docker compose -f docker-compose.dev.yml exec api uv run alembic revision --autogenerate -m "Add new column"

   # Stop all development containers
   docker compose -f docker-compose.dev.yml down
   ```

---

#### Method B: Local Virtualenv Setup (with `uv` or `pip`)

If you prefer running the Python process directly on your host machine:

1. **Install dependencies**:
   ```bash
   # Using uv (fastest)
   uv sync --dev

   # Or using standard pip
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Start backing services (PostgreSQL & Redis)**:
   ```bash
   # You can spin up just Postgres and Redis using Docker:
   docker compose -f docker-compose.dev.yml up -d postgres redis mailpit
   ```

3. **Run database migrations**:
   ```bash
   uv run alembic upgrade head
   ```

4. **Start the FastAPI server**:
   ```bash
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Start the Celery worker (in a second terminal)**:
   ```bash
   uv run celery -A app.core.celery_app worker --loglevel=info
   ```

---

### 2. Production Deployment (GitHub Container Registry)

#### Production Architecture & GHCR Images

In production, the application **does not compile or build images on the production host**. Doing so can starve small or medium cloud instances (like AWS `t2.micro` or `t3.small`) of RAM and CPU during intensive frontend compilation (`npm run build`).

Instead, the CI/CD pipeline builds hardened, multi-stage production images and publishes them to **GitHub Container Registry (GHCR)**:
- **Backend API & Celery Worker**: `ghcr.io/ram2005024/splitter-api:latest`
- **Next.js Frontend**: `ghcr.io/ram2005024/splitter-frontend:latest`

The production compose configuration (`docker-compose.prod.yml` and `docker-compose.yml`) pulls these pre-built images directly from GHCR.

#### Running with Docker Compose in Production

To launch the entire production stack:
```bash
# 1. Pull the latest pre-compiled images from GHCR
docker compose -f docker-compose.prod.yml pull

# 2. Launch all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# 3. Verify running containers and health checks
docker compose -f docker-compose.prod.yml ps
```
*(Alternatively, simply run `docker compose pull && docker compose up -d`, as `docker-compose.yml` defaults to the production GHCR configuration).*

---

### 3. Complete AWS EC2 Deployment Guide

Follow these exact steps to deploy Splitter onto a fresh **Amazon Web Services (AWS) EC2** instance from scratch.

#### Step 1: Launch & Configure EC2 Instance

1. Log into your **AWS Management Console** and navigate to **EC2** &rarr; **Launch Instance**.
2. **Name**: `splitter-production-server`
3. **Application and OS Images (AMI)**: **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type**.
4. **Instance Type**:
   - Recommended: **`t3.small`** (2 vCPU, 2 GB RAM) for smooth production workloads.
   - Budget option: **`t2.micro`** (1 vCPU, 1 GB RAM) — *Note: if using t2.micro, you MUST configure Swap Memory in Step 2*.
5. **Key Pair (login)**: Select or create an RSA key pair (`splitter-key.pem`) and save it securely on your local computer.
6. **Network Settings (Security Group)**:
   Create a Security Group with the following **Inbound Rules**:
   | Type | Port Range | Source | Purpose |
   |---|---|---|---|
   | **SSH** | `22` | `My IP` (or `0.0.0.0/0`) | Secure terminal access |
   | **HTTP** | `80` | `0.0.0.0/0` (Anywhere) | Public web traffic & Let's Encrypt validation |
   | **HTTPS** | `443` | `0.0.0.0/0` (Anywhere) | Encrypted SSL web traffic |
7. **Storage (Volume)**: Configure at least **25 GiB** of `gp3` storage.
8. Click **Launch Instance**.

---

#### Step 2: Server Provisioning & Docker Installation

Connect to your EC2 instance via SSH:
```bash
# On your local machine (adjust path to your key and EC2 public IP):
chmod 400 splitter-key.pem
ssh -i splitter-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Once connected to your Ubuntu EC2 terminal, install Docker Engine and the Docker Compose plugin:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install essential utilities
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw

# 3. Add Docker's official GPG key and repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine, CLI, and Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Enable non-root Docker usage for the ubuntu user
sudo usermod -aG docker ubuntu
newgrp docker

# 6. (CRUCIAL for t2.micro/t3.micro instances) Configure 2GB Swap Memory to prevent OOM kills
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

#### Step 3: Setup Project Directory & Environment

1. Create the project directory:
   ```bash
   sudo mkdir -p /opt/splitter
   sudo chown -R ubuntu:ubuntu /opt/splitter
   cd /opt/splitter
   ```

2. Clone the repository into `/opt/splitter`:
   ```bash
   git clone https://github.com/<your-username>/Splitter.git .
   ```

3. Create your production environment file from the template:
   ```bash
   cp .env.production.example .env
   ```

4. Edit `.env` with your production values:
   ```bash
   nano .env
   ```
   **Key values to configure**:
   - `SECRET_KEY`: Generate a random 64-character hex string:
     ```bash
     openssl rand -hex 32
     ```
   - `POSTGRES_PASSWORD`: Set a strong database password.
   - `GHCR_IMAGE_API`: `ghcr.io/ram2005024/splitter-api:latest`
   - `GHCR_IMAGE_FRONTEND`: `ghcr.io/ram2005024/splitter-frontend:latest`
   - `ALLOWED_ORIGINS`: `http://<YOUR_EC2_PUBLIC_IP>,https://yourdomain.com`
   - `SMTP_...`: Your production SMTP credentials (Gmail App Password, Resend API key, or SendGrid) to send real transactional emails.

---

#### Step 4: Authenticate with GitHub Container Registry

If your GitHub repository or packages are private, authenticate your EC2 Docker daemon with GHCR:

1. On GitHub, create a **Personal Access Token (Classic)**:
   - Go to: **GitHub &rarr; Settings &rarr; Developer Settings &rarr; Personal access tokens &rarr; Tokens (classic)**.
   - Click **Generate new token (classic)**.
   - Note: `EC2-GHCR-Pull-Token`.
   - Select scopes: `read:packages` (and `repo` if pulling private repository files).
   - Click **Generate token** and copy the token (`ghp_xxxxxxxxxxxx`).

2. On your EC2 terminal, log into GHCR:
   ```bash
   echo "ghp_YOUR_TOKEN_HERE" | docker login ghcr.io -u ram2005024 --password-stdin
   ```
   *(You should see: `Login Succeeded`)*.

---

#### Step 5: Pull Containers & Launch Stack

1. **Pull all pre-built images**:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   ```

2. **Start the production stack**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

3. **Verify container health**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   All containers (`splitter_api_prod`, `splitter_frontend_prod`, `splitter_nginx_prod`, `splitter_postgres_prod`, `splitter_redis_prod`, `splitter_celery_worker_prod`) should show status `Up (healthy)`.

4. **Verify database migrations**:
   Alembic runs automatically on API startup. To verify manually:
   ```bash
   docker compose -f docker-compose.prod.yml exec api alembic current
   ```

5. **Clean unused images & check disk space**:
   Whenever new `:latest` images are pulled, previous images become unused. Free up disk space with:
   ```bash
   docker image prune -af
   docker system df
   ```

6. **Test public access**:
   Open your browser and visit: `http://<YOUR_EC2_PUBLIC_IP>`. You will see the Splitter application fully running!

---

#### Step 6: Free SSL / HTTPS Setup with Certbot

To secure your production instance with HTTPS using a custom domain (e.g. `splitter.yourdomain.com`):

1. In your domain DNS manager (e.g. Cloudflare, Route 53, Namecheap), point an **A record** to your EC2 Public IP address.
2. Install Certbot on your EC2 host:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
3. Temporarily stop the Docker Nginx container to free port 80 for standalone certificate generation:
   ```bash
   docker compose -f docker-compose.prod.yml stop nginx
   sudo certbot certonly --standalone -d splitter.yourdomain.com
   ```
4. Mount the generated certificates into `docker/nginx.conf` or terminate SSL at an AWS Application Load Balancer (ALB).

---

### 4. Docker Registry Configuration (GHCR)

The project uses **GitHub Container Registry (ghcr.io)** to host OCI container images.

#### Package Naming Convention
Image tags published by the pipeline follow this naming format:
- `ghcr.io/ram2005024/splitter-api:latest` & `ghcr.io/ram2005024/splitter-api:<git-commit-sha>`
- `ghcr.io/ram2005024/splitter-frontend:latest` & `ghcr.io/ram2005024/splitter-frontend:<git-commit-sha>`

#### Making Packages Public (Optional)
By default, newly published GHCR packages inherit private permissions. To allow pulling without entering credentials:
1. Navigate to your GitHub profile &rarr; **Packages**.
2. Click on `splitter-api` &rarr; **Package Settings** &rarr; scroll to **Danger Zone** &rarr; **Change visibility** &rarr; select **Public**.
3. Repeat for `splitter-frontend`.

---

## 🤖 Continuous Integration & Delivery (CI/CD)

The repository includes a production-grade GitHub Actions pipeline located at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Automated Pipeline Workflow

Whenever code is pushed to the `main` (or `master`) branch:

```
┌─────────────────────────────────┐
│     Job 1: Backend Tests        │  Runs Pytest, syntax compile, & Alembic migrations
└────────────────┬────────────────┘  against isolated PostgreSQL 16 & Redis 7 services
                 │
                 ▼
┌─────────────────────────────────┐
│     Job 2: Frontend Tests       │  Validates TypeScript type consistency (tsc --noEmit)
└────────────────┬────────────────┘  and builds the Next.js production bundle
                 │
                 ▼
┌─────────────────────────────────┐
│  Job 3: Build & Push to GHCR    │  Builds hardened multi-stage Docker images with Buildx
└────────────────┬────────────────┘  and pushes to ghcr.io/ram2005024/splitter-(api|frontend)
                 │
                 ▼
┌─────────────────────────────────┐
│     Job 4: Automated EC2 Deploy │  Connects to AWS EC2 via SSH, pulls new containers,
└─────────────────────────────────┘  executes zero-downtime swap, runs Alembic migrations
```

1. **Backend Tests**: Spawns ephemeral PostgreSQL 16 & Redis 7 service containers, tests migration schema integrity, and runs all unit & integration tests.
2. **Frontend Tests**: Installs dependencies, runs strict TypeScript typechecks, and tests `next build`.
3. **Build & Push**: Compiles the backend and frontend into lean Alpine/Debian-slim production images and pushes them to GHCR.
4. **Deploy to EC2**: Authenticates securely via SSH, pulls updated container tags, triggers zero-downtime container replacement (`docker compose up -d`), runs database migrations, and prunes old images.

### Configuring GitHub Repository Secrets

To enable automated zero-downtime deployments to your EC2 instance upon every `git push origin main`, configure the following secrets in your GitHub repository:

1. Navigate to: **GitHub Repository &rarr; Settings &rarr; Secrets and variables &rarr; Actions &rarr; New repository secret**.
2. Add the following secrets:

| Secret Name | Value Example | Description |
|---|---|---|
| `EC2_HOST` | `54.210.88.120` | Public IPv4 address or domain of your EC2 instance |
| `EC2_USERNAME` | `ubuntu` | SSH login user (default is `ubuntu` on Ubuntu AMIs) |
| `EC2_SSH_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | Entire contents of your private key (`splitter-key.pem`) |
| `EC2_PORT` | `22` | SSH port (defaults to `22` if omitted) |

> **Note**: If `EC2_HOST` or `EC2_SSH_KEY` are not set, the workflow will test the code, build and push the Docker images to GHCR, and safely skip the EC2 deployment step with a helpful notification.

---

## 🔌 API Endpoints Reference

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register new account (IP spam protected, auto profile creation, sends OTP) |
| `POST` | `/verify` | Verify email with 6-digit OTP code |
| `POST` | `/resend-verification` | Resend account verification OTP |
| `POST` | `/login` | Authenticate with email & password (Redis lockout protection) |
| `POST` | `/refresh` | Refresh JWT access token |
| `POST` | `/forgot-password` | Request password reset code |
| `POST` | `/reset-password` | Reset password using verified reset OTP |

### 2. Users & Profiles (`/api/v1/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/me` | Get current logged-in user details and profile |
| `PATCH` | `/me/profile` | Update profile (phone, bio, currency, payment handle) |

### 3. Groups & Members (`/api/v1/groups`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create an expense group (Creator becomes `ADMIN`, generates invite code) |
| `GET` | `/` | List all groups the user belongs to |
| `GET` | `/{group_id}` | Get group details with member list |
| `POST` | `/join` | Join group using 8-character unique invite code |
| `POST` | `/{group_id}/members` | Add member directly by email address |
| `GET` | `/{group_id}/members` | List group members and roles |

### 4. Expenses & Splits (`/api/v1/groups`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/{group_id}/expenses` | Record expense (`EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`) |
| `GET` | `/{group_id}/expenses` | List group expenses with split breakdowns |
| `GET` | `/{group_id}/expenses/{expense_id}` | Get single expense details by ID |
| `DELETE` | `/{group_id}/expenses/{expense_id}` | Delete an expense (payer or group admin) |
| `GET` | `/{group_id}/balances` | Get net balances for all members |

### 5. Settlements & Debt Simplification (`/api/v1/groups`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/{group_id}/settlements` | Record a direct repayment between members |
| `GET` | `/{group_id}/settlements` | View settlement payment history |
| `GET` | `/{group_id}/simplify-debts` | Execute Greedy Min-Cash-Flow graph simplification |

### 6. Activity Logs (`/api/v1/groups`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/{group_id}/activities` | View timeline audit trail of group events |

---

## 🎨 Next.js + TypeScript Full-Stack Frontend

The application features a modern, responsive frontend built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **TanStack Query**, and **Zustand**.

### 1. Authentication Architecture & Security Contract

The frontend and backend implement an enterprise-grade authentication protocol:

```text
LOGIN FLOW:
Browser (Credentials) ──► POST /api/v1/auth/login ──► FastAPI validates password
                                                             │
                              ┌──────────────────────────────┴──────────────────────────────┐
                              ▼                                                             ▼
                    Generate Access Token (JWT)                                   Generate Refresh Token (JWT with JTI)
                              │                                                             │
                              ▼                                                             ▼
                   Return in JSON Body: { access_token, user }                   Set HttpOnly, SameSite=Lax Cookie
                              │                                                             │
                              ▼                                                             ▼
                    Stored in Zustand Auth Store                                Managed entirely by Browser Cookie Jar
```

- **No Refresh Tokens in JavaScript**: Refresh tokens are **never** stored in `localStorage`, `sessionStorage`, or Zustand. The client JavaScript cannot read the token, protecting users from XSS attacks.
- **Concurrent 401 Refresh Deduplication**: If multiple protected API calls (e.g. 4 concurrent requests) return `401 Unauthorized` simultaneously, an in-memory shared promise queue (`refresh.ts`) ensures that **strictly ONE** refresh request is sent to `/api/v1/auth/refresh`. All pending requests await this single promise and retry with the new access token.
- **Refresh Token Rotation & Revocation**: When `/api/v1/auth/refresh` is called, the old token's `jti` is blacklisted in Redis and a fresh token is issued. Calling `/api/v1/auth/logout` explicitly blacklists the active `jti` in Redis and clears the HttpOnly cookie.

### 2. Frontend Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx               # Credentials login & session expiry handling
│   │   │   ├── register/page.tsx            # User registration form
│   │   │   ├── verify-email/page.tsx        # 6-digit email OTP verification
│   │   │   ├── forgot-password/page.tsx     # Password reset code dispatch
│   │   │   └── reset-password/page.tsx      # OTP verification & password update
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                   # Protected route wrapper with workspace header
│   │   │   ├── dashboard/page.tsx           # Net balance overview & active groups
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx                 # Searchable groups list & invite code copy
│   │   │   │   ├── new/page.tsx             # Dedicated group creation form
│   │   │   │   └── [groupId]/
│   │   │   │       ├── page.tsx             # Group tabs: Expenses, Balances, Debts, Members
│   │   │   │       └── expenses/
│   │   │   │           ├── new/page.tsx     # Expense creator (EQUAL, EXACT, PERCENTAGE, SHARES)
│   │   │   │           └── [expenseId]/page.tsx # Expense details & deletion
│   │   │   ├── balances/page.tsx            # Global financial standings & settlements
│   │   │   └── profile/page.tsx             # User profile, currency, & payment handle
│   │   ├── layout.tsx                       # Root layout with QueryClient & Auth providers
│   │   └── page.tsx                         # Landing marketing page with debt simplification hero
│   ├── components/
│   │   ├── ui/                              # Accessible UI primitives (Button, Card, Input, Dialog, etc.)
│   │   ├── layout/                          # AppHeader, Navbar, Navigation links
│   │   ├── auth/                            # ProtectedRoute guard wrapper
│   │   ├── groups/                          # CreateGroupDialog, JoinGroupDialog, AddMemberDialog
│   │   └── settlements/                     # RecordSettlementDialog
│   ├── features/
│   │   ├── auth/                            # Auth API, hooks, Zod validation schemas
│   │   ├── groups/                          # Groups API, hooks, Zod schemas
│   │   ├── expenses/                        # Expenses API, hooks, Zod schemas
│   │   ├── settlements/                     # Settlements API, hooks, Zod schemas
│   │   └── users/                           # Profile update API & hooks
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                    # Centralized Axios client with Bearer injection & 401 retry
│   │   │   ├── refresh.ts                   # Concurrent refresh promise coordinator
│   │   │   └── errors.ts                    # FastAPI error normalizer
│   │   └── utils.ts                         # Formatting for currency, initials, and dates
│   ├── providers/                           # QueryProvider (TanStack) & AuthProvider
│   ├── stores/                              # Zustand useAuthStore
│   └── types/                               # TypeScript API contract definitions
├── Dockerfile.dev                           # Development container with hot-reloading
├── Dockerfile                               # Multi-stage production container with standalone output
└── vitest.config.ts                         # Frontend unit test configuration
```

---

## 🚀 Running the Full-Stack Application

### 1. Development Mode

#### Option A: Docker Compose (Entire Stack)

Runs PostgreSQL, Redis, Mailpit, FastAPI API, Celery Worker, and Next.js Frontend with hot reload:

```bash
# Start all containers in development mode
docker compose -f docker-compose.dev.yml up --build

# Services Available:
# - Frontend Application:    http://localhost:3000
# - Backend FastAPI API:     http://localhost:8001
# - Interactive API Docs:    http://localhost:8001/docs
# - Mailpit Email Inspector: http://localhost:8025
```

#### Option B: Local Processes (Fast Development)

**Terminal 1 — Backend API:**
```bash
uv run uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

**Terminal 2 — Frontend Next.js App:**
```bash
cd frontend
npm run dev
# App starts at http://localhost:3000
```

---

### 2. Production Deployment

The production configuration uses lean multi-stage builds, non-root system users, Uvicorn multi-workers, and Next.js standalone output:

```bash
# Build and run the production stack in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# View container logs
docker compose -f docker-compose.prod.yml logs -f

# Verify service health
docker compose -f docker-compose.prod.yml ps
```

---

## 🧪 Testing

### Backend Test Suite (Pytest)

Covers registration, email verification, cookie login, session refresh, token revocation on logout, rate limiting lockout, split precision arithmetic, and greedy debt simplification:

```bash
uv run pytest -v
```

### Frontend Test Suite (Vitest)

Covers Zustand client authentication state, concurrent token refresh deduplication (verifying exactly 1 request for concurrent 401s), session expiration handling, and expense split mathematics:

```bash
cd frontend
npm test
```

### Frontend Production Type Checking & Build Validation

```bash
cd frontend
npm run build
```

---

## 🗄 Database Migrations (Alembic)

```bash
# Generate a new migration script
uv run alembic revision --autogenerate -m "Add new column"

# Apply all migrations to the database
uv run alembic upgrade head

# Rollback last migration
uv run alembic downgrade -1

# Show current migration revision
uv run alembic current
```

---

## 📄 License

This project is licensed under the MIT License.

