import { NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/tokens";

/**
 * Edge middleware = first line of route protection for PAGES.
 *
 * It only checks whether a refresh-token cookie exists, because verifying a JWT
 * signature needs the secret and the Edge runtime cannot use `jsonwebtoken`.
 * The real security boundary is every API route calling `requireUser()`.
 */
const PROTECTED = [
  "/dashboard",
  "/accounts",
  "/contacts",
  "/pipeline",
  "/campaigns",
  "/tasks",
  "/icps",
  "/analytics",
  "/settings",
];

const AUTH_PAGES = ["/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE_NAME)?.value);

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
