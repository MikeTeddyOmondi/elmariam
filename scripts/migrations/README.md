# El'Mariam Migration Scripts

Two one-time migration scripts to run when transitioning from the old schema to the rewritten system.

## Prerequisites

```bash
cd scripts/migrations
npm install mongoose typescript ts-node @types/node
```

Or use the root workspace:
```bash
just migrate  # if added to .justfile
```

---

## 1. Staff Role Migration

**File:** `migrate-staff-roles.ts`

**What it does:** Finds all MongoDB `User` documents with `userType: "staff"` and updates them to a specific new role (`receptionist`, `barista`, `waiter`, or `management`).

**When to run:** Once, before the new system goes live, after you've decided which role each staff member should have.

### Usage

```bash
# Assign all "staff" users to "receptionist" by default:
MONGODB_URI=mongodb://localhost:27017/elmariam \
DEFAULT_ROLE=receptionist \
npx ts-node migrate-staff-roles.ts
```

For per-user control, edit the `ROLE_MAP` in the script before running:

```typescript
const ROLE_MAP: Record<string, StaffRole> = {
  'alice@hotel.com': 'barista',
  'bob@hotel.com': 'waiter',
};
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | No | `mongodb://localhost:27017/elmariam` | MongoDB connection string |
| `DEFAULT_ROLE` | No | `receptionist` | Role assigned to all unspecified staff |

---

## 2. OpenAuth User Registration Migration

**File:** `migrate-openauth-users.ts`

**What it does:** Registers existing MongoDB users with the OpenAuth `PasswordProvider`. Users without an `openauth_subject_id` are registered with a temporary password and their `openauth_subject_id` field is backfilled.

**When to run:** Once, after OpenAuth is running, before users attempt to log in through the new system.

### Usage

```bash
MONGODB_URI=mongodb://localhost:27017/elmariam \
OPENAUTH_ISSUER=http://localhost:3100 \
TEMP_PASSWORD="Change1234!" \
npx ts-node migrate-openauth-users.ts
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | No | `mongodb://localhost:27017/elmariam` | MongoDB connection string |
| `OPENAUTH_ISSUER` | No | `http://localhost:3100` | OpenAuth server base URL |
| `TEMP_PASSWORD` | **Yes** | — | Temporary password set for all migrated users |

### After Migration

All migrated users will have `TEMP_PASSWORD` as their login password. They must change it on first login. Communicate this to all staff and customers before go-live.

---

## Order of Operations

1. Bring up MongoDB, OpenAuth, and the gateway in the new stack.
2. Run `migrate-staff-roles.ts` to fix staff roles.
3. Run `migrate-openauth-users.ts` to register users with OpenAuth.
4. Bring up the remaining services and frontend apps.
5. Notify users to log in and change their passwords.
