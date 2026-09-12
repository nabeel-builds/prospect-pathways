import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * MongoDB connection on every reload and exhaust the connection pool. We cache
 * the connection promise on `globalThis` so it survives reloads.
 */
const globalForMongoose = globalThis;

if (!globalForMongoose._mongoose) {
  globalForMongoose._mongoose = { conn: null, promise: null };
}

const cached = globalForMongoose._mongoose;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
