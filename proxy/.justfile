# Default
default:
  just --list

# Build Docker Image
build-image:
  docker build -t ranckosolutionsinc/elmariam-proxy:1.0.0 . 

# Run Docker Container
run-container:
  docker run -d -p 5000:80 --network elmariam --restart always --name elmariam-proxy ranckosolutionsinc/elmariam-proxy:1.0.0  

# Stop Docker Container
stop-container:
  docker stop elmariam-proxy   

# Remove Docker Container
rm-container:
  docker rm elmariam-proxy   

# Dispose Docker Container
dispose-container:
  just stop-Container
  just rm-container   

# Docker compose 
compose:
  docker compose -f proxy-service.yml up -d

# Docker compose down
compose-down:
  docker compose -f proxy-service.yml down

