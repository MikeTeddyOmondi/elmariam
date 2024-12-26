# Default
default:
  just --list

# Build docker image
build-image:
  docker build -t ranckosolutionsinc/elmariam-auth-service:1.0.0 . 	  

# Docker compose 
compose:
  docker compose -f auth-service.yml up -d

# Docker compose down
compose-down:
  docker compose -f auth-service.yml down

