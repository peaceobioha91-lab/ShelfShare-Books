import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/session";
import { compactWaitlistPositions } from "@/lib/waitlist-queue";
import { sendWaitlistHoldEmail } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  }
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Log in as a librarian to check in books." }, { status: 401 });
  if (session.role !== "librarian") return NextResponse.json({ error: "Only librarians can check in books." }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Loan not found." }, { status: 404 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Check-in is temporarily unavailable." }, { status: 503 });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const librarian = await client.query("SELECT role FROM members WHERE id = $1", [session.id]);
    if (librarian.rows[0]?.role !== "librarian") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Only librarians can check in books." }, { status: 403 });
    }
    const loanResult = await client.query(
      "SELECT book_id::text AS book_id, returned_at FROM loans WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!loanResult.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }
    if (loanResult.rows[0].returned_at) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This book has already been checked in." }, { status: 409 });
    }
    const bookId = String(loanResult.rows[0].book_id);
    const bookResult = await client.query("SELECT copies_available, copies_total FROM books WHERE id = $1 FOR UPDATE", [bookId]);
    if (!bookResult.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "The book record could not be found." }, { status: 404 });
    }

    await client.query("UPDATE loans SET returned_at = NOW(), status = 'returned' WHERE id = $1", [id]);
    await client.query(
      "UPDATE books SET copies_available = LEAST(copies_total, copies_available + 1) WHERE id = $1",
      [bookId],
    );

    const expired = await client.query(
      "DELETE FROM waitlist WHERE book_id = $1 AND hold_until IS NOT NULL AND hold_until <= NOW()",
      [bookId],
    );
    if (Number(expired.rowCount ?? 0) > 0) await compactWaitlistPositions(client, bookId);

    const activeHold = await client.query(
      "SELECT id FROM waitlist WHERE book_id = $1 AND hold_until > NOW() ORDER BY position FOR UPDATE",
      [bookId],
    );
    const available = Number(bookResult.rows[0].copies_available) + 1;
    let activeHolds = activeHold.rows.length;
    let promotedHoldUntil: Date | null = null;
    const promotedIds: string[] = [];
    while (activeHolds < available) {
      const next = await client.query(
        "SELECT id FROM waitlist WHERE book_id = $1 AND (hold_until IS NULL OR hold_until <= NOW()) ORDER BY position LIMIT 1 FOR UPDATE",
        [bookId],
      );
      if (!next.rows.length) break;
      const notified = await client.query(
        `UPDATE waitlist SET notified = FALSE, email_claimed_at = NULL, email_sent_at = NULL,
           hold_until = NOW() + INTERVAL '48 hours'
         WHERE id = $1 RETURNING id::text AS id, hold_until`,
        [next.rows[0].id],
      );
      promotedHoldUntil ??= notified.rows[0].hold_until as Date;
      promotedIds.push(String(notified.rows[0].id));
      activeHolds += 1;
    }

    await client.query("COMMIT");
    let emailsSent = 0;
    for (const waitlistId of promotedIds) if (await sendWaitlistHoldEmail(waitlistId)) emailsSent += 1;
    return NextResponse.json({ returned: true, holdUntil: promotedHoldUntil, emailsSent }, { status: 200 });
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    console.error("Book check-in failed.");
    return NextResponse.json({ error: "Check-in is temporarily unavailable. Please try again." }, { status: 503 });
  } finally {
    client?.release();
    await pool.end();
  }
}
