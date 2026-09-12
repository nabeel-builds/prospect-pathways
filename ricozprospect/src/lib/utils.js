import { NextResponse } from "next/server";
import mongoose from "mongoose";

/** Consistent success envelope: { success: true, data } */
export function ok(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Consistent error envelope: { success: false, error, details? }
 * Never pass a raw database/driver error message here.
 */
export function fail(error, status = 400, details) {
  return NextResponse.json({ success: false, error, details }, { status });
}

/** Wraps a route handler so unexpected errors never leak internals. */
export function handler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      if (err && err.statusCode) {
        return fail(err.message, err.statusCode);
      }
      // Duplicate key error from MongoDB
      if (err && err.code === 11000) {
        return fail("A record with these details already exists", 409);
      }
      console.error("[api]", err);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}

export class ApiError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

/** Reads pagination + search params in one place. */
export function readQuery(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search: (searchParams.get("search") || "").trim(),
    status: searchParams.get("status") || "",
    get: (key) => searchParams.get(key),
  };
}

/** Escapes user input before using it inside a RegExp query. */
export function safeRegex(value) {
  return new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export function serialize(doc) {
  return JSON.parse(JSON.stringify(doc));
}
