import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

export const runtime = "nodejs";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) return fail("Request could not be verified.", 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return fail("Log in with a member account to join a waitlist.", 401);
  if (session.role !== "member") return fail("Only members can join a waitlist.", 403);
  let body: { bookId?: unknown };
  try { body = await request.json(); } catch { return fail("Choose a valid book.", 400); }
  const bookId = typeof body.bookId === "string" && /^\d+$/.test(body.bookId) ? body.bookId : null;
  if (!bookId) return fail("Choose a valid book.", 400);
  if (!process.env.DATABASE_URL) return fail("The waitlist is temporarily unavailable.", 503);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const memberResult = await client.query("SELECT role FROM members WHERE id = $1", [session.id]);
    if (memberResult.rows[0]?.role !== "member") {
      await client.query("ROLLBACK");
      return fail("Only members can join a waitlist.", 403);
    }
    const bookResult = await client.query("SELECT copies_available FROM books WHERE id = $1 FOR UPDATE", [bookId]);
    if (!bookResult.rows.length) {
      await client.query("ROLLBACK");
      return fail("That book could not be found.", 404);
    }
    const existingResult = await client.query(
      "SELECT position, notified, hold_until FROM waitlist WHERE book_id = $1 AND member_id = $2",
      [bookId, session.id],
    );
    if (existingResult.rows.length) {
      const entry = existingResult.rows[0];
      await client.query("COMMIT");
      return NextResponse.json({ position: entry.position, notified: entry.notified, holdUntil: entry.hold_until }, { status: 200 });
    }
    if (Number(bookResult.rows[0].copies_available) > 0) {
      await client.query("ROLLBACK");
      return fail("A copy is available now. Borrow it from the catalogue.", 409);
    }
    const positionResult = await client.query("SELECT COALESCE(MAX(position), 0) + 1 AS position FROM waitlist WHERE book_id = $1", [bookId]);
    const insertResult = await client.query(
      `INSERT INTO waitlist (member_id, book_id, position)
       VALUES ($1, $2, $3)
       RETURNING position`,
      [session.id, bookId, positionResult.rows[0].position],
    );
    await client.query("COMMIT");
    return NextResponse.json({ position: insertResult.rows[0].position }, { status: 201 });
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    console.error("Waitlist join failed.");
    return fail("The waitlist is temporarily unavailable. Please try again.", 503);
  } finally {
    client?.release();
    await pool.end();
  }
}
