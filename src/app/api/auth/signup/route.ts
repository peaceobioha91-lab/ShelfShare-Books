import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { insertMember } from "@/lib/auth-data";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { isSessionSecretConfigured } from "@/lib/session-token";

export const runtime = "nodejs";

function isSameOriginJson(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin && request.headers.get("content-type")?.startsWith("application/json");
}

export async function POST(request: NextRequest) {
  if (!isSameOriginJson(request)) return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  if (!isSessionSecretConfigured()) return NextResponse.json({ error: "Sign-up is not configured yet. Please try again later." }, { status: 503 });
  let body: { name?: unknown; email?: unknown; password?: unknown; plan?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter valid sign-up details." }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const plan = body.plan === "Standard" ? "Standard" : body.plan === "Basic" ? "Basic" : null;
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !plan) {
    return NextResponse.json({ error: "Check your name, email address, and membership plan." }, { status: 400 });
  }
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json({ error: "Use a password between 12 and 72 bytes." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const member = await insertMember({ name, email, passwordHash, plan });
    const token = await createSessionToken(member);
    const response = NextResponse.json({ redirectTo: "/member" }, { status: 201 });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "An account with that email already exists. Log in instead." }, { status: 409 });
    }
    console.error("Sign-up failed.");
    return NextResponse.json({ error: "Sign-up is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
