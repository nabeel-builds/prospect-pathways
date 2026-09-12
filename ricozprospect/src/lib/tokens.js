import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * Token helpers.
 *
 * Access token  -> short-lived JWT, sent in the `Authorization: Bearer` header,
 *                  kept in memory on the client. Payload holds only `sub` (user
 *                  id) and `role`. Never put secrets or emails in it.
 * Refresh token -> long-lived JWT, stored in an HTTP-only cookie. It also has a
 *                  random `jti`; a SHA-256 hash of the token is stored on the
 *                  user document so we can rotate and revoke sessions.
 */

const ACCESS_SECRET = () => requireEnv("ACCESS_TOKEN_SECRET");
const REFRESH_SECRET = () => requireEnv("REFRESH_TOKEN_SECRET");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export const REFRESH_COOKIE_NAME = "rp_refresh";

export function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, ACCESS_SECRET(), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    issuer: "ricozprospect",
  });
}

export function signRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: String(user._id), jti }, REFRESH_SECRET(), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    issuer: "ricozprospect",
  });
  return { token, jti };
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET(), { issuer: "ricozprospect" });
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET(), { issuer: "ricozprospect" });
  } catch {
    return null;
  }
}

/** We never store raw refresh tokens - only a hash, like a password. */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Cookie options for the refresh token cookie. */
export function refreshCookieOptions() {
  const days = parseDays(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");
  return {
    httpOnly: true, // not readable from JavaScript -> blocks XSS token theft
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // blocks most CSRF while allowing normal navigation
    path: "/",
    maxAge: days * 24 * 60 * 60,
  };
}

function parseDays(value) {
  const match = /^(\d+)\s*([dhm])$/.exec(String(value).trim());
  if (!match) return 7;
  const amount = Number(match[1]);
  if (match[2] === "d") return amount;
  if (match[2] === "h") return amount / 24;
  return amount / (24 * 60);
}

export function refreshExpiryDate() {
  const days = parseDays(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
