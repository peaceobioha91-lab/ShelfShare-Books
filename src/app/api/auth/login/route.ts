import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findMemberByEmail } from "@/lib/auth-data";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { isSessionSecretConfigured } from "@/lib/session-token";

export const runtime = "nodejs";

function isSameOriginJson(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin && request.headers.get("content-type")?.startsWith("application/json");
}

export async function POST(request: NextRequest) {
  if (!isSameOriginJson(request)) return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  if (!isSessionSecretConfigured()) return NextResponse.json({ error: "Login is not configured yet. Please try again later." }, { status: 503 });
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter your email and password." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || password.length > 72) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });

  try {
    const member = await findMemberByEmail(email);
    const valid = member?.password_hash ? await bcrypt.compare(password, member.password_hash) : false;
    if (!member || !valid) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    const token = await createSessionToken(member);
    const response = NextResponse.json({ role: member.role }, { status: 200 });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login failed.");
    return NextResponse.json({ error: "Login is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
