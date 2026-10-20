import dns from "node:dns";
import { MongoClient } from "mongodb";

// Avoid querySrv ECONNREFUSED with MongoDB Atlas on Windows / public DNS
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {}

// Set MONGODB_URI in your .env.local (dev) or Vercel environment variables (prod)
// Cached singleton client for serverless environments (prevents socket exhaustion)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "[mongo] MONGODB_URI environment variable is not configured. " +
      "Please set MONGODB_URI in Vercel project settings (Production/Preview) or .env.local for local dev."
  );
}

let client: MongoClient | null = null;

export async function getMongoDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI!, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    await client.connect();
  }
  return client.db("portfolio");
}
