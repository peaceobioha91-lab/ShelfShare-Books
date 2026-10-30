import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "shelfshare_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function isSessionSecretConfigured() {
  return getSessionKey() !== null;
}

export async function createSessionToken(member: { id: string; role: "member" | "librarian" }) {
  const key = getSessionKey();
  if (!key) throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  return new SignJWT({ role: member.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(member.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

export async function verifySessionToken(token: string) {
  const key = getSessionKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (!payload.sub || (payload.role !== "member" && payload.role !== "librarian")) return null;
    return { id: payload.sub, role: payload.role } as const;
  } catch {
    return null;
  }
}
