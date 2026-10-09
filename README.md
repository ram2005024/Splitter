# Splitter

Splitter is a group expense manager. You create a group, add expenses, split them in several ways, and settle up with the fewest possible payments. It has a FastAPI backend, a Next.js frontend, and a full CI/CD pipeline that deploys to AWS EC2.

[![CI/CD](https://github.com/ram2005024/Splitter/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ram2005024/Splitter/actions)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)

---

## Contents

- [What it does](#what-it-does)
- [How it is built](#how-it-is-built)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Run it locally](#run-it-locally)
- [Environment variables](#environment-variables)
- [Deploy to AWS EC2](#deploy-to-aws-ec2)
- [The CI/CD pipeline](#the-cicd-pipeline)
- [Rules that keep deployments healthy](#rules-that-keep-deployments-healthy)
- [Troubleshooting](#troubleshooting)
- [API reference](#api-reference)
- [Frontend](#frontend)
- [Testing](#testing)
- [Database migrations](#database-migrations)
- [License](#license)

---

## What it does

**Accounts and security**
- Registration with email verification through a 6-digit code (stored in Redis with an expiry, sent by a background Celery job).
- Rate limiting on registration per IP, and a 10-minute account lock after 5 failed logins.
- Forgot-password flow with a time-limited code.
- JWT access tokens. The refresh token lives in an HttpOnly cookie, so JavaScript can never read it.

**Groups**
- The creator becomes the group admin.
- Every group gets an 8-character invite code. Members can also be added directly by email.
- Each group has its own currency.

**Expenses**
- Four ways to split: `EQUAL`, `EXACT`, `PERCENTAGE`, and `SHARES`. All of them are calculated to the cent, so the parts always add up to the total.
- Any member can be the payer, and several people can pay for one expense.
- Live balances show what each person has spent, owes, and their net position.

**Settlements**
- Record payments between members (cash, UPI, PayPal, Venmo, and so on).
- Debt simplification uses a greedy minimum cash flow algorithm. If Charlie owes Bob 30 and Bob owes Alice 30, Charlie simply pays Alice 30. One payment instead of two.
- An activity log records everything that happens in a group.

---

## How it is built

The backend is split into layers, and each layer only talks to the one below it:

```
HTTP client / frontend
        |
   API layer        FastAPI routes, validation, auth, response format
        |
   Service layer    business rules, split math, spam protection, Celery jobs
        |
   Repository layer SQLAlchemy queries
        |
   PostgreSQL (asyncpg)
```

Services and repositories are created through two small factories (`ServiceFactory`, `RepoFactory`). This keeps the layers separate and makes them easy to test.

---

## Tech stack

| Area | Tools |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic v2 |
| Data | PostgreSQL 16, Redis 7 |
| Background jobs | Celery (email sending) |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Infrastructure | Docker, Nginx, GitHub Actions, GitHub Container Registry (GHCR), AWS EC2 |
| Tests | Pytest (backend), Vitest (frontend) |

---

## Project structure

```
Splitter/
├── app/
│   ├── core/              settings, database, redis, security, celery, exceptions
│   ├── modules/           auth, users, groups, expenses, settlements, activities, common
│   ├── api/               dependencies and the v1 router
│   ├── factories/         repo_factory.py, service_factory.py
│   ├── workers/           Celery tasks (email)
│   └── main.py            application entry point
├── frontend/              Next.js application
├── docker/
│   ├── Dockerfile         multi-stage image (development and production targets)
│   ├── entrypoint.sh      production start: wait for DB, run migrations, start workers
│   ├── entrypoint.dev.sh  development start with auto-reload
│   └── nginx.conf         reverse proxy configuration
├── alembic/               database migrations
├── tests/                 backend tests
├── .github/workflows/
│   └── ci-cd.yml          test, build, push and deploy pipeline
├── docker-compose.dev.yml     local development stack
├── docker-compose.prod.yml    production stack
├── .env.example               variables for local development
└── .env.production.example    variables for the production server
```

Keep exactly two compose files: `docker-compose.dev.yml` and `docker-compose.prod.yml`. Extra copies only cause confusion about which one is used.

---

## Response format

Every endpoint returns the same shape.

Success:

```json
{
  "success": true,
  "message": "Group created successfully.",
  "data": { "id": "c1f7b889-...", "name": "Trip to Japan", "invite_code": "J7K9M2XP" },
  "meta": null
}
```

Error:

```json
{
  "success": false,
  "message": "Account temporarily locked. Try again in 599 seconds.",
  "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "...", "details": null }
}
```

---

## Run it locally

You need Docker and Docker Compose. For the non-Docker route you also need Python 3.12, `uv`, and Node 20.

### Option A: Docker (recommended)

```bash
git clone https://github.com/ram2005024/Splitter.git
cd Splitter
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

This starts PostgreSQL, Redis, Mailpit (a fake inbox), the API, the Celery worker and the frontend. The API container waits for the database, applies all migrations, and starts with auto-reload, so edits to files in `app/` show up straight away.

| Service | Address |
|---|---|
| Frontend | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8001/docs |
| Health check | http://localhost:8001/health |
| Mailpit (see verification codes here) | http://localhost:8025 |
| PostgreSQL | localhost:5433 (user `postgres`, password `postgres`, database `splitter_db`) |
| Redis | localhost:6379 |

The API port depends on `API_PORT` in your `.env`. Registration and password-reset codes are emails, so open Mailpit to read them.

Useful commands:

```bash
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f celery_worker
docker compose -f docker-compose.dev.yml exec api uv run pytest -v
docker compose -f docker-compose.dev.yml exec api uv run alembic revision --autogenerate -m "describe change"
docker compose -f docker-compose.dev.yml down
```

### Option B: run the processes yourself

```bash
# 1. Install dependencies
uv sync --dev

# 2. Start only the supporting services
docker compose -f docker-compose.dev.yml up -d postgres redis mailpit

# 3. Apply migrations
uv run alembic upgrade head

# 4. Start the API (terminal 1)
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 5. Start the worker (terminal 2)
uv run celery -A app.core.celery_app worker --loglevel=info

# 6. Start the frontend (terminal 3)
cd frontend && npm install && npm run dev
```

---

## Environment variables

There are two env files with two different jobs:

- `.env.example` is for local development. Copy it to `.env`.
- `.env.production.example` is a template for the server. It only contains placeholders and is safe to commit.

The real production `.env` exists only on the server. Never commit it.

Minimum production values:

```env
# Application
PROJECT_NAME="Splitter"
ENVIRONMENT=production
DEBUG=False
API_V1_STR=/api/v1
HTTP_PORT=80
HTTPS_PORT=443
NEXT_PUBLIC_API_URL=/api/v1
ALLOWED_ORIGINS=http://YOUR_SERVER_IP,https://yourdomain.com

# Security (generate with: openssl rand -hex 32)
SECRET_KEY=replace_with_a_long_random_value
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
VERIFICATION_CODE_EXPIRE_MINUTES=15
PASSWORD_RESET_CODE_EXPIRE_MINUTES=15

# PostgreSQL: the single source of truth for database credentials
POSTGRES_USER=splitter_user
POSTGRES_PASSWORD=replace_with_hex_password
POSTGRES_DB=splitter_db

# Workers (keep at 2 on small instances)
UVICORN_WORKERS=2
CELERY_CONCURRENCY=2

# Rate limits
RATE_LIMIT_REGISTER_PER_IP=5
RATE_LIMIT_REGISTER_WINDOW_SECONDS=900
RATE_LIMIT_LOGIN_MAX_FAILED_ATTEMPTS=5

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=True
SMTP_SSL=False
SMTP_USER=you@example.com
SMTP_PASSWORD=your_app_password
EMAILS_FROM_EMAIL=you@example.com
EMAILS_FROM_NAME="Splitter"
```

Things to know:

- **Do not set `DATABASE_URL`, `REDIS_URL`, or the Celery URLs in the production `.env`.** `docker-compose.prod.yml` builds them from the `POSTGRES_*` values, so the app and the database can never disagree.
- **Use a plain password** made of letters and numbers (`openssl rand -hex 24` works well). Characters such as `@ / : # $` break the database URL. If you must use `$`, wrap the value in single quotes.
- **Each variable must appear once.** A duplicated key is a common source of confusion.

---

## Deploy to AWS EC2

This is the full path from nothing to a running server. The pipeline then updates it on every push.

### Step 1: Launch the instance

1. In the AWS console, go to EC2 and choose Launch Instance.
2. Pick Ubuntu Server 24.04 LTS.
3. Instance type: `t3.small` (2 GB RAM) is comfortable. `t2.micro` (1 GB) works only with the swap file in step 2.
4. Create a key pair and keep the `.pem` file safe.
5. Security group, inbound rules:

   | Type | Port | Source |
   |---|---|---|
   | SSH | 22 | your IP |
   | HTTP | 80 | anywhere |
   | HTTPS | 443 | anywhere |

6. Storage: at least 25 GiB (gp3).

### Step 2: Prepare the server

```bash
chmod 400 splitter-key.pem
ssh -i splitter-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Then on the server:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw openssl

# Docker's official repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let the ubuntu user run docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# Swap file (strongly recommended on 1 GB instances)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 3: Clone the project into the right place

The pipeline always works in `/opt/splitter/Splitter`. Clone so that this exact folder is created:

```bash
sudo mkdir -p /opt/splitter
sudo chown ubuntu:ubuntu /opt/splitter
cd /opt/splitter
git clone https://github.com/ram2005024/Splitter.git
cd Splitter
pwd        # must print /opt/splitter/Splitter
```

Do not add a `.` to the end of the clone command, and do not clone a second copy anywhere else. If you want a different location, change the `APP_DIR` line in the deploy job of `.github/workflows/ci-cd.yml`.

### Step 4: Create the real `.env`

```bash
cd /opt/splitter/Splitter
cp .env.production.example .env
nano .env
```

Fill in real values (see [Environment variables](#environment-variables)). Generate the secrets like this:

```bash
openssl rand -hex 32     # for SECRET_KEY
openssl rand -hex 24     # for POSTGRES_PASSWORD
```

Check that git is not tracking it:

```bash
git ls-files .env        # should print nothing
```

### Step 5: Give the server permission to pull images

Images are stored in GitHub Container Registry. In GitHub, create a personal access token (classic) with the `read:packages` scope, and add it as a repository secret named `GHCR_TOKEN` (see [secrets](#repository-secrets)). The pipeline logs in with it during every deploy.

If you want to run the first start by hand instead of waiting for the pipeline:

```bash
echo "YOUR_TOKEN" | docker login ghcr.io -u ram2005024 --password-stdin
docker compose --env-file .env -f docker-compose.prod.yml pull
docker compose --env-file .env -f docker-compose.prod.yml up -d
docker compose --env-file .env -f docker-compose.prod.yml ps
```

### Step 6: Let the pipeline take over

Add the repository secrets, then push to `main`. From now on every push tests, builds, and deploys automatically.

### Step 7: HTTPS

The stack ships with a self-signed certificate, so HTTPS works immediately but the browser shows a warning. The pipeline creates this certificate only when the files `nginx-selfsigned.crt` and `nginx-selfsigned.key` do not exist. It never overwrites existing files.

For a real certificate, point a domain's A record at your server, then:

```bash
cd /opt/splitter/Splitter
sudo apt install -y certbot
docker compose --env-file .env -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d splitter.yourdomain.com
sudo cp /etc/letsencrypt/live/splitter.yourdomain.com/fullchain.pem nginx-selfsigned.crt
sudo cp /etc/letsencrypt/live/splitter.yourdomain.com/privkey.pem  nginx-selfsigned.key
sudo chown ubuntu:ubuntu nginx-selfsigned.crt nginx-selfsigned.key
docker compose --env-file .env -f docker-compose.prod.yml up -d nginx
```

Let's Encrypt certificates last 90 days, so repeat the copy step after each renewal. The alternative is an AWS load balancer that handles the certificate for you.

---

## The CI/CD pipeline

The workflow lives in `.github/workflows/ci-cd.yml` and runs on every push to `main` or `master`. Pull requests run only the tests.

```
Backend tests ----+
                  +--> Build and push images --> Deploy to EC2
Frontend tests ---+
```

**1. Backend tests.** Spins up PostgreSQL and Redis, checks that the app imports, applies all Alembic migrations on an empty database, then runs Pytest.

**2. Frontend tests.** Installs dependencies, runs the TypeScript check, and builds Next.js.

**3. Build and push.** Builds the API and frontend images and pushes each with two tags: `latest` and the commit SHA, for example `ghcr.io/ram2005024/splitter-api:<sha>`.

**4. Deploy.** Connects over SSH and does this on the server:

1. Works in `/opt/splitter/Splitter` and updates the code.
2. Checks that `.env` exists, that the Postgres values and `SECRET_KEY` are set, and that no placeholders remain. It never edits `.env`.
3. Creates the self-signed certificate if the files are missing.
4. Removes images that no container uses, so the disk does not fill up.
5. Logs in to GHCR and pulls the exact images built from this commit. The tags are stored in a small file called `.images.env`.
6. Starts PostgreSQL and Redis, then checks that the credentials in `.env` really work. If the data volume holds an older password, it finds an existing role and updates the password to match `.env`.
7. Starts the full stack and waits for the API health check.
8. Runs `alembic upgrade head`.
9. Prunes stopped containers, unused images and build cache. It does not touch volumes, so the database is safe.

If the stack fails to start, the API never becomes healthy, or the migration fails, the pipeline restores the previous image tags and brings the old version back up. A failed migration can leave the database partly migrated, and the rollback does not undo that.

Replacing containers causes a short interruption while the new API starts. This is a simple deploy, not a zero-downtime one.

### Repository secrets

In GitHub go to Settings, Secrets and variables, Actions, and add:

| Secret | Value |
|---|---|
| `EC2_HOST` | Public IP or domain of the server |
| `EC2_USERNAME` | `ubuntu` (the default if omitted) |
| `EC2_SSH_KEY` | The full contents of your `.pem` private key |
| `EC2_PORT` | `22` (the default if omitted) |
| `GHCR_TOKEN` | Personal access token with `read:packages` |

If `EC2_HOST` or `EC2_SSH_KEY` is missing, the pipeline still tests and publishes the images and skips the deploy with a warning.

---

## Rules that keep deployments healthy

Most past deployment trouble came from breaking one of these.

1. **One project folder, one `.env`.** On the server there is exactly one: `/opt/splitter/Splitter`. Run `pwd` before you edit anything. A second copy of the repo with a second `.env` means the pipeline and you are looking at different settings.
2. **The server `.env` is yours.** Only edit it by hand on the server. The pipeline reads it and never changes it.
3. **Database credentials are applied only once.** PostgreSQL reads `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` when the data volume is first created. Changing them in `.env` later does not change an existing database. After changing the password, follow the reset steps in [Troubleshooting](#troubleshooting).
4. **Never delete the database volume by accident.** These commands destroy your data: `docker compose down -v`, `docker volume rm splitter-prod_postgres_prod_data`, and `docker system prune --volumes`. The pipeline never uses them.
5. **Never commit secrets.** `.env` must stay out of git. If a secret is ever pasted in a chat, a screenshot, or a commit, replace it.
6. **Use simple passwords.** Letters and numbers only for the database password.
7. **Do not set `DATABASE_URL` in the production `.env`.** Compose builds it from `POSTGRES_*`.
8. **Do not run commands with the shell prompt included.** Copy only the command, not `ubuntu@host:~$`.
9. **Keep `UVICORN_WORKERS=2` on small instances.** Four workers on 1 GB of RAM leads to out-of-memory kills.
10. **Keep two compose files only.** The files are `docker-compose.dev.yml` and `docker-compose.prod.yml`.
11. **Watch the disk.** Run `docker system df` now and then. The pipeline prunes old images on every deploy.
12. **Check Actions after every push.** A green run means the stack is healthy. A red run tells you which step failed.

---

## Troubleshooting

Always run server commands from `/opt/splitter/Splitter`.

Handy alias for the long compose command:

```bash
cd /opt/splitter/Splitter
DC="docker compose --env-file .env --env-file .images.env -f docker-compose.prod.yml"
$DC ps
$DC logs api --tail=100
```

### "password authentication failed for user ..."

The password inside the database volume differs from the one in `.env`. This is rule 3.

Option A, keep your data. Reset the password inside the container, which trusts local connections:

```bash
cd /opt/splitter/Splitter
getenv() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^"//;s/"$//' -e "s/^'//;s/'$//"; }
U="$(getenv POSTGRES_USER)"; PW="$(getenv POSTGRES_PASSWORD)"; DB="$(getenv POSTGRES_DB)"

# find a role that already exists in the volume
ADMIN=""
for cand in "$U" postgres splitter_user; do
  docker exec splitter_postgres_prod psql -U "$cand" -d postgres -tAc 'select 1' >/dev/null 2>&1 && { ADMIN="$cand"; break; }
done
echo "using role: $ADMIN"

# create or update the role from .env
docker exec -i splitter_postgres_prod psql -U "$ADMIN" -d postgres -v ON_ERROR_STOP=1 -v u="$U" -v pw="$PW" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN SUPERUSER PASSWORD %L', :'u', :'pw')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'u')
\gexec
SELECT format('ALTER ROLE %I WITH LOGIN SUPERUSER PASSWORD %L', :'u', :'pw')
\gexec
SQL

# list databases and check that yours is there
docker exec -i splitter_postgres_prod psql -U "$ADMIN" -d postgres -c '\l'
```

The deploy job does this automatically when the login test fails, so re-running the failed workflow is often enough.

Option B, start fresh. This deletes all data:

```bash
cd /opt/splitter/Splitter
docker compose --env-file .env -f docker-compose.prod.yml down
docker volume rm splitter-prod_postgres_prod_data
```

### "role ... does not exist" or "role root does not exist"

You ran `psql` without a user, or the user in `.env` was never created in this volume. Use the commands above, which try the usual role names and create the missing one.

### The pipeline uses different settings than the ones you edited

You have two copies of the project. Look for them:

```bash
ls -la /opt/splitter/.env /opt/splitter/Splitter/.env ~/splitter/.env 2>&1
```

Keep only `/opt/splitter/Splitter/.env`. Rename any other with `sudo mv file file.old`.

### The deploy fails at "API did not become healthy"

```bash
$DC logs api --tail=100
```

Common causes: a wrong value in `.env`, a database login problem (see above), a migration error, or `curl` missing from the API image (the health check uses it).

### Nginx will not start and the logs mention a directory

Docker creates a folder if a mounted file is missing. Fix:

```bash
cd /opt/splitter/Splitter
rm -rf nginx-selfsigned.crt nginx-selfsigned.key
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx-selfsigned.key -out nginx-selfsigned.crt -subj "/CN=localhost"
$DC up -d nginx
```

### "no space left on device"

```bash
docker system df
docker image prune -af
docker builder prune -af
```

### Containers keep restarting or get killed

Check memory with `free -m`. Make sure the swap file from step 2 is active (`swapon --show`) and `UVICORN_WORKERS=2`.

### A pull fails with "unauthorized"

The `GHCR_TOKEN` secret is missing, expired, or lacks `read:packages`. Create a new token and update the secret.

### Roll back by hand

Each deploy stores image tags in `.images.env`. To run an older version, edit that file to point at an older commit tag and run:

```bash
$DC pull
$DC up -d
```

---

## API reference

Interactive docs are at `/docs` (Swagger) and `/redoc`.

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create an account and send a verification code |
| POST | `/verify` | Verify email with the 6-digit code |
| POST | `/resend-verification` | Send a new verification code |
| POST | `/login` | Log in with email and password |
| POST | `/refresh` | Get a new access token (uses the refresh cookie) |
| POST | `/logout` | Revoke the refresh token and clear the cookie |
| POST | `/forgot-password` | Request a password reset code |
| POST | `/reset-password` | Set a new password with the code |

### Users (`/api/v1/users`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Current user and profile |
| PATCH | `/me/profile` | Update phone, bio, currency, payment handle |

### Groups (`/api/v1/groups`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a group (you become admin) |
| GET | `/` | List your groups |
| GET | `/{group_id}` | Group details with members |
| POST | `/join` | Join with an invite code |
| POST | `/{group_id}/members` | Add a member by email |
| GET | `/{group_id}/members` | List members and roles |

### Expenses (`/api/v1/groups`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/{group_id}/expenses` | Add an expense (`EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`) |
| GET | `/{group_id}/expenses` | List expenses with their splits |
| GET | `/{group_id}/expenses/{expense_id}` | One expense |
| DELETE | `/{group_id}/expenses/{expense_id}` | Delete (payer or admin) |
| GET | `/{group_id}/balances` | Net balance of every member |

### Settlements and activity (`/api/v1/groups`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/{group_id}/settlements` | Record a payment between members |
| GET | `/{group_id}/settlements` | Payment history |
| GET | `/{group_id}/simplify-debts` | Minimum set of payments to settle everything |
| GET | `/{group_id}/activities` | Timeline of group events |

---

## Frontend

The frontend is a Next.js App Router project in `frontend/`, using TypeScript, Tailwind, TanStack Query for server data, and Zustand for auth state.

### How login works

- The access token is returned in the JSON response and kept in memory (Zustand).
- The refresh token is set as an HttpOnly, SameSite=Lax cookie. JavaScript cannot read it, so a script injected into the page cannot steal it.
- If several requests get a `401` at the same moment, the client sends exactly one refresh request. The others wait for it and then retry with the new token.
- Refresh tokens rotate. Each refresh blacklists the old token ID in Redis, and logout blacklists the current one.

### Layout

```
frontend/src/
├── app/
│   ├── (auth)/         login, register, verify-email, forgot-password, reset-password
│   ├── (dashboard)/    dashboard, groups, group detail, expense forms, balances, profile
│   └── page.tsx        landing page
├── components/         ui primitives, layout, auth guard, group and settlement dialogs
├── features/           API calls, hooks and Zod schemas for each area
├── lib/api/            Axios client, refresh coordinator, error normalizer
├── providers/          query and auth providers
├── stores/             Zustand auth store
└── types/              API types
```

---

## Testing

Backend:

```bash
uv run pytest -v
```

It covers registration, verification, login with cookies, refresh and logout, rate limiting and lockout, split arithmetic, and debt simplification.

Frontend:

```bash
cd frontend
npm test
npx tsc --noEmit
npm run build
```

---

## Database migrations

```bash
uv run alembic revision --autogenerate -m "describe change"   # create
uv run alembic upgrade head                                    # apply
uv run alembic downgrade -1                                    # undo the last one
uv run alembic current                                         # show the current revision
```

In production the API container applies migrations on start, and the pipeline runs `alembic upgrade head` once more after the stack is healthy.

---

## License

MIT
