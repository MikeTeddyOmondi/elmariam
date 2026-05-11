# Changelog

All notable changes to the El'Mariam rewrite are documented here.

## [a2261dc] feat: Task 11 — infra/gateway KrakenD config with 37 endpoints, JWT validation, CORS

- Added krakend.json: global config (port 8009, 30s timeout, CORS for *.otienoobogeandcompany.com)
- Added 15 hotel endpoints, 13 bar endpoints, 11 restaurant endpoints (all protected)
- Added 2 public endpoints: /api/public/roomtypes and /api/public/menu (no auth/validator)
- JWT validator: ES256, OpenAuth JWKS, propagate_claims with dot notation (properties.email, properties.userType)
- CRITICAL: every protected endpoint has input_headers ["x-user-id","x-user-email","x-user-type"]
- Added KrakenD Dockerfile (devopsfaith/krakend:2)
- Implements: REWRITE_SPEC.md Part 12

## [648b064] feat: Tasks 7-10 — restaurant, checkout, SMS, and SMTP services

- Task 7: Restaurant service — 11 endpoints (menu CRUD + order lifecycle pending→preparing→ready→served→cancelled), port 8005
- Task 8: Checkout service — Hono/Bun, subscribes to "mpesa" queue, calls IntaSend STK push, port 8008
- Task 9: SMS service — subscribes to "sms" queue, calls UjumbeSMS API with email+X-Authorization headers, port 7879
- Task 10: SMTP service — subscribes to "mails" queue, Gmail OAuth2 + Nodemailer + Handlebars email.hbs template, port 3300
- Implements: REWRITE_SPEC.md Parts 8, 9, 10, 11

## [a2f4e91] feat: Task 6 — services/bar with 11 endpoints, Multer+MinIO upload, bug fix fetchBarSale

- Added 11 Express routes: drinks (3), purchases (3), sales (3), lipa-mpesa (1), API info (1)
- Implemented addBarDrinks with Multer+MinIO upload, per-unit price calc (crates/pack ÷ packageQty)
- Implemented postBarPurchases with stock value calc and $set stockQty update
- Implemented postBarSales multi-item checkout with stock validation and $inc decrement
- Fixed fetchBarSale bug: was referencing undefined `saleID`, now correctly uses `salesId` param
- Added lipaNaMpesa stub that publishes to "mpesa" queue
- Implements: REWRITE_SPEC.md Part 7

## [c092348] feat: Task 5 — services/hotel with 17 Express endpoints and 14-step booking flow

- Added 17 Express routes: customers (4), bookings (3), invoices (2), rooms (5), M-Pesa/SMS (2), API info (1)
- Implemented full 14-step addBookings flow: validation, customer/roomType lookup, room availability, invoice calc (16% VAT), booking create, room marking
- Added getDatesInRange utility, initiateMpesaPayment and initiateSmsNotification RabbitMQ publishers
- Added createRoom with RoomType.rooms $push, createRoomType
- No CORS on service — KrakenD handles gateway-level CORS
- Implements: REWRITE_SPEC.md Part 6

## [5f1b706] feat: Task 4 — packages/queue with RabbitMQConfig and rabbitMQEnvFromProcess

- Added RabbitMQConfig class with exponential backoff retry (maxRetries, initialDelay, maxDelay, factor)
- Added connect, createQueue, publishToQueue, subscribeToQueue, close methods
- Added reconnect logic on connection close event
- Added rabbitMQEnvFromProcess helper to read env vars
- Implements: REWRITE_SPEC.md Part 5

## [74391d9] feat: Task 3 — packages/auth middleware + infra/openauth server

- Added infra/openauth/src/subjects.ts with valibot user subject shape
- Added infra/openauth/src/index.ts: PasswordProvider + MongoDB user lookup, Bun entry
- Added infra/openauth/Dockerfile (oven/bun:1.1-alpine, port 3100)
- Added packages/auth/src/subjects.ts (standalone copy, no circular dep on infra/)
- Added packages/auth/src/verify.ts: createClient + verifyAuth for SvelteKit apps
- Added packages/auth/src/middleware.ts: extractUser, requireAuth, requireUserType, requireReceptionist, requireBarista, requireWaiter, requireAdmin
- Implements: REWRITE_SPEC.md Part 4

## [97a84f6] feat: Task 2 — packages/db with all 11 Mongoose schemas and connection helper

- Added 11 Mongoose models: User, Customer, RoomType, Room, Booking, Invoice, Drink, BarPurchase, BarSale, MenuItem, RestaurantOrder
- User schema: expanded userType enum, removed password/resetLink/isAdmin, added openauth_subject_id
- MenuItem and RestaurantOrder are new schemas for restaurant domain
- Added connectDB helper with strictQuery=false and debug support
- Added barrel exports via src/index.ts and src/models/index.ts
- Implements: REWRITE_SPEC.md Part 3

## [c80578e] feat: Task 1 — monorepo scaffold with root config and placeholder packages

- Added pnpm-workspace.yaml covering apps/*, services/*, packages/*, infra/openauth
- Added turbo.json with build/dev/lint/typecheck/db:migrate tasks per spec
- Added root package.json with turbo scripts and pnpm@9.0.0 packageManager
- Added packages/config with tsconfig.base.json and tsconfig.node.json presets
- Added placeholder package.json files for all 6 packages, 6 services, 3 apps, infra/openauth
- Implements: REWRITE_SPEC.md Part 2
