# Mpesa Service

Start a RabbitMQ instance
```sh
docker run -d --hostname rabbitmq --name rabbitmq -e RABBITMQ_DEFAULT_USER=user -e RABBITMQ_DEFAULT_PASS=password -p 5672:5672 -p 15672:15672 rabbitmq:3.12-management
```

## Sandbox Testing Keys

URL: https://sandbox.intasend.com/account/api-keys/

## Production Live Keys

URL: https://payment.intasend.com/account/api-keys/
