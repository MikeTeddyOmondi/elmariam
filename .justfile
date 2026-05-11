# El'Mariam Management System
repository := "https://github.com/MikeTeddyOmondi/elmariam.git"
version := "2.0.0"

# Default
default:
  just --list

# ──── Development ────

# Install all dependencies
install:
  pnpm install

# Start all services in development
dev:
  pnpm turbo dev

# Start only infrastructure (mongo, rabbitmq, minio)
dev-infra:
  docker compose up -d mongo rabbitmq minio

# Start specific app in dev mode
dev-admin:
  cd apps/admin && pnpm dev

dev-staff:
  cd apps/staff && pnpm dev

dev-website:
  cd apps/website && pnpm dev

# ──── Docker ────

# Create Docker network
create-network:
  docker network create elmariam || true

# Build all Docker images
build-all:
  docker compose build

# Start full stack
up:
  docker compose up -d

# Stop full stack
down:
  docker compose down

# Rebuild and restart a specific service
restart service:
  docker compose up -d --build {{service}}

# View logs for a specific service
logs service:
  docker compose logs -f {{service}}

# ──── Database ────

# Connect to MongoDB shell
mongo-shell:
  docker exec -it elmariam-mongo mongosh

# Seed database with sample data
seed:
  cd packages/db && pnpm run seed

# ──── Utilities ────

# Build all packages
build-packages:
  pnpm turbo build --filter='./packages/*'

# Type check everything
typecheck:
  pnpm turbo typecheck

# Clean all build artifacts
clean:
  pnpm turbo clean
  rm -rf node_modules
  find . -name "node_modules" -type d -prune -exec rm -rf {} +

# ──── Production ────

# Build all for production
build-prod:
  NODE_ENV=production pnpm turbo build

# Push all Docker images
push-images:
  docker compose push
