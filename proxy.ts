import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login (sign-in page)
     * - /api/auth (NextAuth endpoints)
     * - /api/discord (Discord webhook — uses its own signature verification)
     * - /_next, /favicon.ico, static assets
     */
    "/((?!login|api/auth|api/discord|_next|favicon\\.ico).*)",
  ],
};
