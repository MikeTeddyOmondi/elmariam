# El'Mariam Refactor Specification

> A self-contained, multi-part specification for refactoring the El'Mariam hotel, bar, and restaurant management system from a fragmented Node.js/Express + MongoDB microservices architecture into a modern Turborepo monorepo with SvelteKit BFFs, OpenAuth, KrakenD gateway, and shared Mongoose models.

---

## Table of Contents

1. [System Overview & Current State Audit](#part-1-system-overview--current-state-audit)
2. [Monorepo Scaffold & Shared Packages](#part-2-monorepo-scaffold--shared-packages)
3. [Mongoose Schemas (packages/db)](#part-3-mongoose-schemas-packagesdb)
4. [Auth Package & OpenAuth Server](#part-4-auth-package--openauth-server)
5. [Queue Package (packages/queue)](#part-5-queue-package-packagesqueue)
6. [Hotel Service](#part-6-hotel-service)
7. [Bar Service](#part-7-bar-service)
8. [Restaurant Service (New)](#part-8-restaurant-service-new)
9. [Checkout Service](#part-9-checkout-service)
10. [SMS Service](#part-10-sms-service)
11. [SMTP Service](#part-11-smtp-service)
12. [KrakenD API Gateway](#part-12-krakend-api-gateway)
13. [SvelteKit Admin App](#part-13-sveltekit-admin-app)
14. [SvelteKit Staff App](#part-14-sveltekit-staff-app)
15. [SvelteKit Website](#part-15-sveltekit-website)
16. [Docker Compose & Infrastructure](#part-16-docker-compose--infrastructure)
17. [Justfile & Developer Workflow](#part-17-justfile--developer-workflow)
18. [Migration Strategy](#part-18-migration-strategy)

---

## Part 1: System Overview & Current State Audit

### 1.1 Architecture (Current)

```
Internet
  │
  ▼
Traefik (port 7979/8080)
  │ Host-based routing on *.otienoobogeandcompany.com
  ├─ admin-panel.* ──→ Admin Panel (Svelte SPA, port 3000)
  ├─ user-panel.*  ──→ User Panel (Svelte SPA, port 5000)
  ├─ gateway.*     ──→ KrakenD (port 8009)
  ├─ s3.*          ──→ MinIO API (port 9003→9000)
  └─ minio.*       ──→ MinIO Console (port 9001)

KrakenD (port 8009)
  │ Routes /api/auth/*, /api/hotel/*, /api/bar/*
  ├─ /api/auth/*   ──→ Auth Service (port 8000)
  ├─ /api/hotel/*  ──→ Hotel Service (port 8003)
  └─ /api/bar/*    ──→ Bar Service (port 8004)

RabbitMQ (port 5672, management 15672)
  │ Queues: "mpesa", "sms", "mails"
  ├─ "mpesa" ──→ Checkout Service (port 8008, Bun/Hono)
  ├─ "sms"   ──→ SMS Service (port 7879)
  └─ "mails" ──→ SMTP Service (port 3300)

MongoDB 4.2 (port 27017)
  ├─ auth database
  ├─ hotel database
  └─ bar database

MinIO (S3-compatible, port 9000/9001)
  └─ bucket: hotel-elmariam
```

All services are on a shared external Docker bridge network named `elmariam`.

### 1.2 Architecture (Target)

```
Internet
  │
  ▼
Traefik (port 7979/8080)
  │ Host-based routing on *.otienoobogeandcompany.com
  ├─ admin-panel.*  ──→ Admin App (SvelteKit, port 3000)
  ├─ staff-panel.*  ──→ Staff App (SvelteKit, port 3001)
  ├─ (root domain)  ──→ Website (SvelteKit, port 3002)
  ├─ auth.*         ──→ OpenAuth Server (port 3100)
  ├─ gateway.*      ──→ KrakenD (port 8009)
  ├─ s3.*           ──→ MinIO API (port 9003→9000)
  └─ minio.*        ──→ MinIO Console (port 9001)

KrakenD (port 8009)
  │ Validates JWT via OpenAuth JWKS
  │ Propagates claims as x-user-* headers
  ├─ /api/hotel/*      ──→ Hotel Service (port 8003)
  ├─ /api/bar/*        ──→ Bar Service (port 8004)
  └─ /api/restaurant/* ──→ Restaurant Service (port 8005)

RabbitMQ (port 5672)
  ├─ "mpesa" ──→ Checkout Service (port 8008)
  ├─ "sms"   ──→ SMS Service (port 7879)
  └─ "mails" ──→ SMTP Service (port 3300)

MongoDB 4.2 (port 27017)
  ├─ auth database (OpenAuth storage + user profiles)
  ├─ hotel database
  ├─ bar database
  └─ restaurant database

MinIO (S3-compatible)
  └─ bucket: hotel-elmariam
```

**Key changes:**
- Auth service replaced by OpenAuth server
- No more custom JWT creation/validation in services — KrakenD handles it
- Services trust `x-user-*` headers from KrakenD, never validate tokens
- Svelte SPAs replaced by SvelteKit apps with remote functions (BFF pattern)
- User panel renamed to Staff app with role-aware workspaces
- Website gains customer self-service features
- Restaurant service added
- Mongoose schemas shared via `@elmariam/db` package
- RabbitMQ config shared via `@elmariam/queue` package

### 1.3 Service Inventory (Current → Target)

| Current | Port | Status | Target |
|---------|------|--------|--------|
| Auth Service (Express) | 8000 | **REMOVED** | Replaced by OpenAuth server at port 3100 |
| Hotel Service (Express) | 8003 | Refactored | Keep Express, use shared packages, trust gateway headers |
| Bar Service (Express) | 8004 | Refactored | Keep Express, use shared packages, trust gateway headers |
| Restaurant Service | — | Stub | **NEW** Express service at port 8005 |
| Checkout Service (Hono/Bun) | 8008 | Refactored | Keep Hono/Bun, use shared queue package |
| SMS Service (Express) | 7879 | Refactored | Use shared queue package |
| SMTP Service (Express) | 3300 | Refactored | Use shared queue package |
| KrakenD | 8009 | Reconfigured | OpenAuth JWKS validation, claim propagation |
| Admin Panel (Svelte SPA) | 3000 | **REPLACED** | SvelteKit admin app |
| User Panel (Svelte SPA) | 5000 | **REPLACED** | SvelteKit staff app at port 3001 |
| Website | — | **REPLACED** | SvelteKit website at port 3002 |

### 1.4 User Roles (Current → Target)

**Current:**
- `userType` enum: `"customer"`, `"staff"`, `"management"`
- `isAdmin` boolean flag on User model
- Auth service creates JWT with `{ id, userType, isAdmin }`
- Hotel service has `verifyToken`, `verifyUser`, `verifyStaff`, `verifyAdmin` middleware
- Bar service has the same middleware set

**Target:**
- `userType` enum: `"customer"`, `"receptionist"`, `"barista"`, `"waiter"`, `"management"`
- `isAdmin` removed — `"management"` userType implies admin
- OpenAuth JWT contains `{ type: "user", properties: { id, email, userType } }`
- KrakenD propagates as `x-user-id`, `x-user-email`, `x-user-type` headers
- Services read headers, apply role-based access per endpoint

**App access by role:**

| Role | Admin App | Staff App | Website |
|------|-----------|-----------|---------|
| management | Full access | Full access (all workspaces) | N/A |
| receptionist | No access | Hotel workspace only | N/A |
| barista | No access | Bar workspace only | N/A |
| waiter | No access | Restaurant workspace only | N/A |
| customer | No access | No access | Self-service portal |

### 1.5 Environment Variables Audit

Extracted from all `.env.sample` files:

**Shared across services:**
```
REFRESH_SECRET          → REMOVED (OpenAuth handles tokens)
ACCESS_SECRET           → REMOVED (OpenAuth handles tokens)
NODE_ENV                → Retained
```

**Per-service:**
```
# Hotel Service
DB_URL=mongodb://mongo:27017/hotel
AUTH_API_URL=http://auth:8000     → REMOVED (no more auth service calls)
PORT=8003
RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USERNAME, RABBITMQ_PASSWORD, RABBITMQ_VHOST

# Bar Service
DB_URL=mongodb://mongo:27017/bar
AUTH_API_URL=http://auth:8000     → REMOVED
PORT=8004
RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USERNAME, RABBITMQ_PASSWORD, RABBITMQ_VHOST
MINIO_API_HOST, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, S3_HOSTNAME
CLOUDINARY_CLOUDNAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET  → REMOVED (MinIO only)

# Checkout Service
PORT=8008
RABBITMQ_URL, RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USERNAME, RABBITMQ_PASSWORD, RABBITMQ_VHOST
INTASEND_API_TOKEN, INTASEND_PUBLISHABLE_KEY, INTASEND_TEST_MODE

# SMS Service
PORT=7879
DB_URL=mongodb://... → REMOVED (SMS service doesn't need a DB)
RABBITMQ_URL, RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USERNAME, RABBITMQ_PASSWORD, RABBITMQ_VHOST
UJUMBESMS_API_KEY, UJUMBESMS_API_URL, UJUMBESMS_ACCOUNT_EMAIL

# SMTP Service
PORT=3300
RABBITMQ_URL
EMAIL_SENDER, CLIENT_SECRET, CLIENT_ID, G_RFR_TKN, G_ACC_TKN

# OpenAuth (NEW)
PORT=3100
OPENAUTH_ISSUER=https://auth.otienoobogeandcompany.com
DB_URL=mongodb://mongo:27017/auth
```

---

## Part 2: Monorepo Scaffold & Shared Packages

### 2.1 Directory Structure

```
elmariam/
├── apps/
│   ├── admin/                 # SvelteKit — management dashboard
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── remote/
│   │   │   │   │   ├── users.remote.ts
│   │   │   │   │   ├── hotel.remote.ts
│   │   │   │   │   ├── bar.remote.ts
│   │   │   │   │   ├── restaurant.remote.ts
│   │   │   │   │   └── analytics.remote.ts
│   │   │   │   ├── server/
│   │   │   │   │   └── auth.ts        # OpenAuth verify helper
│   │   │   │   └── components/        # shadcn-svelte components
│   │   │   └── routes/
│   │   │       ├── +layout.svelte
│   │   │       ├── +page.svelte        # Dashboard
│   │   │       ├── login/
│   │   │       ├── users/
│   │   │       ├── customers/
│   │   │       ├── bookings/
│   │   │       ├── rooms/
│   │   │       ├── room-types/
│   │   │       ├── bar-drinks/
│   │   │       ├── bar-purchases/
│   │   │       ├── bar-sales/
│   │   │       ├── menu-items/
│   │   │       └── restaurant-orders/
│   │   ├── svelte.config.js
│   │   ├── vite.config.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── staff/                 # SvelteKit — staff operations panel
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── remote/
│   │   │   │   │   ├── hotel.remote.ts
│   │   │   │   │   ├── bar.remote.ts
│   │   │   │   │   └── restaurant.remote.ts
│   │   │   │   ├── server/
│   │   │   │   │   └── auth.ts
│   │   │   │   └── components/
│   │   │   └── routes/
│   │   │       ├── +layout.svelte      # Role-aware sidebar
│   │   │       ├── +page.svelte        # Role-based redirect
│   │   │       ├── login/
│   │   │       ├── receptionist/
│   │   │       │   ├── +page.svelte    # Receptionist dashboard
│   │   │       │   ├── customers/
│   │   │       │   ├── bookings/
│   │   │       │   ├── rooms/
│   │   │       │   └── invoices/
│   │   │       ├── barista/
│   │   │       │   ├── +page.svelte    # Barista dashboard
│   │   │       │   ├── drinks/
│   │   │       │   ├── purchases/
│   │   │       │   └── sales/
│   │   │       └── waiter/
│   │   │           ├── +page.svelte    # Waiter dashboard
│   │   │           ├── menu/
│   │   │           ├── orders/
│   │   │           └── tables/
│   │   ├── svelte.config.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── website/               # SvelteKit — public + customer self-service
│       ├── src/
│       │   ├── lib/
│       │   │   ├── remote/
│       │   │   │   ├── booking.remote.ts
│       │   │   │   └── account.remote.ts
│       │   │   ├── server/
│       │   │   │   └── auth.ts
│       │   │   └── components/
│       │   └── routes/
│       │       ├── +layout.svelte
│       │       ├── +page.svelte        # Home/hero
│       │       ├── rooms/              # Public room showcase
│       │       ├── restaurant/         # Public menu preview
│       │       ├── contact/
│       │       ├── about/
│       │       ├── login/
│       │       ├── register/
│       │       └── portal/             # Authenticated customer area
│       │           ├── +layout.svelte  # Auth guard
│       │           ├── bookings/       # My bookings
│       │           ├── invoices/       # My invoices
│       │           └── profile/
│       ├── svelte.config.js
│       ├── Dockerfile
│       └── package.json
│
├── services/
│   ├── hotel/                 # Express — hotel domain
│   ├── bar/                   # Express — bar domain
│   ├── restaurant/            # Express — restaurant domain (NEW)
│   ├── checkout/              # Hono/Bun — M-Pesa STK push consumer
│   ├── sms/                   # Express — UjumbeSMS consumer
│   └── smtp/                  # Express — Gmail OAuth2 consumer
│
├── packages/
│   ├── db/                    # @elmariam/db — Mongoose models + connection
│   ├── auth/                  # @elmariam/auth — OpenAuth helpers
│   ├── queue/                 # @elmariam/queue — RabbitMQ config class
│   ├── types/                 # @elmariam/types — Shared TS types
│   ├── ui/                    # @elmariam/ui — Shared Svelte components
│   └── config/                # @elmariam/config — ESLint, TSConfig presets
│
├── infra/
│   ├── openauth/              # OpenAuth server
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── subjects.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── gateway/
│   │   ├── krakend.json
│   │   └── Dockerfile
│   └── proxy/
│       └── proxy-service.yml
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .justfile
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .env.sample
```

### 2.2 Root Configuration Files

**pnpm-workspace.yaml:**
```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
  - "infra/openauth"
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", ".svelte-kit/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

**Root package.json:**
```json
{
  "name": "elmariam",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### 2.3 Shared TypeScript Config (packages/config)

**packages/config/tsconfig.base.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**packages/config/tsconfig.node.json:**
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist"
  }
}
```

---

## Part 3: Mongoose Schemas (packages/db)

> All schemas below are extracted directly from the existing codebase with minimal changes. The only schema removed is `Token` (OpenAuth handles token storage). The `User` schema retains profile fields but drops `password` and `resetLink` (OpenAuth handles credentials). New schemas are added for the restaurant domain.

### 3.1 Package Structure

```
packages/db/
├── src/
│   ├── connection.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Customer.ts
│   │   ├── Booking.ts
│   │   ├── Invoice.ts
│   │   ├── Room.ts
│   │   ├── RoomType.ts
│   │   ├── Drink.ts
│   │   ├── BarPurchase.ts
│   │   ├── BarSale.ts
│   │   ├── MenuItem.ts
│   │   ├── RestaurantOrder.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**package.json:**
```json
{
  "name": "@elmariam/db",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "mongoose": "^6.2.10"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### 3.2 Connection Helper

**src/connection.ts:**
```typescript
import mongoose from "mongoose";

interface ConnectOptions {
  url: string;
  debug?: boolean;
}

export async function connectDB({ url, debug = false }: ConnectOptions) {
  mongoose.set("strictQuery", false);

  if (debug) {
    mongoose.set("debug", true);
  }

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`> Connected to MongoDB: ${url.split("@").pop()}`);
}

export { mongoose };
```

### 3.3 User Schema

> **Changes from current:** Removed `password` field (OpenAuth handles credentials). Removed `resetLink` field. Expanded `userType` enum from `["customer", "staff", "management"]` to `["customer", "receptionist", "barista", "waiter", "management"]`. Removed `isAdmin` field (management userType implies admin). Added `openauth_subject_id` to link to OpenAuth subject.

**src/models/User.ts:**
```typescript
import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  id_number: string;
  phone_number?: number;
  userType: "customer" | "receptionist" | "barista" | "waiter" | "management";
  openauth_subject_id?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    firstname: { type: String, required: false, default: "" },
    lastname: { type: String, required: false, default: "" },
    email: { type: String, required: true },
    id_number: { type: String, required: true, unique: true },
    phone_number: { type: Number, required: false },
    userType: {
      type: String,
      enum: ["customer", "receptionist", "barista", "waiter", "management"],
      required: true,
    },
    openauth_subject_id: { type: String, required: false },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
```

### 3.4 Customer Schema

> **Unchanged from current.**

**src/models/Customer.ts:**
```typescript
import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
  firstname: string;
  lastname: string;
  id_number: string;
  email: string;
  phone_number?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    id_number: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: Number, required: false },
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", CustomerSchema);
```

### 3.5 RoomType Schema

> **Unchanged from current.** Retains the nested `reservations` structure with `bookingRef` array and `unavailableDates` array. Virtual `room` and `booking` references kept.

**src/models/RoomType.ts:**
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface IRoomType extends Document {
  title: string;
  description: string;
  rate: number;
  capacity: number;
  roomType: "single" | "double";
  rooms: Types.ObjectId[];
  reservations: {
    bookingRef: Types.ObjectId[];
    unavailableDates: Date[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    rate: { type: Number, required: true },
    capacity: { type: Number, required: true },
    roomType: {
      type: String,
      enum: ["single", "double"],
      unique: true,
      required: true,
    },
    rooms: { type: [Schema.Types.ObjectId] },
    reservations: {
      bookingRef: { type: [Schema.Types.ObjectId] },
      unavailableDates: { type: [Date] },
    },
  },
  { timestamps: true }
);

RoomTypeSchema.virtual("room", {
  ref: "Room",
  localField: "rooms",
  foreignField: "_id",
  justOne: false,
});

RoomTypeSchema.virtual("booking", {
  ref: "Booking",
  localField: "reservations.bookingRef",
  foreignField: "_id",
  justOne: true,
});

export const RoomType = model<IRoomType>("RoomType", RoomTypeSchema);
```

### 3.6 Room Schema

> **Unchanged from current.**

**src/models/Room.ts:**
```typescript
import { Schema, model, Document } from "mongoose";

export interface IRoom extends Document {
  number: string;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    number: { type: String, required: true, unique: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Room = model<IRoom>("Room", RoomSchema);
```

### 3.7 Booking Schema

> **Unchanged from current.** References Customer, RoomType, and Invoice via ObjectId. Virtuals for `occupant`, `room-type`, and `invoice`.

**src/models/Booking.ts:**
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface IBooking extends Document {
  customer: Types.ObjectId;
  numberAdults: number;
  numberKids: number;
  roomType: Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  invoiceRef: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    numberAdults: { type: Number, required: true },
    numberKids: { type: Number, required: true },
    roomType: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RoomType",
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    invoiceRef: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Invoice",
    },
  },
  { timestamps: true }
);

BookingSchema.virtual("occupant", {
  ref: "Customer",
  localField: "customer",
  foreignField: "_id",
  justOne: true,
});

BookingSchema.virtual("room-type", {
  ref: "RoomType",
  localField: "roomType",
  foreignField: "_id",
  justOne: true,
});

BookingSchema.virtual("invoice", {
  ref: "Invoice",
  localField: "invoiceRef",
  foreignField: "_id",
  justOne: true,
});

export const Booking = model<IBooking>("Booking", BookingSchema);
```

### 3.8 Invoice Schema

> **Unchanged from current.**

**src/models/Invoice.ts:**
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface IInvoice extends Document {
  bookingRef: Types.ObjectId;
  status: "paid" | "pending";
  paymentMethod: "cash" | "mpesa" | "bank";
  vat: number;
  subTotalCost: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    bookingRef: { type: Schema.Types.ObjectId, ref: "Booking" },
    status: {
      type: String,
      enum: ["paid", "pending"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "bank"],
      required: true,
    },
    vat: { type: Number, required: true },
    subTotalCost: { type: Number, required: true },
    totalCost: { type: Number, required: true },
  },
  { timestamps: true }
);

InvoiceSchema.virtual("booking", {
  ref: "Booking",
  localField: "bookingRef",
  foreignField: "_id",
  justOne: true,
});

export const Invoice = model<IInvoice>("Invoice", InvoiceSchema);
```

### 3.9 Drink Schema

> **Unchanged from current.** All pricing fields retained: `buyingPrice` (per unit), `sellingPrice` (per unit), `buyingStockPrice` (per package), `sellingStockPrice` (per package).

**src/models/Drink.ts:**
```typescript
import { Schema, model, Document } from "mongoose";

export interface IDrink extends Document {
  drinkName: string;
  drinkCode: string;
  typeOfDrink: "spirit" | "beer" | "rtd" | "wine" | "water";
  uom: "bottles" | "crates" | "pack";
  packageQty: number;
  buyingPrice: number;
  sellingPrice: number;
  buyingStockPrice: number;
  sellingStockPrice: number;
  stockQty: number;
  inStock: boolean;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const DrinkSchema = new Schema<IDrink>(
  {
    drinkName: { type: String, required: true },
    drinkCode: { type: String, unique: true, required: true },
    typeOfDrink: {
      type: String,
      enum: ["spirit", "beer", "rtd", "wine", "water"],
      required: true,
    },
    uom: {
      type: String,
      enum: ["bottles", "crates", "pack"],
      required: true,
    },
    packageQty: { type: Number, required: true },
    buyingPrice: { type: Number, required: false, default: 0 },
    sellingPrice: { type: Number, required: false, default: 0 },
    buyingStockPrice: { type: Number, required: true },
    sellingStockPrice: { type: Number, required: true },
    stockQty: { type: Number, default: 0 },
    inStock: { type: Boolean, default: false },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const Drink = model<IDrink>("Drink", DrinkSchema);
```

### 3.10 BarPurchase Schema

> **Unchanged from current.**

**src/models/BarPurchase.ts:**
```typescript
import { Schema, model, Document, Types } from "mongoose";

export interface IBarPurchase extends Document {
  receiptNumber: string;
  product: Types.ObjectId;
  quantity: number;
  stockValue: number;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
}

const BarPurchaseSchema = new Schema<IBarPurchase>(
  {
    receiptNumber: { type: String, required: true },
    product: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Drink",
    },
    quantity: { type: Number, required: true },
    stockValue: { type: Number, required: true },
    supplier: { type: String, required: true },
  },
  { timestamps: true }
);

BarPurchaseSchema.virtual("drink", {
  ref: "Drink",
  localField: "product",
  foreignField: "_id",
  justOne: true,
});

export const BarPurchase = model<IBarPurchase>("BarPurchase", BarPurchaseSchema);
```

### 3.11 BarSale Schema

> **Unchanged from current.** Embedded `drinks` array with `productID`, `qtyBought`, `stockValue`. `totalStockValue` has a `default` function that sums `drinks[].stockValue`.

**src/models/BarSale.ts:**
```typescript
import { Schema, model, Document, Types } from "mongoose";

interface BarSaleDrink {
  productID: Types.ObjectId;
  qtyBought: number;
  stockValue: number;
}

export interface IBarSale extends Document {
  customer?: Types.ObjectId;
  drinks: BarSaleDrink[];
  totalStockValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const BarSaleSchema = new Schema<IBarSale>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    drinks: [
      {
        _id: false,
        productID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Drink",
        },
        qtyBought: { type: Number, required: true },
        stockValue: { type: Number, required: true },
      },
    ],
    totalStockValue: {
      type: Number,
      default: function (this: IBarSale) {
        return this.drinks.reduce((prev, cur) => prev + cur.stockValue, 0);
      },
    },
  },
  { timestamps: true }
);

BarSaleSchema.virtual("drinksBought", {
  ref: "Drink",
  localField: "drinks.productID",
  foreignField: "_id",
  justOne: true,
});

export const BarSale = model<IBarSale>("BarSale", BarSaleSchema);
```

### 3.12 MenuItem Schema (NEW)

**src/models/MenuItem.ts:**
```typescript
import { Schema, model, Document } from "mongoose";

export interface IMenuItem extends Document {
  name: string;
  description?: string;
  category: "appetizer" | "main" | "dessert" | "beverage" | "side";
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    category: {
      type: String,
      enum: ["appetizer", "main", "dessert", "beverage", "side"],
      required: true,
    },
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, required: false },
  },
  { timestamps: true }
);

export const MenuItem = model<IMenuItem>("MenuItem", MenuItemSchema);
```

### 3.13 RestaurantOrder Schema (NEW)

**src/models/RestaurantOrder.ts:**
```typescript
import { Schema, model, Document, Types } from "mongoose";

interface OrderItem {
  menuItem: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IRestaurantOrder extends Document {
  customer?: Types.ObjectId;
  tableNumber?: string;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  items: OrderItem[];
  totalAmount: number;
  paymentMethod?: "cash" | "mpesa" | "bank";
  paymentStatus: "pending" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantOrderSchema = new Schema<IRestaurantOrder>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    tableNumber: { type: String, required: false },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
      required: true,
    },
    items: [
      {
        _id: false,
        menuItem: {
          type: Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      default: function (this: IRestaurantOrder) {
        return this.items.reduce((prev, cur) => prev + cur.subtotal, 0);
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "bank"],
      required: false,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

RestaurantOrderSchema.virtual("orderCustomer", {
  ref: "Customer",
  localField: "customer",
  foreignField: "_id",
  justOne: true,
});

export const RestaurantOrder = model<IRestaurantOrder>(
  "RestaurantOrder",
  RestaurantOrderSchema
);
```

### 3.14 Barrel Exports

**src/models/index.ts:**
```typescript
export { User, type IUser } from "./User";
export { Customer, type ICustomer } from "./Customer";
export { RoomType, type IRoomType } from "./RoomType";
export { Room, type IRoom } from "./Room";
export { Booking, type IBooking } from "./Booking";
export { Invoice, type IInvoice } from "./Invoice";
export { Drink, type IDrink } from "./Drink";
export { BarPurchase, type IBarPurchase } from "./BarPurchase";
export { BarSale, type IBarSale } from "./BarSale";
export { MenuItem, type IMenuItem } from "./MenuItem";
export { RestaurantOrder, type IRestaurantOrder } from "./RestaurantOrder";
```

**src/index.ts:**
```typescript
export { connectDB, mongoose } from "./connection";
export * from "./models";
```

---

## Part 4: Auth Package & OpenAuth Server

### 4.1 OpenAuth Server (infra/openauth)

**infra/openauth/src/subjects.ts:**
```typescript
import { object, string } from "valibot";

export const subjects = {
  user: object({
    id: string(),
    email: string(),
    userType: string(), // "customer" | "receptionist" | "barista" | "waiter" | "management"
  }),
};
```

**infra/openauth/src/index.ts:**
```typescript
import { authorizer } from "@openauthjs/openauth";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { subjects } from "./subjects";
import { connectDB } from "@elmariam/db";
import { User } from "@elmariam/db";
import bcryptjs from "bcryptjs";

const PORT = process.env.PORT || 3100;
const DB_URL = process.env.DB_URL || "mongodb://mongo:27017/auth";

await connectDB({ url: DB_URL });

const app = authorizer({
  subjects,
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          // In production: send code via email/SMS
          // For now, log it
          console.log(`[OpenAuth] Code for ${email}: ${code}`);
        },
      })
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      const email = value.email;

      // Look up user in MongoDB
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error(`User not found: ${email}`);
      }

      return ctx.subject("user", {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
      });
    }

    throw new Error("Unknown provider");
  },
});

export default {
  port: Number(PORT),
  fetch: app.fetch,
};
```

> **Migration note:** Existing users have bcrypt-hashed passwords in MongoDB. A one-time migration script must be created to register all existing users with OpenAuth's password provider. The `User` model retains profile data; OpenAuth only handles credentials and token issuance.

**infra/openauth/Dockerfile:**
```dockerfile
FROM oven/bun:1.1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
ENV PORT=3100
EXPOSE 3100
CMD ["bun", "run", "src/index.ts"]
```

### 4.2 Auth Shared Package (packages/auth)

```
packages/auth/
├── src/
│   ├── subjects.ts       # Re-export subjects (single source of truth)
│   ├── verify.ts         # Token verification for SvelteKit apps
│   ├── middleware.ts      # Express middleware for services (reads x-user-* headers)
│   └── index.ts
├── package.json
└── tsconfig.json
```

**src/subjects.ts:**
```typescript
// Re-export from openauth server — single source of truth
export { subjects } from "../../infra/openauth/src/subjects";
// Or duplicate if monorepo linking is tricky:
import { object, string } from "valibot";
export const subjects = {
  user: object({
    id: string(),
    email: string(),
    userType: string(),
  }),
};
```

**src/verify.ts:**
```typescript
// For SvelteKit apps — verify token from cookie/header
import { createClient } from "@openauthjs/openauth/client";
import { subjects } from "./subjects";

const OPENAUTH_ISSUER =
  process.env.OPENAUTH_ISSUER || "http://openauth:3100";

const client = createClient({
  clientID: "elmariam",
  issuer: OPENAUTH_ISSUER,
});

export async function verifyAuth(token: string) {
  const result = await client.verify(subjects, token);
  if (result.err) {
    throw new Error("Invalid token");
  }
  return result.subject; // { type: "user", properties: { id, email, userType } }
}

export { client };
```

**src/middleware.ts:**
```typescript
// For Express services behind KrakenD — reads injected headers
import { Request, Response, NextFunction } from "express";

export interface GatewayUser {
  id: string;
  email: string;
  userType: string;
}

export function extractUser(req: Request): GatewayUser | null {
  const id = req.headers["x-user-id"] as string;
  const email = req.headers["x-user-email"] as string;
  const userType = req.headers["x-user-type"] as string;

  if (!id || !userType) return null;

  return { id, email, userType };
}

// Middleware: require any authenticated user
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      data: { message: "Unauthenticated request" },
    });
  }
  (req as any).user = user;
  next();
}

// Middleware: require specific user types
export function requireUserType(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = extractUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        data: { message: "Unauthenticated request" },
      });
    }
    if (!allowed.includes(user.userType)) {
      return res.status(403).json({
        success: false,
        data: { message: "Unauthorized request" },
      });
    }
    (req as any).user = user;
    next();
  };
}

// Convenience aliases matching current codebase naming
export const requireStaff = requireUserType(
  "receptionist", "barista", "waiter", "management"
);
export const requireAdmin = requireUserType("management");
export const requireReceptionist = requireUserType("receptionist", "management");
export const requireBarista = requireUserType("barista", "management");
export const requireWaiter = requireUserType("waiter", "management");
```

**src/index.ts:**
```typescript
export { subjects } from "./subjects";
export { verifyAuth, client } from "./verify";
export {
  extractUser,
  requireAuth,
  requireUserType,
  requireStaff,
  requireAdmin,
  requireReceptionist,
  requireBarista,
  requireWaiter,
  type GatewayUser,
} from "./middleware";
```

---

## Part 5: Queue Package (packages/queue)

> Extracted from the existing `RabbitMQConfig` class (duplicated across checkout, sms, smtp services). The version below is the most complete one — from checkout and sms — with exponential backoff retry and graceful shutdown.

**packages/queue/src/index.ts:**
```typescript
import amqp, { Channel, Connection } from "amqplib";

interface RabbitMQRetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
}

interface RabbitMQEnv {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
}

export class RabbitMQConfig {
  private channel: Channel | null = null;
  private connection: Connection | null = null;
  private url: string;
  private vhost: string;
  private retryOptions: Required<RabbitMQRetryOptions>;

  constructor(env: RabbitMQEnv, retryOptions: RabbitMQRetryOptions = {}) {
    this.url = `amqp://${env.username}:${env.password}@${env.host}:${env.port}/${env.vhost}`;
    this.vhost = env.vhost;
    this.retryOptions = {
      maxRetries: retryOptions.maxRetries ?? 5,
      initialDelay: retryOptions.initialDelay ?? 1000,
      maxDelay: retryOptions.maxDelay ?? 30000,
      factor: retryOptions.factor ?? 2,
    };
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number) {
    const delay =
      this.retryOptions.initialDelay *
      Math.pow(this.retryOptions.factor, attempt);
    return Math.min(delay, this.retryOptions.maxDelay);
  }

  async connect() {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.retryOptions.maxRetries; attempt++) {
      try {
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();

        this.connection.on("error", (err) => {
          console.error(`❌  RabbitMQ connection error: ${err.message}`);
        });

        this.connection.on("close", () => {
          console.log(
            `⚠️  RabbitMQ connection closed. Attempting to reconnect...`
          );
          this.reconnect();
        });

        console.log(`✅  Connected to RabbitMQ server!`);
        return;
      } catch (error: any) {
        lastError = error;
        const delay = this.calculateDelay(attempt);

        console.log(
          `❌  Failed to connect to RabbitMQ (attempt ${attempt + 1}/${this.retryOptions.maxRetries}): ${error.message}`
        );

        if (attempt < this.retryOptions.maxRetries - 1) {
          console.log(`⏳  Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(
      `❌  Failed to connect to RabbitMQ after ${this.retryOptions.maxRetries} attempts`
    );
    throw lastError;
  }

  private async reconnect() {
    this.channel = null;
    this.connection = null;
    await this.sleep(this.retryOptions.initialDelay);
    await this.connect();
  }

  async createQueue(queueName: string, options?: amqp.Options.AssertQueue) {
    await this.channel!.assertQueue(queueName, options);
  }

  async publishToQueue(queueName: string, message: string) {
    this.channel!.sendToQueue(queueName, Buffer.from(message));
    console.log(
      `✅  Sent message to ${queueName} queue in ${this.vhost} virtual host`
    );
  }

  async subscribeToQueue(
    queueName: string,
    callback: (message: string) => void | Promise<void>,
    options?: amqp.Options.Consume
  ) {
    await this.channel!.consume(
      queueName,
      (msg) => {
        if (msg) {
          const message = msg.content.toString();
          callback(message);
          this.channel!.ack(msg);
        }
      },
      options
    );
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

// Helper to build env from process.env
export function rabbitMQEnvFromProcess(): RabbitMQEnv {
  return {
    host: process.env.RABBITMQ_HOST || "localhost",
    port: parseInt(process.env.RABBITMQ_PORT || "5672"),
    username: process.env.RABBITMQ_USERNAME || "user",
    password: process.env.RABBITMQ_PASSWORD || "password",
    vhost: process.env.RABBITMQ_VHOST || "/",
  };
}
```

**packages/queue/package.json:**
```json
{
  "name": "@elmariam/queue",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "amqplib": "^0.10.3"
  },
  "devDependencies": {
    "@types/amqplib": "^0.10.4",
    "typescript": "^5.0.0"
  }
}
```

---

## Part 6: Hotel Service

### 6.1 Route Table

> Extracted from `api/hotel/src/routes/routes.js`. Every route, its HTTP method, current middleware, and target middleware after refactor.

| Method | Path | Current Middleware | Target Middleware | Controller | Description |
|--------|------|-------------------|-------------------|------------|-------------|
| GET | `/api/v1/` | `verifyToken` | `requireAuth` | `ApiInfo` | API version info |
| GET | `/api/v1/customers` | `verifyStaff` | `requireReceptionist` | `getAllCustomers` | List all customers |
| POST | `/api/v1/customers` | `verifyToken` | `requireReceptionist` | `addCustomer` | Create customer |
| GET | `/api/v1/customers/:customerid` | `verifyUser` | `requireAuth` | `getOneCustomer` | Get customer by ObjectId |
| GET | `/api/v1/customers/:idnumber` | `verifyUser` | `requireAuth` | `searchCustomer` | Search customer by ID number |
| GET | `/api/v1/bookings` | `verifyUser` | `requireAuth` | `getAllBookings` | List all bookings (populated) |
| GET | `/api/v1/bookings/:bookingid` | `verifyUser` | `requireAuth` | `getOneBooking` | Get booking by ObjectId (populated) |
| POST | `/api/v1/bookings` | `verifyToken` | `requireReceptionist` | `addBookings` | Create booking + invoice + assign room |
| GET | `/api/v1/invoices` | `verifyUser` | `requireAuth` | `getAllBookingInvoice` | List all invoices (populated) |
| GET | `/api/v1/invoices/:invoiceid` | `verifyUser` | `requireAuth` | `getBookingInvoice` | Get invoice by ObjectId |
| POST | `/api/v1/mpesa-payment/:bookingid` | `verifyUser` | `requireReceptionist` | `initiateMpesaPayment` | Publish M-Pesa STK push to RabbitMQ |
| POST | `/api/v1/sms/:bookingid` | `verifyUser` | `requireReceptionist` | `initiateSmsNotification` | Publish SMS notification to RabbitMQ |
| GET | `/api/v1/rooms` | `verifyAdmin` | `requireAdmin` | `fetchAllRooms` | List all rooms |
| GET | `/api/v1/rooms/types` | `verifyAdmin` | `requireReceptionist` | `allRoomTypes` | List all room types (populated rooms + reservations) |
| POST | `/api/v1/rooms/types` | `verifyAdmin` | `requireAdmin` | `createRoomType` | Create room type |
| POST | `/api/v1/rooms/:roomtypeid` | `verifyAdmin` | `requireAdmin` | `createRoom` | Create room, push room ID into RoomType.rooms array |
| GET | `/api/v1/rooms/:roomid` | `verifyAdmin` | `requireAdmin` | `fetchOneRoom` | Get room by ObjectId |

### 6.2 Business Logic (Extracted from Controllers)

#### Booking Creation Flow (`addBookings`)

This is the most complex controller. Step by step:

1. **Extract auth context** — currently calls `AUTH_API_URL/api/v1/user` with the access token to get the current user. **Refactor: read from `x-user-*` headers instead.**
2. **Validate required fields** — `customerId` (ID number, not ObjectId), `numberAdults`, `numberKids`, `roomType` (string: "single" or "double"), `checkInDate`, `checkOutDate`, `paymentMethod`.
3. **Validate dates:**
   - `checkInDate` must not be in the past (compared to today at midnight)
   - `checkOutDate` must be on or after `checkInDate`
4. **Lookup customer** — `Customer.findOne({ id_number: customerId })`. Returns 404 if not found.
5. **Lookup room type** — `RoomType.findOne({ roomType })`. Returns 404 if not found.
6. **Check room availability:**
   - Find all rooms with `isBooked: false`
   - Check if any of the room type's `rooms` array entries are in the unbooked set
   - If none available, return 500 "No rooms available"
7. **Select random available room** — from the filtered available rooms for this type, pick one at random index.
8. **Calculate invoice:**
   - `diffinDays` = ceil(abs(checkOutDate - checkInDate) / (1000*60*60*24))
   - If `diffinDays === 0`, treat as 1 day
   - `subTotalCost = roomType.rate * diffinDays * (numberAdults + numberKids)`
   - `vat = 0.16 * subTotalCost` (16% VAT — Kenyan tax rate)
   - `totalCost = subTotalCost + vat`
9. **Create Invoice** — status "pending", paymentMethod from request.
10. **Create Booking** — references customer, roomType ObjectId, invoice ObjectId.
11. **Set invoice.bookingRef** — back-reference to booking.
12. **Update room type availability:**
    - Calculate all dates in range (inclusive) using `getDatesInRange`
    - Push booking ObjectId into `reservations.bookingRef` array
    - Push all dates into `reservations.unavailableDates` array
13. **Mark room as booked** — `room.isBooked = true; room.save()`
14. **Save invoice and booking** — return both plus room info.

#### getDatesInRange Utility

```javascript
function getDatesInRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const date = new Date(start.getTime());
  const dates = [];
  while (date <= end) {
    dates.push(new Date(date).getTime());
    date.setDate(date.getDate() + 1);
  }
  return dates;
}
```

#### M-Pesa Payment Initiation (`initiateMpesaPayment`)

1. Find booking by ObjectId, populate customer + roomType + invoiceRef.
2. Build message: `{ first_name, last_name, email, host, amount: invoice.totalCost, phone_number, api_ref: "hotel-elmariam-booking-{bookingId}" }`
3. Connect to RabbitMQ, publish JSON to `"mpesa"` queue, close connection.

#### SMS Notification (`initiateSmsNotification`)

1. Find booking by ObjectId, populate customer + roomType + invoiceRef.
2. Build message string: `"Greetings {firstname}. Your hotel booking invoice of amount Kes. {totalCost} is due on {checkOutDate}"`
3. Build SMS payload: `{ message, phoneNumbers: "0" + phone_number.slice(3) }` (converts 254... to 0...)
4. Publish JSON to `"sms"` queue.

#### Room/RoomType Creation

- **createRoomType**: Direct `new RoomType(req.body).save()`.
- **createRoom**: `new Room(req.body)`, then `RoomType.updateOne({ _id: roomtypeid }, { $push: { rooms: newRoom._id } })`. Validates room type exists (matchedCount check).

### 6.3 CORS Origins (Current)

```javascript
origin: [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:8080",
  "https://user-panel.otienoobogeandcompany.com",
  "https://admin-panel.otienoobogeandcompany.com",
]
```

**Target:** Since services sit behind KrakenD and are never called directly from browsers, CORS can be simplified or removed from services entirely. KrakenD handles CORS at the gateway level.

---

## Part 7: Bar Service

### 7.1 Route Table

> Extracted from `api/bar/src/routes/routes.js`.

| Method | Path | Current Middleware | Target Middleware | Controller | Description |
|--------|------|-------------------|-------------------|------------|-------------|
| GET | `/api/v1/` | `verifyStaff` | `requireBarista` | `apiInfo` | API version info |
| GET | `/api/v1/drinks` | `verifyStaff` | `requireBarista` | `getBarDrinks` | List all drinks |
| POST | `/api/v1/drinks` | `verifyAdmin` | `requireAdmin` | `addBarDrinks` | Add drink (with image upload) |
| GET | `/api/v1/drinks/:id` | `verifyAdmin` | `requireBarista` | `getOneBarDrink` | Get drink by ObjectId |
| GET | `/api/v1/purchases` | `verifyAdmin` | `requireAdmin` | `getBarPurchases` | List all purchases (populated product) |
| POST | `/api/v1/purchases` | `verifyAdmin` | `requireAdmin` | `postBarPurchases` | Create purchase + update stock |
| GET | `/api/v1/purchases/:id` | `verifyAdmin` | `requireAdmin` | `getOneBarPurchase` | Get purchase by ObjectId |
| GET | `/api/v1/sales` | `verifyStaff` | `requireBarista` | `getBarSales` | List all sales (populated) |
| POST | `/api/v1/sales` | `verifyStaff` | `requireBarista` | `postBarSales` | Create bar sale (multi-item checkout) |
| GET | `/api/v1/sales/:id` | `verifyStaff` | `requireBarista` | `getOneBarSale` | Get sale by ObjectId |
| POST | `/api/v1/sales/lipa-mpesa/:id` | `verifyStaff` | `requireBarista` | `lipaNaMpesa` | M-Pesa payment for bar sale (stub) |

### 7.2 Business Logic

#### Adding Drinks (`addBarDrinks`)

1. **Multipart upload** — uses Multer with MinIO storage engine (`@namatery/multer-minio`). Field name: `"file"`. Only images allowed (checks `mimetype.split("/")[0] === "image"`).
2. **Validate fields** — `drinkName`, `drinkCode`, `typeOfDrink`, `uom`, `packageQty`, `buyingPrice`, `sellingPrice`.
3. **Validate enums:**
   - `typeOfDrink` must be one of: `"spirit"`, `"beer"`, `"rtd"`, `"wine"`, `"water"`
   - `uom` must be one of: `"bottles"`, `"crates"`, `"pack"`
4. **Check unique drink code** — `searchDrink(drinkCode)` returns null if not found.
5. **Build image URL** — `https://${S3_HOSTNAME}/${BUCKET_NAME}/${path}` where `path` comes from Multer's file object. Bucket name is `"hotel-elmariam"`.
6. **Calculate per-unit prices:**
   - If `uom` is `"crates"` or `"pack"`: `buyingPrice = bodyBuyingPrice / packageQty`, `sellingPrice = bodySellingPrice / packageQty`
   - If `uom` is `"bottles"`: prices are used as-is
   - The original body prices are stored as `buyingStockPrice` and `sellingStockPrice` (per-package prices)
7. **Save drink** with all fields.

#### Bar Purchases (`postBarPurchases`)

1. **Validate fields** — `receiptNumber`, `product` (ObjectId), `quantity`, `supplier`.
2. **Find product** — `findDrink(product)` by ObjectId.
3. **Calculate stock value:**
   - If `uom === "bottles"`: `stockValue = buyingStockPrice * quantity`
   - If `uom === "crates"`: `stockValue = buyingStockPrice * (quantity / 24)`
4. **Save purchase** — creates `BarPurchase` document.
5. **Update stock quantity** — `Drink.updateOne({ _id }, { $set: { inStock: true, stockQty: current + quantity } })`

#### Bar Sales / Checkout (`postBarSales`)

1. **Input** — `{ checkoutDrinkItems: [{ drinkId, quantity }, ...] }`
2. **Fetch all drink details** — `Promise.all` over `findDrink` for each item.
3. **Calculate total & check stock:**
   - For each checkout item, find matching drink
   - If `drinkFound.stockQty >= checkoutItem.quantity`: add `sellingPrice * quantity` to total
   - If insufficient stock: record stock issue
4. **If any stock issues** — return 500 "Out of stock or insufficient stock!"
5. **Build sale details** — array of `{ productID, qtyBought, stockValue }` for each drink
6. **Create BarSale** — push drinks array, set totalStockValue
7. **Update stock quantities** — `Drink.updateOne({ _id: drinkId }, { $inc: { stockQty: -quantity } })` for each item
8. **Return** — `{ message, totalStockValue, salesId }`

#### MinIO Configuration

```javascript
const minioClient = new Client({
  endPoint: MINIO_API_HOST,  // e.g. "s3.otienoobogeandcompany.com"
  port: 9000,
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

const minioStorageEngineOptions = {
  path: "photos",
  region: "us-east-1",
  bucket: { init: true, versioning: false, forceDelete: false },
  object: {
    name: (req, file) => file.originalname,
    useOriginalFilename: false,
  },
};
```

**MinIO S3 bucket policy (public read):**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Action": ["s3:GetObject"],
    "Effect": "Allow",
    "Principal": { "AWS": ["*"] },
    "Resource": ["arn:aws:s3:::hotel-elmariam/*"]
  }]
}
```

### 7.3 Known Bug in Current Code

In `bar.service.js`, the `fetchBarSale` function references `saleID` (camelCase) but the parameter is `salesId`:

```javascript
fetchBarSale: async (salesId) => {
  // BUG: uses `saleID` (undefined) instead of `salesId`
  await BarSale.find({ _id: saleID }) // <-- should be salesId
```

Fix this in the refactor.

---

## Part 8: Restaurant Service (New)

### 8.1 Route Table

| Method | Path | Middleware | Controller | Description |
|--------|------|-----------|------------|-------------|
| GET | `/api/v1/` | `requireAuth` | `apiInfo` | API version info |
| GET | `/api/v1/menu` | `requireAuth` | `getMenuItems` | List all menu items |
| POST | `/api/v1/menu` | `requireAdmin` | `addMenuItem` | Create menu item (with optional image upload) |
| GET | `/api/v1/menu/:id` | `requireAuth` | `getOneMenuItem` | Get menu item by ObjectId |
| PUT | `/api/v1/menu/:id` | `requireAdmin` | `updateMenuItem` | Update menu item |
| DELETE | `/api/v1/menu/:id` | `requireAdmin` | `deleteMenuItem` | Delete menu item |
| GET | `/api/v1/orders` | `requireWaiter` | `getOrders` | List all orders (populated) |
| POST | `/api/v1/orders` | `requireWaiter` | `createOrder` | Create order for table |
| GET | `/api/v1/orders/:id` | `requireWaiter` | `getOneOrder` | Get order by ObjectId (populated) |
| PUT | `/api/v1/orders/:id/status` | `requireWaiter` | `updateOrderStatus` | Update order status (pending→preparing→ready→served) |
| PUT | `/api/v1/orders/:id/payment` | `requireWaiter` | `markOrderPaid` | Mark order as paid |

### 8.2 Business Logic

#### Create Order (`createOrder`)

1. **Input** — `{ tableNumber, items: [{ menuItemId, quantity }, ...] }`
2. **Fetch menu item details** — for each item, find by ObjectId, check `isAvailable`
3. **Build order items** — `{ menuItem: ObjectId, quantity, unitPrice: menuItem.price, subtotal: price * quantity }`
4. **Calculate total** — sum of all subtotals
5. **Save order** — status "pending", paymentStatus "pending"

#### Update Order Status (`updateOrderStatus`)

1. **Input** — `{ status }` — must follow valid transitions:
   - `pending → preparing → ready → served`
   - `pending → cancelled` (at any point before served)
2. **Validate transition** — reject invalid state changes
3. **Update and return**

### 8.3 Service Configuration

```
PORT=8005
DB_URL=mongodb://mongo:27017/restaurant
NODE_ENV=development
```

---

## Part 9: Checkout Service

> Currently Hono/Bun. Refactored to use `@elmariam/queue` package.

### 9.1 Current Logic (Unchanged)

1. Connect to RabbitMQ
2. Subscribe to `"mpesa"` queue
3. On message: parse JSON, call `checkout(data)` which triggers IntaSend STK push
4. IntaSend SDK: `intasend.collection().mpesaStkPush({ first_name, last_name, email, host, amount, phone_number, api_ref })`

### 9.2 Refactored Entry Point

```typescript
import { Hono } from "hono";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";
import checkout from "./utils/checkout";

const app = new Hono();
const rabbitMQ = new RabbitMQConfig(rabbitMQEnvFromProcess(), {
  maxRetries: 10,
  initialDelay: 2000,
  maxDelay: 60000,
});

(async () => {
  await rabbitMQ.connect();
  await rabbitMQ.createQueue("mpesa");
  await rabbitMQ.subscribeToQueue("mpesa", checkout);
  console.log(`👂  Listening for messages on mpesa queue...`);
})();

// Graceful shutdown
process.on("SIGINT", async () => {
  await rabbitMQ.close();
  process.exit(0);
});

app.get("*", (c) =>
  c.json({ apiVersion: "1.0.0", apiDescription: "Checkout Service" })
);

export default { port: 8008, fetch: app.fetch };
```

### 9.3 IntaSend Configuration

```
INTASEND_API_TOKEN=ISSecretKey_test_...
INTASEND_PUBLISHABLE_KEY=ISPubKey_test_...
INTASEND_TEST_MODE=true  # set to false in production
```

---

## Part 10: SMS Service

### 10.1 Current Logic (Unchanged)

1. Connect to RabbitMQ with retry
2. Subscribe to `"sms"` queue (durable)
3. On message: parse JSON `{ phoneNumbers, message }`, call `sendSMS(data)`
4. `sendSMS` calls UjumbeSMS API: `POST ${UJUMBESMS_API_URL}/api/messaging` with headers `email` and `X-Authorization`

### 10.2 UjumbeSMS API Payload

```json
{
  "data": [{
    "message_bag": {
      "numbers": "0723660400,0712090304",
      "message": "Message text",
      "sender": "UjumbeSMS"
    }
  }]
}
```

### 10.3 Refactored to Use Shared Queue

Replace local `RabbitMQConfig` class with `import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue"`.

---

## Part 11: SMTP Service

### 11.1 Current Logic (Unchanged)

1. Connect to RabbitMQ (currently using callback API — refactor to use shared class)
2. Subscribe to `"mails"` queue
3. On message: parse JSON, call `sendMail(data)`
4. `sendMail` uses Nodemailer with Gmail OAuth2: `{ type: "OAuth2", user: EMAIL_SENDER, clientId, clientSecret, refreshToken, accessToken }`
5. Uses Handlebars template (`email.hbs`) for registration email with username and verification URL

### 11.2 Email Template Context

```typescript
{
  title: "Registration Successful ✔",
  username: capitalize(data.username),  // first letter uppercase
  url: data.url                         // verification link
}
```

---

## Part 12: KrakenD API Gateway

### 12.1 Global Configuration

```json
{
  "$schema": "https://www.krakend.io/schema/v3.json",
  "version": 3,
  "name": "elmariam-api-gateway",
  "timeout": "30000ms",
  "cache_ttl": "3600s",
  "port": 8009,
  "extra_config": {
    "router": {
      "return_error_msg": true,
      "auto_options": true
    },
    "security/cors": {
      "allow_origins": [
        "https://*.otienoobogeandcompany.com",
        "http://localhost:*"
      ],
      "allow_methods": ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
      "expose_headers": ["Content-Length", "Content-Type"],
      "allow_credentials": true,
      "allow_headers": [
        "Accept", "Authorization", "Content-Type", "Cookie",
        "Origin", "X-Refresh-Token"
      ],
      "max_age": "12h"
    }
  }
}
```

### 12.2 JWT Validation (Shared Extra Config)

Applied to every protected endpoint:

```json
"extra_config": {
  "auth/validator": {
    "alg": "ES256",
    "jwk_url": "http://openauth:3100/.well-known/jwks.json",
    "issuer": "https://auth.otienoobogeandcompany.com",
    "cache": true,
    "cache_duration": 900,
    "disable_jwk_security": true,
    "propagate_claims": [
      ["sub", "x-user-id"],
      ["properties.email", "x-user-email"],
      ["properties.userType", "x-user-type"]
    ]
  }
}
```

> **CRITICAL:** Every endpoint that uses `propagate_claims` MUST also include `"input_headers": ["x-user-id", "x-user-email", "x-user-type"]` — otherwise KrakenD strips the propagated headers before they reach the backend. This was the exact bug we debugged in the `locci-gateway-demo`.

### 12.3 Full Endpoint List

> All 35+ endpoints from the current `krakend.json` mapped to the new service layout. Auth endpoints are removed (OpenAuth handles auth directly). Rate limiting retained at 15 req/s global, 5 req/s per client IP.

**Hotel Endpoints:**

| Gateway Path | Method | Backend URL | Backend Host |
|-------------|--------|-------------|-------------|
| `/api/hotel/version` | GET | `/api/v1/` | `http://hotel:8003` |
| `/api/hotel/customers` | GET | `/api/v1/customers` | `http://hotel:8003` |
| `/api/hotel/customers` | POST | `/api/v1/customers` | `http://hotel:8003` |
| `/api/hotel/customers/{customerid}` | GET | `/api/v1/customers/{customerid}` | `http://hotel:8003` |
| `/api/hotel/bookings` | GET | `/api/v1/bookings` | `http://hotel:8003` |
| `/api/hotel/bookings` | POST | `/api/v1/bookings` | `http://hotel:8003` |
| `/api/hotel/bookings/{bookingid}` | GET | `/api/v1/bookings/{bookingid}` | `http://hotel:8003` |
| `/api/hotel/roomtypes` | GET | `/api/v1/rooms/types` | `http://hotel:8003` |
| `/api/hotel/roomtypes` | POST | `/api/v1/rooms/types` | `http://hotel:8003` |
| `/api/hotel/rooms` | GET | `/api/v1/rooms` | `http://hotel:8003` |
| `/api/hotel/rooms/{roomtypeid}` | POST | `/api/v1/rooms/{roomtypeid}` | `http://hotel:8003` |
| `/api/hotel/invoices` | GET | `/api/v1/invoices` | `http://hotel:8003` |
| `/api/hotel/invoices/{invoiceid}` | GET | `/api/v1/invoices/{invoiceid}` | `http://hotel:8003` |
| `/api/hotel/mpesa-payment/{bookingid}` | POST | `/api/v1/mpesa-payment/{bookingid}` | `http://hotel:8003` |
| `/api/hotel/sms/{bookingid}` | POST | `/api/v1/sms/{bookingid}` | `http://hotel:8003` |

**Bar Endpoints:**

| Gateway Path | Method | Backend URL | Backend Host |
|-------------|--------|-------------|-------------|
| `/api/bar/version` | GET | `/api/v1/` | `http://bar:8004` |
| `/api/bar/drinks` | GET | `/api/v1/drinks` | `http://bar:8004` |
| `/api/bar/drinks` | POST | `/api/v1/drinks` | `http://bar:8004` |
| `/api/bar/drinks/{drinkid}` | GET | `/api/v1/drinks/{drinkid}` | `http://bar:8004` |
| `/api/bar/drinks/{drinkid}` | PUT | `/api/v1/drinks/{drinkid}` | `http://bar:8004` |
| `/api/bar/drinks/{drinkid}` | DELETE | `/api/v1/drinks/{drinkid}` | `http://bar:8004` |
| `/api/bar/purchases` | GET | `/api/v1/purchases` | `http://bar:8004` |
| `/api/bar/purchases` | POST | `/api/v1/purchases` | `http://bar:8004` |
| `/api/bar/purchases/{purchaseid}` | GET | `/api/v1/purchases/{purchaseid}` | `http://bar:8004` |
| `/api/bar/sales` | GET | `/api/v1/sales` | `http://bar:8004` |
| `/api/bar/sales` | POST | `/api/v1/sales` | `http://bar:8004` |
| `/api/bar/sales/{salesid}` | GET | `/api/v1/sales/{salesid}` | `http://bar:8004` |
| `/api/bar/sales/lipa-mpesa/{salesid}` | POST | `/api/v1/sales/lipa-mpesa/{salesid}` | `http://bar:8004` |

**Restaurant Endpoints (NEW):**

| Gateway Path | Method | Backend URL | Backend Host |
|-------------|--------|-------------|-------------|
| `/api/restaurant/version` | GET | `/api/v1/` | `http://restaurant:8005` |
| `/api/restaurant/menu` | GET | `/api/v1/menu` | `http://restaurant:8005` |
| `/api/restaurant/menu` | POST | `/api/v1/menu` | `http://restaurant:8005` |
| `/api/restaurant/menu/{id}` | GET | `/api/v1/menu/{id}` | `http://restaurant:8005` |
| `/api/restaurant/menu/{id}` | PUT | `/api/v1/menu/{id}` | `http://restaurant:8005` |
| `/api/restaurant/menu/{id}` | DELETE | `/api/v1/menu/{id}` | `http://restaurant:8005` |
| `/api/restaurant/orders` | GET | `/api/v1/orders` | `http://restaurant:8005` |
| `/api/restaurant/orders` | POST | `/api/v1/orders` | `http://restaurant:8005` |
| `/api/restaurant/orders/{id}` | GET | `/api/v1/orders/{id}` | `http://restaurant:8005` |
| `/api/restaurant/orders/{id}/status` | PUT | `/api/v1/orders/{id}/status` | `http://restaurant:8005` |
| `/api/restaurant/orders/{id}/payment` | PUT | `/api/v1/orders/{id}/payment` | `http://restaurant:8005` |

### 12.4 Public Endpoints (No Auth)

For the website's public room/menu browsing, add unauthenticated endpoints:

| Gateway Path | Method | Backend URL | Backend Host |
|-------------|--------|-------------|-------------|
| `/api/public/roomtypes` | GET | `/api/v1/rooms/types` | `http://hotel:8003` |
| `/api/public/menu` | GET | `/api/v1/menu` | `http://restaurant:8005` |

These have NO `auth/validator` extra config and no `input_headers` for user claims.

---

## Part 13: SvelteKit Admin App

### 13.1 Page Inventory

> Mapped from the current admin panel's routes in `App.svelte`:

| Current Route (Hash) | Target Route | Description |
|---------------------|-------------|-------------|
| `/#/` | `/` | Dashboard — stats cards (total bookings, revenue, rooms, customers), charts |
| `/#/login` | `/login` | OpenAuth PKCE login |
| `/#/users` | `/users` | User accounts list (management only) |
| `/#/users/:id` | `/users/[id]` | User detail view |
| `/#/customers` | `/customers` | Customer list |
| `/#/customers/:id` | `/customers/[id]` | Customer detail |
| `/#/bookings` | `/bookings` | Booking list (populated with customer, room type, invoice) |
| `/#/room-types` | `/room-types` | Room type list + create form |
| `/#/rooms` | `/rooms` | Room list |
| `/#/bar-drinks` | `/bar-drinks` | Drink catalog list |
| — (new) | `/bar-purchases` | Bar purchase list + create form |
| — (new) | `/bar-sales` | Bar sales list |
| — (new) | `/menu-items` | Restaurant menu items CRUD |
| — (new) | `/restaurant-orders` | Restaurant orders list |
| `/#/forgot-password` | — | REMOVED (OpenAuth handles password reset) |

### 13.2 SvelteKit Config

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  kit: {
    adapter: adapter(),
    experimental: {
      remoteFunctions: true,
    },
  },
  compilerOptions: {
    experimental: { async: true },
  },
  preprocess: vitePreprocess(),
};
```

### 13.3 Remote Functions Pattern

**src/lib/remote/hotel.remote.ts** (example):
```typescript
import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8009';

async function getToken() {
  const event = getRequestEvent();
  const token = event.cookies.get('auth_token');
  if (!token) throw new Error('Unauthenticated');
  return token;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.data?.message || 'API error');
  return data.data;
}

// Queries (reads)
export const getCustomers = query(() => apiFetch('/api/hotel/customers'));
export const getBookings = query(() => apiFetch('/api/hotel/bookings'));
export const getRoomTypes = query(() => apiFetch('/api/hotel/roomtypes'));
export const getRooms = query(() => apiFetch('/api/hotel/rooms'));
export const getInvoices = query(() => apiFetch('/api/hotel/invoices'));

export const getOneBooking = query(async (bookingId: string) =>
  apiFetch(`/api/hotel/bookings/${bookingId}`)
);

// Commands (writes)
export const createCustomer = command(
  v.object({
    firstname: v.pipe(v.string(), v.minLength(3)),
    lastname: v.pipe(v.string(), v.minLength(3)),
    id_number: v.string(),
    email: v.pipe(v.string(), v.email()),
    phone_number: v.optional(v.string()),
  }),
  async (data) => apiFetch('/api/hotel/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
);

export const createBooking = command(
  v.object({
    customerId: v.string(),
    numberAdults: v.pipe(v.number(), v.minValue(1)),
    numberKids: v.pipe(v.number(), v.minValue(0)),
    roomType: v.picklist(['single', 'double']),
    checkInDate: v.string(),
    checkOutDate: v.string(),
    paymentMethod: v.picklist(['cash', 'mpesa', 'bank']),
  }),
  async (data) => apiFetch('/api/hotel/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
);

export const initiateMpesaPayment = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => apiFetch(`/api/hotel/mpesa-payment/${bookingId}`, {
    method: 'POST',
  })
);

export const sendSmsNotification = command(
  v.object({ bookingId: v.string() }),
  async ({ bookingId }) => apiFetch(`/api/hotel/sms/${bookingId}`, {
    method: 'POST',
  })
);
```

### 13.4 Auth Flow in SvelteKit Apps

1. User visits `/login`
2. Redirect to OpenAuth authorize URL with PKCE challenge
3. User enters credentials on OpenAuth password UI
4. OpenAuth redirects back to `/login/callback` with auth code
5. SvelteKit callback route exchanges code for tokens using `client.exchange(code, redirect_uri)`
6. Store access token in httpOnly cookie (`auth_token`)
7. All remote functions read token from cookie via `getRequestEvent().cookies.get('auth_token')`
8. Token refresh: if API returns 401, attempt `client.refresh(refreshToken)` and retry

### 13.5 Current UI Components

From the existing admin panel:

| Component | Purpose | Target |
|-----------|---------|--------|
| `Toast.svelte` | Success/error alert banners | Replace with shadcn-svelte `Alert` |
| `BarChart.svelte` | Chart.js bar chart via `svelte-chartjs` | Keep or replace with recharts in shadcn |
| `data.js` | Static chart demo data | Replace with real analytics data |
| `baseLayout.svelte` | Sidebar + topbar layout with session management | Replace with SvelteKit `+layout.svelte` |

### 13.6 Axios Interceptor Logic (to replicate in remote functions)

The current admin panel uses an axios interceptor that:
1. Adds `Authorization: Bearer {token}` to every request
2. On 401 response, attempts token refresh via `POST /auth/refresh` with `x-refresh-token` header
3. If refresh succeeds, retries the original request with new token
4. If refresh fails, redirects to `/login`

**In the refactored SvelteKit app**, this logic moves into the `apiFetch` helper inside remote functions, with cookie-based token storage instead of localStorage.

---

## Part 14: SvelteKit Staff App

### 14.1 Page Inventory

**Receptionist workspace (`/receptionist/`):**

| Route | Description |
|-------|-------------|
| `/receptionist` | Dashboard: today's check-ins, check-outs, pending invoices |
| `/receptionist/customers` | Customer list + search by ID number + add customer form |
| `/receptionist/customers/[id]` | Customer detail |
| `/receptionist/bookings` | Booking list with status filters |
| `/receptionist/bookings/new` | Booking wizard: search customer → select room type → dates → confirm |
| `/receptionist/bookings/[id]` | Booking detail with invoice, M-Pesa payment button, SMS button |
| `/receptionist/rooms` | Room availability grid (room number × booked status) |
| `/receptionist/invoices` | Invoice list with paid/pending filter |

**Barista workspace (`/barista/`):**

| Route | Description |
|-------|-------------|
| `/barista` | Dashboard: low stock alerts, today's sales total |
| `/barista/drinks` | Drink catalog with stock levels |
| `/barista/drinks/new` | Add drink form (with image upload) |
| `/barista/purchases` | Purchase history + create purchase form |
| `/barista/purchases/new` | New purchase: select product, quantity, supplier, receipt number |
| `/barista/sales` | Sales history |
| `/barista/sales/new` | Bar checkout: add drinks to cart, quantities, confirm sale |

**Waiter workspace (`/waiter/`):**

| Route | Description |
|-------|-------------|
| `/waiter` | Dashboard: active orders by status |
| `/waiter/menu` | Restaurant menu (read-only, shows availability) |
| `/waiter/orders` | Order list with status filters |
| `/waiter/orders/new` | Create order: select table, add menu items, quantities |
| `/waiter/orders/[id]` | Order detail with status update buttons |

### 14.2 Role-Based Redirect

After login, the staff app's root page reads `userType` from auth context and redirects:
- `"receptionist"` → `/receptionist`
- `"barista"` → `/barista`
- `"waiter"` → `/waiter`
- `"management"` → `/receptionist` (can navigate to any workspace)

---

## Part 15: SvelteKit Website

### 15.1 Public Pages (No Auth)

| Route | Description |
|-------|-------------|
| `/` | Hero section, room highlights, restaurant preview, testimonials, CTA |
| `/rooms` | Room types showcase with photos, rates, capacity |
| `/restaurant` | Full restaurant menu with categories and prices |
| `/contact` | Contact form, location map, phone number, email |
| `/about` | About the hotel, team, history |

### 15.2 Customer Self-Service (Authenticated)

| Route | Description |
|-------|-------------|
| `/login` | Customer login via OpenAuth PKCE |
| `/register` | Customer registration (creates User with userType "customer") |
| `/portal` | Customer dashboard: upcoming bookings, recent invoices |
| `/portal/bookings` | My bookings list |
| `/portal/bookings/new` | Online booking form: select dates, room type, guest count, payment method |
| `/portal/bookings/[id]` | Booking detail with invoice and M-Pesa pay button |
| `/portal/invoices` | My invoices list |
| `/portal/profile` | View/edit profile (name, phone, email) |

### 15.3 Public Data Fetching

Public pages call the unauthenticated KrakenD endpoints:
- `GET /api/public/roomtypes` — for room showcase
- `GET /api/public/menu` — for restaurant menu

No token needed. These can be fetched server-side in SvelteKit `+page.server.ts` (exception to the "no load functions" rule for public SSR pages).

---

## Part 16: Docker Compose & Infrastructure

### 16.1 docker-compose.yml

```yaml
services:
  # ──── Infrastructure ────
  mongo:
    container_name: elmariam-mongo
    image: mongo:4.2
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - elmariam-mongodb-data:/data/db
    networks:
      - elmariam-network

  rabbitmq:
    container_name: elmariam-queue
    image: rabbitmq:3.12-management
    restart: always
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_DEFAULT_USER:-user}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_DEFAULT_PASS:-password}
      - RABBITMQ_DEFAULT_VHOST=${RABBITMQ_DEFAULT_VHOST:-elmariam}
    networks:
      - elmariam-network

  minio:
    container_name: elmariam-object-store
    image: minio/minio:latest
    restart: always
    environment:
      - MINIO_ROOT_USER=minio
      - MINIO_ROOT_PASSWORD=minio_password
      - MINIO_SERVER_URL=https://s3.otienoobogeandcompany.com
      - MINIO_BROWSER_REDIRECT_URL=https://minio.otienoobogeandcompany.com
    ports:
      - "9003:9000"
      - "9001:9001"
    volumes:
      - elmariam-minio-data:/data
    command: server /data --console-address ":9001"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.s3.rule=Host(`s3.otienoobogeandcompany.com`)"
      - "traefik.http.routers.s3.service=s3"
      - "traefik.http.services.s3.loadbalancer.server.port=9000"
      - "traefik.http.routers.minio.rule=Host(`minio.otienoobogeandcompany.com`)"
      - "traefik.http.routers.minio.service=minio"
      - "traefik.http.services.minio.loadbalancer.server.port=9001"
    networks:
      - elmariam-network

  # ──── Auth ────
  openauth:
    container_name: elmariam-openauth
    build: ./infra/openauth
    restart: always
    environment:
      - PORT=3100
      - DB_URL=mongodb://mongo:27017/auth
      - OPENAUTH_ISSUER=https://auth.otienoobogeandcompany.com
    ports:
      - "3100:3100"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.auth.rule=Host(`auth.otienoobogeandcompany.com`)"
      - "traefik.http.services.auth.loadbalancer.server.port=3100"
    depends_on:
      - mongo
    networks:
      - elmariam-network

  # ──── Gateway ────
  gateway:
    container_name: elmariam-api-gateway
    build: ./infra/gateway
    restart: always
    ports:
      - "8009:8009"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gateway.rule=Host(`gateway.otienoobogeandcompany.com`)"
      - "traefik.http.services.gateway.loadbalancer.server.port=8009"
    depends_on:
      - openauth
      - hotel
      - bar
      - restaurant
    networks:
      - elmariam-network

  # ──── Reverse Proxy ────
  reverse-proxy:
    image: traefik:v2.11
    container_name: elmariam-proxy
    command:
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.endpoint=unix:///var/run/docker.sock
    restart: always
    ports:
      - "7979:80"
      - "8080:8080"
    volumes:
      - /run/user/1000/docker.sock:/var/run/docker.sock:ro
    networks:
      - elmariam-network

  # ──── Services ────
  hotel:
    container_name: elmariam-hotel-svc
    build: ./services/hotel
    restart: always
    environment:
      - PORT=8003
      - DB_URL=mongodb://mongo:27017/hotel
      - NODE_ENV=development
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USERNAME=${RABBITMQ_DEFAULT_USER:-user}
      - RABBITMQ_PASSWORD=${RABBITMQ_DEFAULT_PASS:-password}
      - RABBITMQ_VHOST=${RABBITMQ_DEFAULT_VHOST:-elmariam}
    depends_on:
      - mongo
      - rabbitmq
    networks:
      - elmariam-network

  bar:
    container_name: elmariam-bar-svc
    build: ./services/bar
    restart: always
    environment:
      - PORT=8004
      - DB_URL=mongodb://mongo:27017/bar
      - NODE_ENV=development
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USERNAME=${RABBITMQ_DEFAULT_USER:-user}
      - RABBITMQ_PASSWORD=${RABBITMQ_DEFAULT_PASS:-password}
      - RABBITMQ_VHOST=${RABBITMQ_DEFAULT_VHOST:-elmariam}
      - MINIO_API_HOST=minio
      - MINIO_ACCESS_KEY=minio
      - MINIO_SECRET_KEY=minio_password
      - S3_HOSTNAME=s3.otienoobogeandcompany.com
    depends_on:
      - mongo
      - minio
    networks:
      - elmariam-network

  restaurant:
    container_name: elmariam-restaurant-svc
    build: ./services/restaurant
    restart: always
    environment:
      - PORT=8005
      - DB_URL=mongodb://mongo:27017/restaurant
      - NODE_ENV=development
    depends_on:
      - mongo
    networks:
      - elmariam-network

  checkout:
    container_name: elmariam-checkout-svc
    build: ./services/checkout
    restart: always
    environment:
      - PORT=8008
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USERNAME=${RABBITMQ_DEFAULT_USER:-user}
      - RABBITMQ_PASSWORD=${RABBITMQ_DEFAULT_PASS:-password}
      - RABBITMQ_VHOST=${RABBITMQ_DEFAULT_VHOST:-elmariam}
      - INTASEND_API_TOKEN=${INTASEND_API_TOKEN}
      - INTASEND_PUBLISHABLE_KEY=${INTASEND_PUBLISHABLE_KEY}
      - INTASEND_TEST_MODE=${INTASEND_TEST_MODE:-true}
    depends_on:
      - rabbitmq
    networks:
      - elmariam-network

  sms:
    container_name: elmariam-sms-svc
    build: ./services/sms
    restart: always
    environment:
      - PORT=7879
      - NODE_ENV=development
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USERNAME=${RABBITMQ_DEFAULT_USER:-user}
      - RABBITMQ_PASSWORD=${RABBITMQ_DEFAULT_PASS:-password}
      - RABBITMQ_VHOST=${RABBITMQ_DEFAULT_VHOST:-elmariam}
      - UJUMBESMS_API_KEY=${UJUMBESMS_API_KEY}
      - UJUMBESMS_API_URL=${UJUMBESMS_API_URL:-https://ujumbesms.co.ke}
      - UJUMBESMS_ACCOUNT_EMAIL=${UJUMBESMS_ACCOUNT_EMAIL}
    depends_on:
      - rabbitmq
    networks:
      - elmariam-network

  smtp:
    container_name: elmariam-smtp-svc
    build: ./services/smtp
    restart: always
    environment:
      - PORT=3300
      - NODE_ENV=development
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USERNAME=${RABBITMQ_DEFAULT_USER:-user}
      - RABBITMQ_PASSWORD=${RABBITMQ_DEFAULT_PASS:-password}
      - RABBITMQ_VHOST=${RABBITMQ_DEFAULT_VHOST:-elmariam}
      - EMAIL_SENDER=${EMAIL_SENDER}
      - CLIENT_ID=${GMAIL_CLIENT_ID}
      - CLIENT_SECRET=${GMAIL_CLIENT_SECRET}
      - G_RFR_TKN=${GMAIL_REFRESH_TOKEN}
      - G_ACC_TKN=${GMAIL_ACCESS_TOKEN}
    depends_on:
      - rabbitmq
    networks:
      - elmariam-network

  # ──── Frontend Apps ────
  admin:
    container_name: elmariam-admin-app
    build: ./apps/admin
    restart: always
    environment:
      - GATEWAY_URL=http://gateway:8009
      - OPENAUTH_ISSUER=http://openauth:3100
    ports:
      - "3000:3000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin-panel.otienoobogeandcompany.com`)"
      - "traefik.http.services.admin.loadbalancer.server.port=3000"
    networks:
      - elmariam-network

  staff:
    container_name: elmariam-staff-app
    build: ./apps/staff
    restart: always
    environment:
      - GATEWAY_URL=http://gateway:8009
      - OPENAUTH_ISSUER=http://openauth:3100
    ports:
      - "3001:3001"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.staff.rule=Host(`staff-panel.otienoobogeandcompany.com`)"
      - "traefik.http.services.staff.loadbalancer.server.port=3001"
    networks:
      - elmariam-network

  website:
    container_name: elmariam-website
    build: ./apps/website
    restart: always
    environment:
      - GATEWAY_URL=http://gateway:8009
      - OPENAUTH_ISSUER=http://openauth:3100
    ports:
      - "3002:3002"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.website.rule=Host(`otienoobogeandcompany.com`)"
      - "traefik.http.services.website.loadbalancer.server.port=3002"
    networks:
      - elmariam-network

volumes:
  elmariam-mongodb-data:
  elmariam-minio-data:

networks:
  elmariam-network:
    name: elmariam
    driver: bridge
```

---

## Part 17: Justfile & Developer Workflow

```justfile
# El'Mariam Management System
repository := "https://github.com/MikeTeddyOmondi/elmariam.git"
version := "2.0.0"

# Default
default:
  just --list

# ──── Development ────

# Install all dependencies
install:
  pnpm install

# Start all services in development
dev:
  pnpm turbo dev

# Start only infrastructure (mongo, rabbitmq, minio)
dev-infra:
  docker compose up -d mongo rabbitmq minio

# Start specific app in dev mode
dev-admin:
  cd apps/admin && pnpm dev

dev-staff:
  cd apps/staff && pnpm dev

dev-website:
  cd apps/website && pnpm dev

# ──── Docker ────

# Create Docker network
create-network:
  docker network create elmariam || true

# Build all Docker images
build-all:
  docker compose build

# Start full stack
up:
  docker compose up -d

# Stop full stack
down:
  docker compose down

# Rebuild and restart a specific service
restart service:
  docker compose up -d --build {{service}}

# View logs for a specific service
logs service:
  docker compose logs -f {{service}}

# ──── Database ────

# Connect to MongoDB shell
mongo-shell:
  docker exec -it elmariam-mongo mongosh

# Seed database with sample data
seed:
  cd packages/db && pnpm run seed

# ──── Utilities ────

# Build all packages
build-packages:
  pnpm turbo build --filter='./packages/*'

# Type check everything
typecheck:
  pnpm turbo typecheck

# Clean all build artifacts
clean:
  pnpm turbo clean
  rm -rf node_modules
  find . -name "node_modules" -type d -prune -exec rm -rf {} +

# ──── Production ────

# Build all for production
build-prod:
  NODE_ENV=production pnpm turbo build

# Push all Docker images
push-images:
  docker compose push
```

---

## Part 18: Migration Strategy

### 18.1 Data Migration (None Required)

Since we're keeping MongoDB and Mongoose, all existing data stays in place. The only changes:
- `User.userType` enum expands from `["customer", "staff", "management"]` to `["customer", "receptionist", "barista", "waiter", "management"]`
- Existing `"staff"` users need a one-time migration to their specific role

```javascript
// Migration script: migrate-staff-roles.js
// Run manually to assign specific roles to existing staff users
const { connectDB, User } = require("@elmariam/db");

async function migrate() {
  await connectDB({ url: "mongodb://mongo:27017/auth" });

  // List all staff users for manual role assignment
  const staffUsers = await User.find({ userType: "staff" });

  console.log(`Found ${staffUsers.length} staff users to migrate:`);
  for (const user of staffUsers) {
    console.log(`  - ${user.username} (${user.email})`);
    // Assign roles based on your knowledge of each staff member
    // Example:
    // await User.updateOne({ _id: user._id }, { userType: "receptionist" });
  }
}

migrate();
```

### 18.2 Auth Migration

1. Export all users from current MongoDB `auth` database
2. Deploy OpenAuth server
3. Run migration script that registers each user with OpenAuth's password provider
4. Users will need to set new passwords (or use a "forgot password" flow on first login)
5. The `User` model in `@elmariam/db` retains profile data; `openauth_subject_id` links to the OpenAuth subject

### 18.3 Incremental Rollout

Recommended order:
1. **Phase 1:** Set up monorepo, shared packages (`@elmariam/db`, `@elmariam/queue`, `@elmariam/auth`). Verify packages build and types resolve.
2. **Phase 2:** Deploy OpenAuth server alongside existing auth service. Test JWKS endpoint, token issuance.
3. **Phase 3:** Reconfigure KrakenD to validate via OpenAuth JWKS. Update `propagate_claims`. Test with curl.
4. **Phase 4:** Refactor hotel + bar services to use shared packages and read gateway headers. Deploy alongside existing services.
5. **Phase 5:** Build restaurant service.
6. **Phase 6:** Build SvelteKit admin app, deploy to replace Svelte SPA.
7. **Phase 7:** Build SvelteKit staff app, deploy to replace user panel SPA.
8. **Phase 8:** Build SvelteKit website with customer self-service.
9. **Phase 9:** Decommission old auth service, old Svelte SPAs.

