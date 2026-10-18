import { MongoClient, type Db } from "mongodb";
import { env } from "./config/env";

// The native driver rather than @elmariam/db: that package is an ES module with
// extensionless imports, which only the apps' bundler can load, not plain Node.
const client = new MongoClient(env.MONGODB_URL);
let db: Db | undefined;

export async function connectDB() {
  await client.connect();
  // The database comes from the URL path (mongodb://mongo:27017/elmariam).
  db = client.db();
  console.log(`> Connected to MongoDB: ${db.databaseName}`);
}

export function getDb(): Db {
  if (!db) throw new Error("connectDB() has not been called");
  return db;
}
