import { issuer } from "@openauthjs/openauth";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { MongoClient } from "mongodb";
import { subjects } from "./subjects.js";
import { MongoStorage } from "./mongo-storage.js";

const DATABASE_NAME = "elmariam";
const PORT = process.env.PORT || 3100;
const DATABASE_URL = process.env.DATABASE_URL || "mongodb://mongo:27017";

const mongoClient = new MongoClient(DATABASE_URL);
await mongoClient.connect();
const usersCollection = mongoClient.db(DATABASE_NAME).collection("users");

async function getOrCreateUser(email: string) {
  // Get user from database
  let user = await usersCollection.findOne({ email });

  if (!user) {
    const result = await usersCollection.insertOne({
      email,
      userType: "customer",
      createdAt: new Date(),
    });
    user = { _id: result.insertedId, email, userType: "customer" };
  }

  // Return user ID
  return user;
}

const mongoStorage = MongoStorage({
  uri: DATABASE_URL,
  database: DATABASE_NAME,
  collection: "sessions",
});

const ALLOWED_CLIENTS = new Set(["admin", "staff", "website"]);

const app = issuer({
  subjects,
  storage: mongoStorage,
  allow: async ({ clientID, redirectURI }) => {
    if (!ALLOWED_CLIENTS.has(clientID)) return false;
    const u = new URL(redirectURI);
    return u.hostname === "localhost" || u.hostname.endsWith(".otienoobogeandcompany.com");
  },
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          // In production: send code via email/SMS
          // For now, log it
          console.log(`[OpenAuth] Code for ${email}: ${code}`);
        },
      }),
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      const email = value.email;

      let user = await getOrCreateUser(email);

      return ctx.subject("user", {
        id: user._id.toString(),
        email: user.email as string,
        userType: user.userType as string,
      });
    }

    throw new Error("Unknown provider");
  },
});

export default {
  port: Number(PORT),
  fetch: app.fetch,
};
