# Default
default:
  just --list

# Build Docker Image
build-image:
  docker build -t ranckosolutionsinc/elmariam-website:1.0.0 . 

# Run Docker Container
run-container:
  docker run -d -p 4000:3000 --network elmariam --restart always --name elmariam-website ranckosolutionsinc/elmariam-website:1.0.0  

# Docker compose 
compose:
  docker compose up -d

# Docker compose down
compose-down:
  docker compose down

