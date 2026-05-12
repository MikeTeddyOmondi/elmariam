import { issuer } from "@openauthjs/openauth";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { subjects } from "./subjects.js";
import { User } from "@elmariam/db";
import { MongoStorage } from "./mongo-storage.js";

const PORT = process.env.PORT || 3100;
// const DB_URL = process.env.DB_URL || "mongodb://mongo:27017/auth";

// await connectDB({ url: DB_URL });
const mongoStorage = MongoStorage({
  uri: "mongodb://mongo:27017",
  database: "openauth",
  collection: "sessions",
});

const app = issuer({
  subjects,
  storage: mongoStorage,
  providers: {
    password: PasswordProvider(
      PasswordUI({
        sendCode: async (email, code) => {
          // In production: send code via email/SMS
          // For now, log it
          console.log(`[OpenAuth] Code for ${email}: ${code}`);
        },
      })
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      const email = value.email;

      // Look up user in MongoDB
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error(`User not found: ${email}`);
      }

      return ctx.subject("user", {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
      });
    }

    throw new Error("Unknown provider");
  },
});

export default {
  port: Number(PORT),
  fetch: app.fetch,
};
