/**
 * Single source of truth for roles, permissions and per-app access.
 *
 * Previously each of these lived as ad-hoc string literals duplicated across
 * `packages/auth/src/middleware.ts`, `packages/db/src/models/User.ts`, both
 * staff guards, and the admin user picklists. Everything now derives from here.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** Must stay in sync with the `userType` enum in `packages/db/src/models/User.ts`. */
export const ROLES = [
  "admin",
  "management",
  "receptionist",
  "barista",
  "waiter",
  "customer",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",

  "customers:read",
  "customers:write",
  "customers:delete",

  "bookings:read",
  "bookings:write",
  "bookings:cancel",

  "rooms:read",
  "rooms:write",
  "rooms:delete",

  "roomtypes:read",
  "roomtypes:write",
  "roomtypes:delete",

  "invoices:read",
  "invoices:write",

  "drinks:read",
  "drinks:write",
  "drinks:delete",

  "bar_purchases:read",
  "bar_purchases:write",

  "bar_sales:read",
  "bar_sales:write",

  "menu:read",
  "menu:write",
  "menu:delete",

  "orders:read",
  "orders:write",
  "orders:status",
  "orders:pay",

  "analytics:read",
  "payments:initiate",
  "notifications:send",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Every permission — what `admin` holds. Derived, so new entries are automatic. */
export const ALL_PERMISSIONS: readonly Permission[] = PERMISSIONS;

/** Every `*:read` permission plus analytics — what `management` holds. */
const READ_ONLY_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter((p) =>
  p.endsWith(":read"),
);

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ALL_PERMISSIONS,

  // Read-only across the whole product. Deliberately holds no write/delete.
  management: READ_ONLY_PERMISSIONS,

  receptionist: [
    "customers:read",
    "customers:write",
    "bookings:read",
    "bookings:write",
    "bookings:cancel",
    "rooms:read",
    "roomtypes:read",
    "invoices:read",
    "invoices:write",
    "payments:initiate",
    "notifications:send",
  ],

  // `drinks:read` only — the drinks catalogue is maintained in the admin app.
  // A barista moves stock through purchases and sales, but does not define new
  // products.
  barista: [
    "drinks:read",
    "bar_purchases:read",
    "bar_purchases:write",
    "bar_sales:read",
    "bar_sales:write",
  ],

  waiter: ["menu:read", "orders:read", "orders:write", "orders:status", "customers:read"],

  // Customers are additionally narrowed by ownership at the query level —
  // holding `bookings:read` does not mean reading *everyone's* bookings.
  customer: ["bookings:read", "bookings:write", "invoices:read", "roomtypes:read"],
};

// ---------------------------------------------------------------------------
// App + section access
// ---------------------------------------------------------------------------

export const APP_IDS = ["admin", "staff", "website"] as const;
export type AppId = (typeof APP_IDS)[number];

/** `admin` may log into every app. */
export const APP_ACCESS: Record<AppId, readonly Role[]> = {
  admin: ["admin", "management"],
  staff: ["admin", "management", "receptionist", "barista", "waiter"],
  website: ["admin", "customer"],
};

export type StaffSection = "receptionist" | "barista" | "waiter";

/** Which roles may open each `/[section]` area of the staff app. */
export const STAFF_SECTIONS: Record<StaffSection, readonly Role[]> = {
  receptionist: ["admin", "management", "receptionist"],
  barista: ["admin", "management", "barista"],
  waiter: ["admin", "management", "waiter"],
};

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: string | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: string | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function canAccessApp(role: string | undefined, app: AppId): boolean {
  if (!isRole(role)) return false;
  return APP_ACCESS[app].includes(role);
}

export function canAccessStaffSection(
  role: string | undefined,
  section: StaffSection,
): boolean {
  if (!isRole(role)) return false;
  return STAFF_SECTIONS[section].includes(role);
}

/** Permissions a role holds — handy for passing a `can(...)` set to the client. */
export function permissionsFor(role: string | undefined): readonly Permission[] {
  return isRole(role) ? ROLE_PERMISSIONS[role] : [];
}

/**
 * Roles an admin may assign. Every role except `customer`, which self-registers
 * through the issuer.
 *
 * Written as an explicit tuple rather than `ROLES.filter(...)` so the literal
 * union survives — a filtered array widens to `Role[]`, which would let
 * `v.picklist(ASSIGNABLE_STAFF_ROLES)` type-check `customer` as assignable even
 * though it is rejected at runtime.
 */
export const ASSIGNABLE_STAFF_ROLES = [
  "admin",
  "management",
  "receptionist",
  "barista",
  "waiter",
] as const satisfies readonly Role[];

export type AssignableRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];
