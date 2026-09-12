import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { handler, ok, fail } from "@/lib/utils";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  refreshExpiryDate,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/tokens";

/**
 * POST /api/auth/refresh
 *
 * Rotation: the presented refresh token is deleted and replaced with a new one.
 * If a token that is not in the user's session list is presented (i.e. it was
 * already rotated - a sign of theft or replay), every session is revoked.
 */
export const POST = handler(async (request) => {
  const presented = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!presented) return fail("No active session", 401);

  const payload = verifyRefreshToken(presented);
  if (!payload?.sub) return clearAndFail("Session expired");

  await connectDB();
  const user = await User.findById(payload.sub).select("+refreshTokens");
  if (!user) return clearAndFail("Session expired");

  const tokenHash = hashToken(presented);
  const session = user.refreshTokens.find(
    (s) => s.tokenHash === tokenHash && s.jti === payload.jti
  );

  if (!session) {
    // Reuse of an already-rotated token -> revoke everything.
    user.refreshTokens = [];
    await user.save();
    return clearAndFail("Session invalidated. Please sign in again.");
  }

  if (session.expiresAt < new Date()) {
    user.refreshTokens = user.refreshTokens.filter((s) => s.jti !== payload.jti);
    await user.save();
    return clearAndFail("Session expired");
  }

  const accessToken = signAccessToken(user);
  const { token: newRefresh, jti } = signRefreshToken(user);

  user.refreshTokens = user.refreshTokens.filter((s) => s.jti !== payload.jti);
  user.refreshTokens.push({
    jti,
    tokenHash: hashToken(newRefresh),
    expiresAt: refreshExpiryDate(),
    userAgent: request.headers.get("user-agent") || "",
  });
  await user.save();

  const response = ok({ user: user.toJSON(), accessToken });
  response.cookies.set(REFRESH_COOKIE_NAME, newRefresh, refreshCookieOptions());
  return response;
});

function clearAndFail(message) {
  const response = fail(message, 401);
  response.cookies.set(REFRESH_COOKIE_NAME, "", { ...refreshCookieOptions(), maxAge: 0 });
  return response;
}
