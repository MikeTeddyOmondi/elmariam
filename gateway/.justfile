# Default
default:
  just --list

# Build Docker image
build-image:
  docker build -t ranckosolutionsinc/elmariam-api-gateway:1.0.0 .

# Docker compose 
compose:
  docker compose up -d

# Docker compose down
compose-down:
  docker compose down
