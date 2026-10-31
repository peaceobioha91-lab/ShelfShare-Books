import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

function loginRedirect(request: NextRequest) {
  const destination = new URL("/login", request.url);
  destination.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(destination);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return loginRedirect(request);

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/librarian") && session.role !== "librarian") {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }
  if (pathname.startsWith("/member") && session.role !== "member") {
    return NextResponse.redirect(new URL("/librarian", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/member/:path*", "/librarian/:path*"] };
