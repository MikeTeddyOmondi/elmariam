# Auth Service

Built on Node.js.

## Build Docker Image

To build the image:
`docker build -t ranckosolutionsinc/hotel-elmariam-auth-service:1.0.0 . `

## Run the Docker Container

To run the container using the image built:
`docker run -d -p 8001:8001 --network hotel-elmariam --restart always --name hotel-elmariam-hotel-service ranckosolutionscinc/hotel-elmariam-hotel-service:v1.0-alpha`

To run using Docker Compose (inside this directory):
`docker compose -f auth-service.yml up -d`
