import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { handler, ok, fail } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  refreshExpiryDate,
  hashToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/tokens";

/**
 * POST /api/auth/login
 * The error message is deliberately identical for "no such user" and "wrong
 * password" so the endpoint cannot be used to discover registered emails.
 */
export const POST = handler(async (request) => {
  const body = await readBody(request);
  const data = validate(
    {
      email: { required: true, type: "email", label: "Email" },
      password: { required: true, label: "Password" },
    },
    body
  );

  await connectDB();

  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user) return fail("Invalid email or password", 401);

  const valid = await user.comparePassword(data.password);
  if (!valid) return fail("Invalid email or password", 401);

  const accessToken = signAccessToken(user);
  const { token: refreshToken, jti } = signRefreshToken(user);

  await User.updateOne(
    { _id: user._id },
    {
      // Drop expired sessions while we are here, then add the new one.
      $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } },
    }
  );
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          jti,
          tokenHash: hashToken(refreshToken),
          expiresAt: refreshExpiryDate(),
          userAgent: request.headers.get("user-agent") || "",
        },
      },
    }
  );

  const response = ok({ user: user.toJSON(), accessToken });
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return response;
});
