import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/session";
import { compactWaitlistPositions } from "@/lib/waitlist-queue";
import { sendWaitlistHoldEmail } from "@/lib/notifications";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Log in to manage your waitlist." }, { status: 401 });
  if (session.role !== "member") return NextResponse.json({ error: "Only members can leave a waitlist." }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Waitlist entry not found." }, { status: 404 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "The waitlist is temporarily unavailable." }, { status: 503 });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const entryResult = await client.query("SELECT book_id::text AS book_id, (hold_until > NOW()) AS active_hold FROM waitlist WHERE id = $1 AND member_id = $2", [id, session.id]);
    if (!entryResult.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Waitlist entry not found." }, { status: 404 });
    }
    const bookId = String(entryResult.rows[0].book_id);
    const book = await client.query("SELECT copies_available FROM books WHERE id = $1 FOR UPDATE", [bookId]);
    await client.query("DELETE FROM waitlist WHERE id = $1 AND member_id = $2", [id, session.id]);
    await compactWaitlistPositions(client, bookId);
    let promotedId: string | null = null;
    if (entryResult.rows[0].active_hold && book.rows.length) {
      const active = await client.query("SELECT COUNT(*)::int AS count FROM waitlist WHERE book_id = $1 AND hold_until > NOW()", [bookId]);
      if (Number(active.rows[0]?.count ?? 0) < Number(book.rows[0].copies_available)) {
        const next = await client.query("SELECT id FROM waitlist WHERE book_id = $1 AND hold_until IS NULL ORDER BY position LIMIT 1 FOR UPDATE", [bookId]);
        if (next.rows.length) {
          const promoted = await client.query(
            `UPDATE waitlist SET notified = FALSE, email_claimed_at = NULL, email_sent_at = NULL,
             hold_until = NOW() + INTERVAL '48 hours' WHERE id = $1 RETURNING id::text AS id`,
            [next.rows[0].id],
          );
          promotedId = String(promoted.rows[0]?.id ?? "") || null;
        }
      }
    }
    await client.query("COMMIT");
    if (promotedId) await sendWaitlistHoldEmail(promotedId);
    return NextResponse.json({ ok: true });
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    console.error("Waitlist removal failed.");
    return NextResponse.json({ error: "The waitlist is temporarily unavailable. Please try again." }, { status: 503 });
  } finally {
    client?.release();
    await pool.end();
  }
}
