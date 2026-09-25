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

# Build shared packages (required before running apps)
build-packages:
  pnpm --filter @elmariam/db build
  pnpm --filter @elmariam/queue build

# Start only core infrastructure (mongo, rabbitmq, openauth)
dev-infra:
  docker compose up -d mongo compass rabbitmq openauth

# Start specific app in dev mode (run build-packages first)
dev-admin:
  pnpm --filter @elmariam/admin dev

dev-staff:
  pnpm --filter @elmariam/staff dev

dev-website:
  pnpm --filter @elmariam/website dev

# Start all apps in dev mode via turborepo
dev:
  pnpm turbo dev

# ──── Docker ────

# Sequential on purpose: five concurrent SvelteKit builds have exhausted the
# Docker VM and killed BuildKit mid-run, leaving no usable image and an opaque
# error. Use build-all-parallel on a machine with headroom.
# Build all Docker images, one at a time
build-all:
  docker compose build openauth
  docker compose build integrations
  docker compose build admin
  docker compose build staff
  docker compose build website

# Build every image concurrently. Needs roughly 8 GB free in the Docker VM.
build-all-parallel:
  docker compose build

# Build everything, then show what was produced.
build-verify: build-all
  @echo ""
  @echo "Built images:"
  @docker images --filter reference='*elmariam*' --format '  {{{{.Repository}}}}:{{{{.Tag}}}}  {{{{.Size}}}}'

# Build a specific image
build service:
  docker compose build {{service}}

# Start the simplified stack (mongo + rabbitmq + openauth + integrations + apps)
up:
  docker compose up -d

# Start only core infrastructure containers
up-infra:
  docker compose up -d mongo compass rabbitmq minio openauth 

# Stop all containers
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

# Connect directly to the elmariam database
mongo-db:
  docker exec -it elmariam-mongo mongosh elmariam

# Seed database with sample data
seed:
  pnpm --filter @elmariam/db run seed

# ──── Utilities ────

# Type check everything
typecheck:
  pnpm turbo typecheck

# Clean all build artifacts and node_modules
clean:
  pnpm turbo clean
  find . -name "node_modules" -type d -prune -exec rm -rf {} +
  find . -name "dist" -type d -not -path "*/node_modules/*" -exec rm -rf {} +

# ──── Production ────

# Build all apps for production
build-prod:
  just build-packages
  NODE_ENV=production pnpm turbo build

# Push all Docker images to registry
push-images:
  docker compose push
