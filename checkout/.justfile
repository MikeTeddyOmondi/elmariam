# List commands
default:
  just --list

# Docker build image
build-image:
  docker build -t ranckosolutionsinc/elmariam-checkout-service:1.0.0 . 

# Docker Container
start-container:
  docker run -d -p 3000:3000 --name elmariam-checkout-service ranckosolutionsinc/elmariam-checkout-service:1.0.0

# Docker compose
compose:
  docker compose -f checkout-service.yml  up -d 

# Docker compose down
compose-down:
  docker compose -f checkout-service.yml  down 

# Start RabbitMQ 
start_rabbitmq:
  docker run -d --hostname rabbitmq --name rabbitmq -e RABBITMQ_DEFAULT_USER=user -e RABBITMQ_DEFAULT_PASS=password -p 5672:5672 -p 15672:15672 rabbitmq:3.12-management

