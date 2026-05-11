import { createClient } from "@openauthjs/openauth/client";
import { subjects } from "./subjects";

const OPENAUTH_ISSUER =
  process.env.OPENAUTH_ISSUER || "http://openauth:3100";

const client = createClient({
  clientID: "elmariam",
  issuer: OPENAUTH_ISSUER,
});

export async function verifyAuth(token: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.verify(subjects as any, token);
  if (result.err) {
    throw new Error("Invalid token");
  }
  return result.subject; // { type: "user", properties: { id, email, userType } }
}

export { client };
