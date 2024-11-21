# Default
default:
  just --list

# Build Docker Image
build-image:
  docker build -t ranckosolutionsinc/elmariam-user-panel:1.0.0 . 

# Run Docker Container
run-container:
  docker run -d -p 5000:5000 --network elmariam --restart always --name elmariam-user-panel ranckosolutionsinc/elmariam-user-panel:1.0.0  

# Docker compose 
compose:
  docker compose -f user-panel.yml up -d

# Docker compose down
compose-down:
  docker compose -f user-panel.yml down

