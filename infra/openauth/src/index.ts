import { issuer } from "@openauthjs/openauth";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { MongoClient } from "mongodb";
import { subjects } from "./subjects.js";
import { MongoStorage } from "./mongo-storage.js";
import { RabbitMQConfig, rabbitMQEnvFromProcess } from "@elmariam/queue";
import { isRole, type Role } from "@elmariam/auth";

const DATABASE_NAME = "elmariam";
const PORT = process.env.PORT || 3100;
const DATABASE_URL = process.env.DATABASE_URL || "mongodb://mongo:27017";
const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Whether `http://localhost:*` is an acceptable redirect target.
 *
 * Kept separate from NODE_ENV on purpose: the compose stack runs with
 * NODE_ENV=production (so verification codes are actually mailed) but is also
 * what developers point their local apps at. Defaults to off, so a real
 * deployment is safe unless someone opts in explicitly.
 */
const ALLOW_LOCALHOST_REDIRECTS = process.env.OPENAUTH_ALLOW_LOCALHOST === "true";

// Set explicitly rather than left to library defaults, so the cookie `maxAge`
// the apps use can be matched to the token's real lifetime.
const ACCESS_TTL = 60 * 60 * 24 * 7; // 7 days
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days

// One client for the whole process — the storage adapter reuses it rather than
// opening a second connection to the same database.
const mongoClient = new MongoClient(DATABASE_URL);
await mongoClient.connect();
const usersCollection = mongoClient.db(DATABASE_NAME).collection("users");

class AuthUserError extends Error {}

/**
 * Resolves the user record for a successful password login.
 *
 * Auto-provisioning creates a `customer` only, and writes a document that
 * actually satisfies the `User` mongoose schema. The previous version inserted
 * `{email, userType, createdAt}` straight through the driver, which omitted the
 * required `username`/`id_number` and collided on the non-sparse unique
 * `id_number` index as soon as a second user signed up.
 *
 * Staff and management roles are never assigned here — an admin assigns them
 * through the admin app. Someone who should be staff but was never pre-created
 * is provisioned as a customer and then rejected by the staff app's callback.
 */
async function getOrCreateUser(email: string) {
  const existing = await usersCollection.findOne({ email });

  if (existing) {
    if (existing.isActive === false) {
      throw new AuthUserError("This account has been deactivated.");
    }
    if (!isRole(existing.userType)) {
      throw new AuthUserError("This account has an invalid role assigned.");
    }
    return existing;
  }

  const now = new Date();
  const localPart = email.split("@")[0] ?? email;

  const doc = {
    username: localPart,
    firstname: "",
    lastname: "",
    email,
    // `id_number` is required and uniquely indexed. Self-registered customers
    // have not supplied one yet, so seed a unique placeholder they can replace
    // from their profile rather than writing a null that collides.
    id_number: `pending-${crypto.randomUUID()}`,
    userType: "customer" as const,
    isActive: true,
    isVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await usersCollection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

const mongoStorage = MongoStorage({
  uri: DATABASE_URL,
  database: DATABASE_NAME,
  collection: "sessions",
  client: mongoClient,
});

const ALLOWED_CLIENTS = new Set(["admin", "staff", "website"]);
const ALLOWED_HOST_SUFFIX = ".otienoobogeandcompany.com";

async function sendVerificationCode(email: string, code: string) {
  // No mail transport is wired up in dev — log so the flow stays testable.
  if (IS_DEV) {
    console.log(`[OpenAuth] Code for ${email}: ${code}`);
    return;
  }

  const queue = new RabbitMQConfig(rabbitMQEnvFromProcess());
  try {
    await queue.connect();
    await queue.createQueue("mails");
    await queue.publishToQueue("mails", {
      type: "verification-code",
      username: email,
      code,
    });
  } catch (e) {
    // A swallowed error here means nobody can register or reset a password.
    console.error("[OpenAuth] failed to queue verification code:", e);
    throw e;
  } finally {
    await queue.close().catch(() => {});
  }
}

const app = issuer({
  subjects,
  storage: mongoStorage,
  ttl: { access: ACCESS_TTL, refresh: REFRESH_TTL },
  allow: async ({ clientID, redirectURI }) => {
    if (!ALLOWED_CLIENTS.has(clientID)) return false;

    let url: URL;
    try {
      url = new URL(redirectURI);
    } catch {
      return false;
    }

    if (ALLOW_LOCALHOST_REDIRECTS && url.hostname === "localhost") return true;

    return url.protocol === "https:" && url.hostname.endsWith(ALLOWED_HOST_SUFFIX);
  },
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          await sendVerificationCode(email, code);
        },
      }),
    ),
  },
  success: async (ctx, value) => {
    if (value.provider !== "password") {
      throw new Error("Unknown provider");
    }

    const user = await getOrCreateUser(value.email);

    // `userType` is a picklist in `subjects`, so an invalid role is rejected
    // here rather than minted into a token.
    return ctx.subject("user", {
      id: user._id.toString(),
      email: user.email as string,
      userType: user.userType as Role,
    });
  },
});

export default {
  port: Number(PORT),
  fetch: async (request: Request, ...rest: unknown[]) => {
    // Lightweight healthcheck so docker-compose can gate the apps on the issuer
    // actually listening rather than merely having started.
    if (new URL(request.url).pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "content-type": "application/json" },
      });
    }
    return (app.fetch as (req: Request, ...a: unknown[]) => Response | Promise<Response>)(
      request,
      ...rest,
    );
  },
};
