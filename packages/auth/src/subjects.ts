import { object, string } from "valibot";

// Single source of truth — duplicated here so packages/auth has no circular dep on infra/openauth
export const subjects = {
  user: object({
    id: string(),
    email: string(),
    userType: string(), // "customer" | "receptionist" | "barista" | "waiter" | "management"
  }),
};
