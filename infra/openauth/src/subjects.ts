import { object, string } from "valibot";

export const subjects = {
  user: object({
    id: string(),
    email: string(),
    userType: string(), // "customer" | "receptionist" | "barista" | "waiter" | "management"
  }),
};
