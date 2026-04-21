# ── Config ───────────────────────────────────────────────────
registry := "ranckosolutionsinc"
version  := "1.0.0"

default:
  just --list

# ── Install ──────────────────────────────────────────────────

# Install all workspace deps (pnpm) + checkout (bun)
install:
  pnpm install
  cd checkout && bun install

# ── Build ────────────────────────────────────────────────────

# Compile TypeScript for all workspace packages
build:
  pnpm turbo run build

# Compile a single service
build-service service:
  pnpm turbo run build --filter={{service}}

# ── Lint & Test ──────────────────────────────────────────────

lint:
  pnpm turbo run lint

test:
  pnpm turbo run test

# ── Docker: internal helpers ──────────────────────────────────

# Prune workspace and build Docker image for an API service
_prune-and-build scope service tag:
  pnpm turbo prune --scope={{scope}} --docker
  docker build \
    -t {{registry}}/elmariam-{{service}}:{{tag}} \
    -f api/{{service}}/Dockerfile \
    out/
  rm -rf out/

# Same but for sms/smtp which live at root level (not under api/)
_prune-and-build-root scope service tag:
  pnpm turbo prune --scope={{scope}} --docker
  docker build \
    -t {{registry}}/elmariam-{{service}}:{{tag}} \
    -f {{service}}/Dockerfile \
    out/
  rm -rf out/

# ── Docker: API services ─────────────────────────────────────

build-auth    tag=version: (_prune-and-build "@elmariam/auth"  "auth"  tag)
build-hotel   tag=version: (_prune-and-build "@elmariam/hotel" "hotel" tag)
build-bar     tag=version: (_prune-and-build "@elmariam/bar"   "bar"   tag)
build-sms     tag=version: (_prune-and-build-root "@elmariam/sms"  "sms"  tag)
build-smtp    tag=version: (_prune-and-build-root "@elmariam/smtp" "smtp" tag)

# ── Docker: UI panels ────────────────────────────────────────
# UI services use turbo prune for consistent pnpm-lock.yaml handling.
# Dockerfiles expect to be built from the out/ pruned context.

_prune-and-build-ui scope panel image-name tag:
  pnpm turbo prune --scope={{scope}} --docker
  docker build \
    -t {{registry}}/{{image-name}}:{{tag}} \
    -f ui/{{panel}}/Dockerfile \
    out/
  rm -rf out/

build-ui-admin tag=version: (_prune-and-build-ui "@elmariam/admin" "admin" "elmariam-admin-panel" tag)
build-ui-user  tag=version: (_prune-and-build-ui "@elmariam/user"  "user"  "elmariam-user-panel"  tag)
build-ui-web   tag=version: (_prune-and-build-ui "@elmariam/web"   "web"   "elmariam-website"     tag)

# ── Docker: Checkout (Bun — standalone, not in pnpm workspace) ──
build-checkout tag=version:
  docker build -t {{registry}}/elmariam-checkout:{{tag}} checkout/

# ── Docker: Gateway ──────────────────────────────────────────
build-gateway tag=version:
  docker build -t {{registry}}/elmariam-api-gateway:{{tag}} gateway/

# ── Docker: Build everything ─────────────────────────────────
build-all tag=version: \
  (build-auth       tag) \
  (build-hotel      tag) \
  (build-bar        tag) \
  (build-sms        tag) \
  (build-smtp       tag) \
  (build-ui-admin   tag) \
  (build-ui-user    tag) \
  (build-ui-web     tag) \
  (build-checkout   tag) \
  (build-gateway    tag)

# ── Docker: Push ─────────────────────────────────────────────
push service tag=version:
  docker push {{registry}}/elmariam-{{service}}:{{tag}}

push-all tag=version:
  just push auth         {{tag}}
  just push hotel        {{tag}}
  just push bar          {{tag}}
  just push sms          {{tag}}
  just push smtp         {{tag}}
  just push admin-panel  {{tag}}
  just push user-panel   {{tag}}
  just push website      {{tag}}
  just push checkout     {{tag}}
  just push api-gateway  {{tag}}

# ── Compose ───────────────────────────────────────────────────

compose-up:
  cd proxy     && docker compose -f proxy-service.yml up -d
  cd gateway   && docker compose up -d
  cd api/auth  && docker compose -f auth-service.yml up -d
  cd api/hotel && docker compose -f hotel-service.yml up -d
  cd api/bar   && docker compose -f bar-service.yml up -d
  cd ui/admin  && docker compose -f admin-panel.yml up -d
  cd ui/user   && docker compose -f user-panel.yml up -d
  cd ui/web    && docker compose up -d
  cd checkout  && docker compose -f checkout-service.yml up -d
  cd sms       && docker compose -f sms-service.yml up -d
  cd smtp      && docker compose -f smtp-service.yml up -d

compose-down:
  cd proxy     && docker compose -f proxy-service.yml down
  cd gateway   && docker compose down
  cd api/auth  && docker compose -f auth-service.yml down
  cd api/hotel && docker compose -f hotel-service.yml down
  cd api/bar   && docker compose -f bar-service.yml down
  cd ui/admin  && docker compose -f admin-panel.yml down
  cd ui/user   && docker compose -f user-panel.yml down
  cd ui/web    && docker compose down
  cd checkout  && docker compose -f checkout-service.yml down
  cd sms       && docker compose -f sms-service.yml down
  cd smtp      && docker compose -f smtp-service.yml down

# ── Network ───────────────────────────────────────────────────
create-network:
  docker network create elmariam
