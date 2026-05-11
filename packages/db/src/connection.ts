import mongoose from "mongoose";

interface ConnectOptions {
  url: string;
  debug?: boolean;
}

export async function connectDB({ url, debug = false }: ConnectOptions) {
  mongoose.set("strictQuery", false);

  if (debug) {
    mongoose.set("debug", true);
  }

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  console.log(`> Connected to MongoDB: ${url.split("@").pop()}`);
}

export { mongoose };
