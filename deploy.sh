#!/bin/bash
# Kametrix VPS Deployment Script

set -e

echo "=== Kametrix Deployment ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Copy .env.production.example to .env and fill in your values:"
    echo "  cp .env.production.example .env"
    echo "  nano .env"
    exit 1
fi

# Fix Windows line endings if present
echo "Fixing line endings..."
sed -i 's/\r$//' .env

# Load environment variables
set -a
source .env
set +a

# Pull latest code (if using git)
if [ -d .git ]; then
    echo "Pulling latest changes..."
    git pull origin main
fi

# Build and start containers
echo "Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for postgres to be ready
echo "Waiting for database..."
sleep 5

# Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -e DATABASE_URL="postgresql://${POSTGRES_USER:-kametrix}:${POSTGRES_PASSWORD:-kametrix123}@postgres:5432/${POSTGRES_DB:-kametrix}" app node_modules/.bin/prisma migrate deploy

echo ""
echo "=== Deployment Complete ==="
echo "App is running on port 3000"
echo ""
echo "Configure nginx reverse proxy with:"
echo "  sudo nano /etc/nginx/sites-available/kametrix"
echo ""
echo "Don't forget to update:"
echo "1. Google OAuth redirect URI: ${NEXT_PUBLIC_APP_URL}/api/google/callback"
echo "2. Vapi webhook URL: ${NEXT_PUBLIC_APP_URL}/api/webhooks/vapi"
echo ""
