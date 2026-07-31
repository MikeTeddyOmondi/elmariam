// Re-exported from `@elmariam/auth` so the issuer and all three apps agree on
// one subject shape. Previously this was declared separately here and in each
// app, which let them drift.
export { subjects } from "@elmariam/auth";
