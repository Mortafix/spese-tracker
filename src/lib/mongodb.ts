import { MongoClient } from "mongodb";
import { getConfiguredMongoDbName, getConfiguredMongoUri } from "@/lib/config";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured() {
  return Boolean(getConfiguredMongoUri());
}

export async function getMongoClient() {
  const uri = getConfiguredMongoUri();

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }

  return global._mongoClientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(getConfiguredMongoDbName());
}
