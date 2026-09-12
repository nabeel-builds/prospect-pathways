import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { handler, ok } from "@/lib/utils";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  hashToken,
  verifyRefreshToken,
} from "@/lib/tokens";

/**
 * POST /api/auth/logout
 * Revokes the presented refresh token server-side and clears the cookie, so the
 * old token can never be replayed. Always answers 200 (logout is idempotent).
 */
export const POST = handler(async (request) => {
  const presented = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (presented) {
    const payload = verifyRefreshToken(presented);
    if (payload?.sub) {
      await connectDB();
      await User.updateOne(
        { _id: payload.sub },
        { $pull: { refreshTokens: { tokenHash: hashToken(presented) } } }
      );
    }
  }

  const response = ok({ message: "Signed out" });
  response.cookies.set(REFRESH_COOKIE_NAME, "", { ...refreshCookieOptions(), maxAge: 0 });
  return response;
});
