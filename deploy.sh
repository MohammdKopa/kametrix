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

# Load environment variables
source .env

# Update Caddyfile with domain
if [ -n "$DOMAIN" ]; then
    sed -i "s/\${DOMAIN:localhost}/$DOMAIN/g" Caddyfile
    echo "Configured domain: $DOMAIN"
fi

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
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

echo ""
echo "=== Deployment Complete ==="
echo "Your app is running at: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update Google OAuth redirect URI to: https://$DOMAIN/api/google/callback"
echo "2. Update Vapi webhook URL to: https://$DOMAIN/api/webhooks/vapi"
echo ""
