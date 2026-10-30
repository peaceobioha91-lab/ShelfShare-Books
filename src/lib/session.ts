import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findMemberById, type AuthMember } from "@/lib/auth-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

export { createSessionToken } from "@/lib/session-token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getCurrentUser(): Promise<AuthMember | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const member = await findMemberById(session.id);
  return member?.role === session.role ? member : null;
}
