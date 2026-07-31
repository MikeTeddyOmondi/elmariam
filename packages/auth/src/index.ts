// Framework-agnostic entry point. Deliberately does NOT re-export
// `./middleware`, which imports `express` — the SvelteKit apps import this
// barrel and must not pull express into their server bundle. Express consumers
// import `@elmariam/auth/middleware` directly.

export { subjects } from "./subjects.js";

export {
  ROLES,
  PERMISSIONS,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  APP_IDS,
  APP_ACCESS,
  STAFF_SECTIONS,
  ASSIGNABLE_STAFF_ROLES,
  isRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessApp,
  canAccessStaffSection,
  permissionsFor,
  type Role,
  type Permission,
  type AppId,
  type StaffSection,
} from "./rbac.js";
