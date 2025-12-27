# Kametrix Deployment Guide

This guide covers deploying Kametrix to a self-hosted environment using Docker Compose.

## Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- A **domain name** with DNS pointing to your server
- **SSL certificate** (or use a reverse proxy like Caddy/Nginx)
- **VPS/Server** with at least 1GB RAM

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/kametrix.git
cd kametrix

# 2. Copy environment template
cp .env.production.example .env

# 3. Edit .env and fill in all required values
nano .env

# 4. Start the application
docker compose -f docker-compose.prod.yml up -d

# 5. Run database migrations
docker compose -f docker-compose.prod.yml --profile migrate up migrate

# 6. (Optional) Seed initial data
docker compose -f docker-compose.prod.yml --profile seed up seed

# 7. Verify deployment
curl https://your-domain.com/api/health
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| **Application** |||
| `DOMAIN` | Yes | Your domain name (e.g., `app.example.com`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Full public URL (e.g., `https://app.example.com`) |
| **Database** |||
| `POSTGRES_USER` | Yes | PostgreSQL username (default: `kametrix`) |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password - use a strong random password |
| `POSTGRES_DB` | Yes | Database name (default: `kametrix`) |
| **Vapi** |||
| `VAPI_API_KEY` | Yes | API key from [Vapi Dashboard](https://vapi.ai/dashboard) |
| **Google OAuth** |||
| `GOOGLE_CLIENT_ID` | Yes | OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth Client Secret |
| `GOOGLE_ENCRYPTION_KEY` | Yes | 32-byte hex key for token encryption |
| **Stripe** |||
| `STRIPE_SECRET_KEY` | Yes | Secret key from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret |
| **Email (SMTP)** |||
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port (typically 587) |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | Yes | From address (e.g., `Kametrix <noreply@example.com>`) |

## Docker Compose Commands

### Start Application
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Run Database Migrations
```bash
docker compose -f docker-compose.prod.yml --profile migrate up migrate
```

### Seed Database
Seeds the database with initial data (credit packages, etc.):
```bash
docker compose -f docker-compose.prod.yml --profile seed up seed
```

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# App only
docker compose -f docker-compose.prod.yml logs -f app

# Database only
docker compose -f docker-compose.prod.yml logs -f postgres
```

### Stop Application
```bash
docker compose -f docker-compose.prod.yml down
```

### Stop and Remove Volumes (WARNING: Deletes data)
```bash
docker compose -f docker-compose.prod.yml down -v
```

### Rebuild After Code Changes
```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Health Check

The application exposes a health endpoint for monitoring:

```bash
curl https://your-domain.com/api/health
```

**Response (healthy):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (unhealthy - 503):**
```json
{
  "status": "error",
  "database": "error",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Use this endpoint for:
- Load balancer health checks
- Uptime monitoring (UptimeRobot, Pingdom, etc.)
- Container orchestration health probes

## External Service Setup

### Vapi
1. Sign up at [vapi.ai](https://vapi.ai)
2. Get your API key from the dashboard
3. Configure your phone numbers and assistants in Vapi
4. Set the webhook URL to `https://your-domain.com/api/webhooks/vapi`

### Google Cloud (OAuth + Calendar)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Calendar API**
4. Go to **APIs & Services > Credentials**
5. Create **OAuth 2.0 Client ID** (Web application)
6. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
7. Copy Client ID and Client Secret to your `.env`

### Stripe
1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Create a webhook at [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`
3. Copy the webhook signing secret to your `.env`

## Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs app

# Common issues:
# - Missing environment variables
# - Port 3000 already in use
# - Database not ready yet (wait and retry)
```

### Database connection errors
```bash
# Check if postgres is running
docker compose -f docker-compose.prod.yml ps

# Check postgres logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify DATABASE_URL is correct in app container
docker compose -f docker-compose.prod.yml exec app env | grep DATABASE
```

### Migrations fail
```bash
# Check migration logs
docker compose -f docker-compose.prod.yml logs migrate

# Ensure postgres is healthy before migrating
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Manual migration (interactive)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### OAuth redirect errors
- Verify `NEXT_PUBLIC_APP_URL` matches your actual domain
- Check that the redirect URI in Google Cloud Console matches exactly
- Ensure your domain has valid SSL (Google requires HTTPS)

### Webhooks not working
- Verify your domain is publicly accessible
- Check webhook secrets match between provider and `.env`
- Look for errors in app logs when webhook is triggered
- Use provider's webhook testing tools (Stripe has test events)

### Out of memory
- Increase server RAM (minimum 1GB recommended)
- Check for memory leaks in logs
- Consider adding swap space

### SSL/HTTPS issues
The docker-compose.prod.yml exposes port 3000 directly. For production, use a reverse proxy:

**Caddy (recommended - automatic SSL):**
```Caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

**Nginx:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Backup & Restore

### Backup Database
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U $POSTGRES_USER $POSTGRES_DB
```
