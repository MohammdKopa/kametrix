#!/bin/bash
# =============================================================================
# Kametrix Deployment Script
# =============================================================================
# Usage:
#   ./deploy.sh              - Full deployment (pull, build, migrate, start)
#   ./deploy.sh setup        - First-time setup (create .env, build, migrate, seed)
#   ./deploy.sh update       - Quick update (pull, build, migrate, restart)
#   ./deploy.sh rollback     - Rollback to previous image
#   ./deploy.sh status       - Show container status
#   ./deploy.sh logs         - Show app logs
#   ./deploy.sh logs -f      - Follow app logs
#   ./deploy.sh migrate      - Run database migrations only (with status)
#   ./deploy.sh seed         - Run database seed only
#   ./deploy.sh restart      - Restart containers without rebuild
#   ./deploy.sh stop         - Stop all containers
#   ./deploy.sh clean        - Remove containers and images (keeps data)
#   ./deploy.sh db-check     - Check database schema and applied migrations
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
APP_CONTAINER="kametrix-app"
DB_CONTAINER="kametrix-db"
HEALTH_CHECK_URL="http://localhost:3000/api/health"
HEALTH_CHECK_TIMEOUT=60

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_requirements() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
}

check_env_file() {
    if [ ! -f .env ]; then
        log_error ".env file not found!"
        echo ""
        echo "Create .env file with required variables:"
        echo "  cp .env.production.example .env"
        echo "  nano .env"
        echo ""
        echo "Or run: ./deploy.sh setup"
        exit 1
    fi
    # Fix Windows line endings
    sed -i 's/\r$//' .env 2>/dev/null || true
}

load_env() {
    set -a
    source .env
    set +a
}

wait_for_db() {
    log_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker exec $DB_CONTAINER pg_isready -U ${POSTGRES_USER:-kametrix} &>/dev/null; then
            log_success "Database is ready"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "Database failed to start"
    exit 1
}

health_check() {
    log_info "Running health check..."
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / 2))
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$HEALTH_CHECK_URL" &>/dev/null; then
            log_success "Application is healthy"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "Health check failed after ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

backup_current_image() {
    if docker image inspect kametrix-app:latest &>/dev/null; then
        log_info "Backing up current image..."
        docker tag kametrix-app:latest kametrix-app:rollback 2>/dev/null || true
    fi
}

# Commands
cmd_setup() {
    echo ""
    echo "=== Kametrix First-Time Setup ==="
    echo ""

    check_requirements

    # Create .env if not exists
    if [ ! -f .env ]; then
        if [ -f .env.production.example ]; then
            cp .env.production.example .env
            log_info "Created .env from .env.production.example"
        else
            log_error ".env.production.example not found"
            exit 1
        fi

        echo ""
        log_warn "Please edit .env with your actual values:"
        echo "  nano .env"
        echo ""
        echo "Required variables:"
        echo "  - POSTGRES_PASSWORD (change from default!)"
        echo "  - VAPI_API_KEY"
        echo "  - GOOGLE_CLIENT_ID"
        echo "  - GOOGLE_CLIENT_SECRET"
        echo "  - GOOGLE_ENCRYPTION_KEY (generate: openssl rand -hex 32)"
        echo "  - STRIPE_SECRET_KEY"
        echo "  - STRIPE_WEBHOOK_SECRET"
        echo "  - NEXT_PUBLIC_APP_URL (your domain)"
        echo ""
        read -p "Press Enter after editing .env to continue..."
    fi

    check_env_file
    load_env

    log_info "Building containers..."
    docker compose -f $COMPOSE_FILE build

    log_info "Starting database..."
    docker compose -f $COMPOSE_FILE up -d postgres
    wait_for_db

    log_info "Running migrations..."
    docker compose -f $COMPOSE_FILE --profile migrate run --rm migrate

    log_info "Seeding database..."
    docker compose -f $COMPOSE_FILE --profile seed run --rm seed

    log_info "Starting application..."
    docker compose -f $COMPOSE_FILE up -d app

    sleep 5
    health_check || log_warn "Health check failed, check logs with: ./deploy.sh logs"

    echo ""
    log_success "Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Configure nginx reverse proxy (see nginx.example.conf)"
    echo "2. Set up SSL with certbot"
    echo "3. Update OAuth redirect URIs in Google Console"
    echo "4. Configure Stripe webhook endpoint"
    echo ""
}

