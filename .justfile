# Info
repository := "https://github.com/MikeTeddyOmondi/elmariam.git"
version := "1.0.0"
auth_service_version := "1.0.0"
hotel_service_version := "1.0.0"
bar_service_version := "1.0.0"
restaurant_service_version := "1.0.0"
checkout_service_version := "1.0.0"
sms_service_version := "1.0.0"
admin_panel_version := "1.0.0"
user_panel_version := "1.0.0"
website_version := "1.0.0"

# Directories
ui := "./ui/"
api := "./api/"
sms := "./sms/"
smtp := "./smtp/"
proxy := "./proxy/"
gateway := "./gateway/"
checkout := "./checkout/"

# Default
default:
  just --list

# Clone Project Git Repository
clone-repo:
  git clone {{repository}} elmariam

# Install Project Dependencies
install:
  cd "{{api}}auth" && npm install # Auth API Installation
  cd "{{api}}hotel" && npm install # Hotel API Installation
  cd "{{api}}bar" && npm install # Bar API Installation  

  cd "{{ui}}admin" && npm install # Admin UI Installation
  cd "{{ui}}user" && npm install # User Panel UI Installation
  cd "{{ui}}web" && npm install # Website Installation
  
  cd "{{checkout}}" && bun install # Checkout Service Installation
  cd "{{smtp}}" && npm install # SMTP Service Installation
  cd "{{sms}}" && npm install # SMS Service Installation

# Build docker image
build-image:
  docker build -t ranckosolutionsinc/elmariam-auth-service:{{auth_service_version}} "{{api}}auth"
  docker build -t ranckosolutionsinc/elmariam-hotel-service:{{hotel_service_version}} "{{api}}hotel"
  docker build -t ranckosolutionsinc/elmariam-bar-service:{{bar_service_version}} "{{api}}bar"
  docker build -t ranckosolutionsinc/elmariam-checkout-service:{{checkout_service_version}} "{{checkout}}"
  docker build -t ranckosolutionsinc/elmariam-sms-service:{{sms_service_version}} "{{sms}}"
  docker build -t ranckosolutionsinc/elmariam-admin-panel:{{admin_panel_version}} "{{ui}}admin"
  docker build -t ranckosolutionsinc/elmariam-user-panel:{{user_panel_version}} "{{ui}}user"
  docker build -t ranckosolutionsinc/elmariam-website:{{website_version}} "{{ui}}web"

# Create Docker Network
create-network:
  docker network create elmariam

# Docker compose 
compose:
  cd "{{proxy}}" && docker compose -f proxy-service.yml up -d # Proxy Compose Stack
  cd "{{gateway}}" && docker compose up -d # Gateway Compose Stack
  
  cd "{{api}}auth" && docker compose -f auth-service.yml up -d # Auth Compose Stack
  cd "{{api}}hotel" && docker compose -f hotel-service.yml up -d # Hotel Compose Stack
  cd "{{api}}bar" && docker compose -f bar-service.yml up -d # Bar Compose Stack

  cd "{{ui}}admin" && docker compose -f admin-panel.yml up -d # Admin UI Compose Stack
  cd "{{ui}}user" && docker compose -f user-panel.yml up -d # User Panel UI Compose Stack
  cd "{{ui}}web" && docker compose up -d # Website Compose Stack
  
  cd "{{checkout}}" && docker compose -f checkout-service.yml up -d # Checkout Service Compose Stack
  cd "{{sms}}" && docker compose -f sms-service.yml up -d # SMS Service Compose Stack
compose-rest:
  cd "{{smtp}}" &&  docker compose -f smtp-service.yml up -d # SMTP Service Compose Stack

# Docker compose down
compose-down:
  cd "{{proxy}}" && docker compose -f proxy-service.yml down # Proxy Compose Stack
  cd "{{gateway}}" && docker compose down # Gateway Compose Stack

  cd "{{api}}auth" && docker compose -f auth-service.yml down # Auth Compose Stack
  cd "{{api}}hotel" && docker compose -f hotel-service.yml down # Hotel Compose Stack
  cd "{{api}}bar" && docker compose -f bar-service.yml down # Bar Compose Stack

  cd "{{ui}}admin" && docker compose -f admin-panel.yml down # Admin UI Compose Stack
  cd "{{ui}}user" && docker compose -f user-panel.yml down # User Panel UI Compose Stack
  cd "{{ui}}web" && docker compose down # Website Compose Stack
  
  cd "{{checkout}}" && docker compose -f checkout-service.yml down # Checkout Service Compose Stack
  cd "{{sms}}" && docker compose -f sms-service.yml down # SMS Service Compose Stack
compose-down-rest:  
  cd "{{smtp}}" &&  docker compose -f smtp-service.yml down # SMTP Service Compose Stack






