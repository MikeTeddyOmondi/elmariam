# Hotel Elmiriam | Website

## Build Docker Image

To build the image:
`docker build -t ranckosolutionsinc/hotel-elmariam-website:v1.0.0 . `

## Run the Docker Container

To run the container using the image built:
`docker run -d -p 4000:4000 --network hotel-elmariam --restart always --name hotel-elmariam-website ranckosolutionsinc/hotel-elmariam-website:v1.0.0`

To run using Docker Compose (inside this directory):
`docker compose up -d`
