import { connectDB } from "./mongodb";
import User from "@/models/User";
import { ApiError } from "./utils";
import { verifyAccessToken } from "./tokens";

/**
 * requireUser(request)
 *
 * Every protected API route starts with this. It:
 *  1. reads the `Authorization: Bearer <accessToken>` header
 *  2. verifies the JWT signature and expiry
 *  3. loads the user (so a deleted/disabled user cannot keep using a token)
 *
 * Returns the Mongoose user document (without password).
 */
export async function requireUser(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new ApiError("Authentication required", 401);

  const payload = verifyAccessToken(token);
  if (!payload?.sub) throw new ApiError("Session expired", 401);

  await connectDB();
  const user = await User.findById(payload.sub).select("-password -refreshTokens");
  if (!user) throw new ApiError("Session expired", 401);

  return user;
}

/** Throws 403 unless the document belongs to the current user. */
export function assertOwner(doc, user) {
  if (!doc) throw new ApiError("Not found", 404);
  if (String(doc.owner) !== String(user._id)) {
    // 404 (not 403) so we never confirm that another user's record exists.
    throw new ApiError("Not found", 404);
  }
  return doc;
}

export async function requireAdmin(request) {
  const user = await requireUser(request);
  if (user.role !== "admin") throw new ApiError("Admin access required", 403);
  return user;
}
