import dns from "node:dns";
import { MongoClient } from "mongodb";

// Avoid querySrv ECONNREFUSED with MongoDB Atlas on Windows / public DNS
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {}

// Set MONGODB_URI in your .env.local (dev) or Vercel environment variables (prod)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "[mongo] MONGODB_URI environment variable is not set. " +
      "Add it to .env.local for local dev or Vercel project settings for prod."
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
