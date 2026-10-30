import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/session";
import { compactWaitlistPositions } from "@/lib/waitlist-queue";
import { sendWaitlistHoldEmail } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  const librarian = await getCurrentUser();
  if (!librarian || librarian.role !== "librarian") return NextResponse.json({ error: "Only librarians can review borrow requests." }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  let body: { decision?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 }); }
  if (body.decision !== "approve" && body.decision !== "reject") return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Request review is temporarily unavailable." }, { status: 503 });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const requestResult = await client.query(
      `SELECT id::text AS id, member_id::text AS member_id, book_id::text AS book_id, status
       FROM borrow_requests WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const borrowRequest = requestResult.rows[0] as { id: string; member_id: string; book_id: string; status: string } | undefined;
    if (!borrowRequest) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (borrowRequest.status !== "pending") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This request has already been reviewed." }, { status: 409 });
    }
    if (body.decision === "reject") {
      await client.query(
        "UPDATE borrow_requests SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $2 WHERE id = $1",
        [id, librarian.id],
      );
      await client.query("COMMIT");
      return NextResponse.json({ status: "rejected" });
    }

    const memberResult = await client.query(
      `SELECT role, plan, paid_until > NOW() AS membership_active
       FROM members WHERE id = $1 FOR UPDATE`,
      [borrowRequest.member_id],
    );
    const member = memberResult.rows[0] as { role: string; plan: string | null; membership_active: boolean } | undefined;
    if (!member || member.role !== "member" || !member.membership_active) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "The member needs an active paid membership before approval." }, { status: 409 });
    }
    const planLimit = member.plan === "Basic" ? 2 : member.plan === "Standard" ? 4 : 0;
    if (!planLimit) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "The member needs an active membership plan before approval." }, { status: 409 });
    }
    const loanCount = await client.query("SELECT COUNT(*)::int AS count FROM loans WHERE member_id = $1 AND returned_at IS NULL", [borrowRequest.member_id]);
    if (Number(loanCount.rows[0]?.count ?? 0) >= planLimit) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: `This member has reached the ${member.plan} plan limit of ${planLimit} books.` }, { status: 409 });
    }

    const bookResult = await client.query("SELECT copies_available FROM books WHERE id = $1 FOR UPDATE", [borrowRequest.book_id]);
    if (!bookResult.rows.length || Number(bookResult.rows[0].copies_available) < 1) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "No copies are currently available." }, { status: 409 });
    }
    const expired = await client.query(
      "DELETE FROM waitlist WHERE book_id = $1 AND hold_until IS NOT NULL AND hold_until <= NOW()",
      [borrowRequest.book_id],
    );
    if (Number(expired.rowCount ?? 0) > 0) await compactWaitlistPositions(client, borrowRequest.book_id);
    const holds = await client.query(
      "SELECT member_id::text AS member_id FROM waitlist WHERE book_id = $1 AND hold_until > NOW() ORDER BY position FOR UPDATE",
      [borrowRequest.book_id],
    );
    const holdsMyCopy = holds.rows.some((hold) => hold.member_id === borrowRequest.member_id);
    if (holds.rows.length >= Number(bookResult.rows[0].copies_available) && !holdsMyCopy) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Available copies are being held for waitlisted members." }, { status: 409 });
    }
    if (holds.rows.length === 0) {
      const next = await client.query(
        "SELECT id, member_id::text AS member_id FROM waitlist WHERE book_id = $1 ORDER BY position LIMIT 1 FOR UPDATE",
        [borrowRequest.book_id],
      );
      if (next.rows.length && next.rows[0].member_id !== borrowRequest.member_id) {
        const promoted = await client.query(
          `UPDATE waitlist SET notified = FALSE, email_claimed_at = NULL, email_sent_at = NULL,
           hold_until = NOW() + INTERVAL '48 hours' WHERE id = $1 RETURNING id::text AS id`,
          [next.rows[0].id],
        );
        await client.query("COMMIT");
        await sendWaitlistHoldEmail(String(promoted.rows[0].id));
        return NextResponse.json({ error: "The next waitlisted member has been given a 48-hour hold." }, { status: 409 });
      }
    }

    const loan = await client.query(
      `INSERT INTO loans (member_id, book_id, due_at)
       VALUES ($1, $2, NOW() + INTERVAL '14 days') RETURNING id::text AS id`,
      [borrowRequest.member_id, borrowRequest.book_id],
    );
    await client.query("UPDATE books SET copies_available = copies_available - 1 WHERE id = $1", [borrowRequest.book_id]);
    const queueEntry = await client.query("DELETE FROM waitlist WHERE book_id = $1 AND member_id = $2", [borrowRequest.book_id, borrowRequest.member_id]);
    if (Number(queueEntry.rowCount ?? 0) > 0) await compactWaitlistPositions(client, borrowRequest.book_id);
    await client.query(
      `UPDATE borrow_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by = $2, loan_id = $3
       WHERE id = $1`,
      [id, librarian.id, loan.rows[0].id],
    );
    await client.query("COMMIT");
    return NextResponse.json({ status: "approved", loanId: loan.rows[0].id });
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    console.error("Borrow request review failed.");
    return NextResponse.json({ error: "Request review is temporarily unavailable." }, { status: 503 });
  } finally {
    client?.release();
    await pool.end();
  }
}
