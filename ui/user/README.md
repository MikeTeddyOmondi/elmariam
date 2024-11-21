# Hotel Elmiriam | User Panel

## Build Docker Image

To build the image:
`docker build -t ranckosolutionsinc/hotel-elmariam-user-panel:v1.0.0 . `

## Run the Docker Container

To run the container using the image built:
`docker run -d -p 5000:5000 --network hotel-elmariam --restart always --name hotel-elmariam-user-panel ranckosolutionsinc/hotel-elmariam-user-panel:v1.0.0`

To run using Docker Compose (inside this directory):
`docker compose -f user-panel.yml up -d`

## .justfile

<details>
    <summary>Just commands for running the project</summary>
    <br>

    ```sh
    # Default
    default:
        just --list

    # Build Docker Image
    build-image:
        docker build -t ranckosolutionsinc/hotel-elmariam-user-panel:v1.0.0 .

    # Run Docker Container
    run-container:
        docker run -d -p 5000:5000 --network hotel-elmariam --restart always --name hotel-elmariam-user-panel ranckosolutionsinc/hotel-elmariam-user-panel:v1.0.0

    # Docker compose
    run-compose:
        docker compose -f user-panel.yml up -d

    # Docker compose down
    run-compose-down:
        docker compose -f user-panel.yml down
    ```

</details>
