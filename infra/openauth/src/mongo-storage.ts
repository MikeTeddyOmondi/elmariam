/**
 * Configure OpenAuth to use [MongoDB](https://www.mongodb.com/) as a storage adapter.
 *
 * ```ts
 * import { MongoStorage } from "@openauthjs/openauth/storage/mongo"
 *
 * const storage = MongoStorage({
 *   uri: "mongodb://localhost:27017",
 *   database: "openauth",
 *   collection: "sessions"
 * })
 *
 * export default issuer({
 *   storage,
 *   // ...
 * })
 * ```
 *
 * @packageDocumentation
 */

import { MongoClient, Collection, Db, MongoClientOptions } from "mongodb";
// import { joinKey, splitKey, StorageAdapter } from "./storage.js" // Maintain compatibility with OpenAuth storage interface

/**
 * Configure the MongoDB connection and collection.
 *
 * @example
 * ```ts
 * {
 *   uri: "mongodb://localhost:27017",
 *   database: "openauth",
 *   collection: "sessions"
 * }
 * ```
 */
export interface MongoStorageOptions {
  /**
   * The MongoDB connection URI.
   * @example "mongodb://localhost:27017" or "mongodb://user:pass@localhost:27017/dbname"
   */
  uri: string;
  /**
   * The database name.
   * @default "openauth"
   */
  database?: string;
  /**
   * The collection name.
   * @default "sessions"
   */
  collection?: string;
  /**
   * Additional MongoDB client options.
   */
  clientOptions?: Partial<MongoClientOptions>;
}

/**
 * Document structure stored in MongoDB.
 */
interface StorageDocument {
  _id: string;
  key: string[];
  value: any;
  expiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a MongoDB store.
 * @param options - The config for the adapter.
 */
export function MongoStorage(options: MongoStorageOptions): StorageAdapter {
  const databaseName = options.database || "openauth";
  const collectionName = options.collection || "sessions";

  let client: MongoClient | null = null;
  let db: Db | null = null;
  let collection: Collection<StorageDocument> | null = null;

  async function getCollection(): Promise<Collection<StorageDocument>> {
    if (!client) {
      // @ts-ignore
      client = new MongoClient(options.uri, {
        ...options.clientOptions,
      });
      await client.connect();
    }

    if (!db) {
      db = client.db(databaseName);
    }

    if (!collection) {
      collection = db.collection<StorageDocument>(collectionName);

      // Create indexes for better performance
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ expiry: 1 }, { expireAfterSeconds: 0 });
      await collection.createIndex({ "key.0": 1, "key.1": 1 });
    }

    return collection;
  }

  return {
    async get(key: string[]) {
      const coll = await getCollection();
      const keyString = joinKey(key);

      const doc = await coll.findOne({
        _id: keyString,
        $or: [
          { expiry: { $exists: false } },
          { expiry: undefined },
          { expiry: { $gt: new Date() } },
        ],
      });

      if (!doc) return undefined;

      // Double-check expiry in case the TTL index hasn't cleaned up yet
      if (doc.expiry && doc.expiry <= new Date()) {
        await coll.deleteOne({ _id: keyString });
        return undefined;
      }

      return doc.value;
    },

    async set(key: string[], value: any, expiry?: Date) {
      const coll = await getCollection();
      const keyString = joinKey(key);
      const now = new Date();

      const doc: StorageDocument = {
        _id: keyString,
        key,
        value,
        expiry: expiry || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await coll.replaceOne({ _id: keyString }, doc, { upsert: true });
    },

    async remove(key: string[]) {
      const coll = await getCollection();
      const keyString = joinKey(key);
      await coll.deleteOne({ _id: keyString });
    },

    async *scan(prefix: string[]) {
      const coll = await getCollection();
      const prefixStr = joinKey(prefix);
      const now = new Date();

      // Create a regex pattern for prefix matching
      const prefixRegex = new RegExp(
        `^${prefixStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
      );

      const cursor = coll.find({
        _id: prefixRegex,
        $or: [
          { expiry: { $exists: false } },
          { expiry: undefined },
          { expiry: { $gt: now } },
        ],
      });

      for await (const doc of cursor) {
        // Double-check expiry
        if (doc.expiry && doc.expiry <= now) {
          continue;
        }

        yield [doc.key, doc.value];
      }
    },
  };
}

export interface StorageAdapter {
  get(key: string[]): Promise<Record<string, any> | undefined>;
  remove(key: string[]): Promise<void>;
  set(key: string[], value: any, expiry?: Date): Promise<void>;
  scan(prefix: string[]): AsyncIterable<[string[], any]>;
}

const SEPERATOR = String.fromCharCode(0x1f);

export function joinKey(key: string[]) {
  return key.join(SEPERATOR);
}

export function splitKey(key: string) {
  return key.split(SEPERATOR);
}

export namespace Storage {
  function encode(key: string[]) {
    return key.map((k) => k.replaceAll(SEPERATOR, ""));
  }
  export function get<T>(adapter: StorageAdapter, key: string[]) {
    return adapter.get(encode(key)) as Promise<T | null>;
  }

  export function set(
    adapter: StorageAdapter,
    key: string[],
    value: any,
    ttl?: number
  ) {
    const expiry = ttl ? new Date(Date.now() + ttl * 1000) : undefined;
    return adapter.set(encode(key), value, expiry);
  }

  export function remove(adapter: StorageAdapter, key: string[]) {
    return adapter.remove(encode(key));
  }

  export function scan<T>(
    adapter: StorageAdapter,
    key: string[]
  ): AsyncIterable<[string[], T]> {
    return adapter.scan(encode(key));
  }
}