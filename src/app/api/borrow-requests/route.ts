import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

export const runtime = "nodejs";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) return fail("Request could not be verified.", 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return fail("Log in with a member account to request a book.", 401);
  if (session.role !== "member") return fail("Only members can request books.", 403);
  let body: { bookId?: unknown };
  try { body = await request.json(); } catch { return fail("Choose a valid book.", 400); }
  const bookId = typeof body.bookId === "string" && /^\d+$/.test(body.bookId) ? body.bookId : null;
  if (!bookId) return fail("Choose a valid book.", 400);
  if (!process.env.DATABASE_URL) return fail("Borrow requests are temporarily unavailable.", 503);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const memberResult = await client.query(
      `SELECT role, plan, paid_until > NOW() AS membership_active
       FROM members WHERE id = $1 FOR UPDATE`,
      [session.id],
    );
    const member = memberResult.rows[0] as { role: string; plan: string | null; membership_active: boolean } | undefined;
    if (!member || member.role !== "member") {
      await client.query("ROLLBACK");
      return fail("Only members can request books.", 403);
    }
    if (!member.membership_active) {
      await client.query("ROLLBACK");
      return fail("An active paid membership is required to request a book.", 403);
    }
    const planLimit = member.plan === "Basic" ? 2 : member.plan === "Standard" ? 4 : 0;
    if (!planLimit) {
      await client.query("ROLLBACK");
      return fail("Choose a valid membership plan before requesting a book.", 403);
    }
    const openCount = await client.query("SELECT COUNT(*)::int AS count FROM loans WHERE member_id = $1 AND returned_at IS NULL", [session.id]);
    if (Number(openCount.rows[0]?.count ?? 0) >= planLimit) {
      await client.query("ROLLBACK");
      return fail(`Your ${member.plan} plan allows up to ${planLimit} active books. Return a book before requesting another.`, 409);
    }
    const bookResult = await client.query("SELECT copies_available FROM books WHERE id = $1 FOR UPDATE", [bookId]);
    if (!bookResult.rows.length) {
      await client.query("ROLLBACK");
      return fail("That book could not be found.", 404);
    }
    const available = Number(bookResult.rows[0].copies_available);
    if (available < 1) {
      await client.query("ROLLBACK");
      return fail("There are no copies available. Join the waitlist instead.", 409);
    }
    const holds = await client.query(
      "SELECT member_id::text AS member_id FROM waitlist WHERE book_id = $1 AND hold_until > NOW() ORDER BY position FOR UPDATE",
      [bookId],
    );
    const holdsMyCopy = holds.rows.some((hold) => hold.member_id === session.id);
    if (holds.rows.length >= available && !holdsMyCopy) {
      await client.query("ROLLBACK");
      return fail("All available copies are being held for waitlisted members.", 409);
    }
    const duplicate = await client.query(
      "SELECT id::text AS id FROM borrow_requests WHERE member_id = $1 AND book_id = $2 AND status = 'pending' LIMIT 1",
      [session.id, bookId],
    );
    if (duplicate.rows.length) {
      await client.query("COMMIT");
      return NextResponse.json({ requestId: duplicate.rows[0].id, alreadyPending: true }, { status: 200 });
    }
    const inserted = await client.query(
      `INSERT INTO borrow_requests (member_id, book_id)
       VALUES ($1, $2) RETURNING id::text AS id, requested_at`,
      [session.id, bookId],
    );
    await client.query("COMMIT");
    return NextResponse.json({ requestId: inserted.rows[0].id, requestedAt: inserted.rows[0].requested_at }, { status: 201 });
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    console.error("Borrow request could not be created.");
    return fail("Borrow requests are temporarily unavailable. Please try again.", 503);
  } finally {
    client?.release();
    await pool.end();
  }
}
