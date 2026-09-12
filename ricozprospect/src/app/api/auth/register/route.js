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
 * POST /api/auth/register
 * validate -> hash password (model hook) -> create user -> issue tokens
 */
export const POST = handler(async (request) => {
  const body = await readBody(request);
  const data = validate(
    {
      name: { required: true, label: "Name", max: 80 },
      email: { required: true, type: "email", label: "Email" },
      password: { required: true, type: "password", label: "Password" },
    },
    body
  );

  await connectDB();

  const existing = await User.findOne({ email: data.email });
  if (existing) return fail("An account with this email already exists", 409);

  const user = await User.create(data);

  const accessToken = signAccessToken(user);
  const { token: refreshToken, jti } = signRefreshToken(user);

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

  const response = ok({ user: user.toJSON(), accessToken }, 201);
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return response;
});