cmd_update() {
    echo ""
    echo "=== Kametrix Update ==="
    echo ""

    check_requirements
    check_env_file
    load_env

    # Pull latest code
    if [ -d .git ]; then
        log_info "Pulling latest changes..."
        git pull origin main
    fi

    backup_current_image

    log_info "Building new image..."
    docker compose -f $COMPOSE_FILE build app

    log_info "Restarting application..."
    docker compose -f $COMPOSE_FILE up -d app

    wait_for_db

    log_info "Running migrations..."
    docker compose -f $COMPOSE_FILE --profile migrate run --rm migrate || {
        log_error "Migration failed, rolling back..."
        cmd_rollback
        exit 1
    }

    sleep 5
    if health_check; then
        log_success "Update complete!"
    else
        log_warn "Health check failed, you may want to rollback: ./deploy.sh rollback"
    fi
}

cmd_deploy() {
    echo ""
    echo "=== Kametrix Full Deployment ==="
    echo ""

    check_requirements
    check_env_file
    load_env

    # Pull latest code
    if [ -d .git ]; then
        log_info "Pulling latest changes..."
        git pull origin main
    fi

    backup_current_image

    log_info "Building containers..."
    docker compose -f $COMPOSE_FILE build

    log_info "Starting services..."
    docker compose -f $COMPOSE_FILE up -d

    wait_for_db

    log_info "Running migrations..."
    docker compose -f $COMPOSE_FILE --profile migrate run --rm migrate

    sleep 5
    if health_check; then
        log_success "Deployment complete!"
        cmd_status
    else
        log_warn "Health check failed, check logs with: ./deploy.sh logs"
    fi
}

cmd_rollback() {
    echo ""
    echo "=== Kametrix Rollback ==="
    echo ""

    if ! docker image inspect kametrix-app:rollback &>/dev/null; then
        log_error "No rollback image available"
        exit 1
    fi

    log_info "Rolling back to previous version..."
    docker tag kametrix-app:rollback kametrix-app:latest
    docker compose -f $COMPOSE_FILE up -d app

    sleep 5
    if health_check; then
        log_success "Rollback complete!"
    else
        log_error "Rollback failed, check logs"
    fi
}

cmd_status() {
    echo ""
    echo "=== Container Status ==="
    docker compose -f $COMPOSE_FILE ps
    echo ""

    if docker ps -q -f name=$APP_CONTAINER &>/dev/null; then
        echo "=== App Health ==="
        curl -s "$HEALTH_CHECK_URL" 2>/dev/null && echo "" || echo "Health endpoint not responding"
    fi
}

cmd_logs() {
    local follow=""
    if [ "$1" = "-f" ]; then
        follow="-f"
    fi
    docker compose -f $COMPOSE_FILE logs $follow app
}

cmd_migrate() {
    check_env_file
    load_env
    log_info "Running migrations (with status checks)..."
    docker compose -f $COMPOSE_FILE --profile migrate run --rm migrate
    log_success "Migrations complete!"
}

cmd_seed() {
    check_env_file
    load_env
    log_info "Running seed..."
    docker compose -f $COMPOSE_FILE --profile seed run --rm seed
    log_success "Seed complete!"
}

cmd_restart() {
    log_info "Restarting containers..."
    docker compose -f $COMPOSE_FILE restart
    sleep 5
    health_check
}

cmd_stop() {
    log_info "Stopping containers..."
    docker compose -f $COMPOSE_FILE down
    log_success "Containers stopped"
}

cmd_clean() {
    log_warn "This will remove containers and images (data volumes preserved)"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose -f $COMPOSE_FILE down --rmi local
        log_success "Cleaned up"
    fi
}

cmd_db_check() {
    check_env_file
    load_env
    log_info "Checking database schema..."

    echo ""
    echo "=== User Table Google Columns ==="
    docker exec $DB_CONTAINER psql -U ${POSTGRES_USER:-kametrix} -d ${POSTGRES_DB:-kametrix} -c \
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User' AND column_name LIKE 'google%' ORDER BY column_name;"

    echo ""
    echo "=== Applied Migrations ==="
    docker exec $DB_CONTAINER psql -U ${POSTGRES_USER:-kametrix} -d ${POSTGRES_DB:-kametrix} -c \
        "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at;"

    echo ""
}

# Main
case "${1:-deploy}" in
    setup)
        cmd_setup
        ;;
    update)
        cmd_update
        ;;
    deploy)
        cmd_deploy
        ;;
    rollback)
        cmd_rollback
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs "$2"
        ;;
    migrate)
        cmd_migrate
        ;;
    seed)
        cmd_seed
        ;;
    restart)
        cmd_restart
        ;;
    stop)
        cmd_stop
        ;;
    clean)
        cmd_clean
        ;;
    db-check)
        cmd_db_check
        ;;
    *)
        echo "Usage: $0 {setup|update|deploy|rollback|status|logs|migrate|seed|restart|stop|clean|db-check}"
        exit 1
        ;;
esac
