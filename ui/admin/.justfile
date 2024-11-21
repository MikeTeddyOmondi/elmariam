# Default
default:
  just --list

# Build Docker Image
build-image:
  docker build -t ranckosolutionsinc/elmariam-admin-panel:v1.0.0 . 

# Run Docker Container
run-container:
  docker run -d -p 3000:3000 --network elmariam --restart always --name elmariam-admin-panel ranckosolutionsinc/elmariam-admin-panel:v1.0.0  

# Docker compose 
compose:
  docker compose -f admin-panel.yml up -d

# Docker compose down
compose-down:
  docker compose -f admin-panel.yml down

