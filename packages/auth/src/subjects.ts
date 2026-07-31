import { object, picklist, string } from "valibot";
import { createSubjects } from "@openauthjs/openauth/subject";
import { ROLES } from "./rbac.js";

/**
 * Single source of truth for the token subject shape. The issuer
 * (`infra/openauth`) and all three apps import this — do not re-declare it.
 *
 * `userType` is a picklist rather than a bare string so a token can never carry
 * a role that isn't in `ROLES`, and so `client.verify` narrows to `Role`.
 */
export const subjects = createSubjects({
  user: object({
    id: string(),
    email: string(),
    userType: picklist(ROLES),
  }),
});
