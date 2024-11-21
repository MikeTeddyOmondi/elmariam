# Default
default:
  just --list

# Build docker image
build-image:
  docker build -t ranckosolutionsinc/elmariam-hotel-service:1.0.0 . 

# Docker compose 
compose:
  docker compose -f hotel-service.yml up -d

# Docker compose down
compose-down:
  docker compose -f hotel-service.yml down

