import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user || user.role !== "librarian") return NextResponse.json({ error: "Librarian access is required." }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  let body: { title?: unknown; author?: unknown; category?: unknown; copiesTotal?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter valid book details." }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const copiesTotal = body.copiesTotal;
  if (!title || title.length > 200 || !author || author.length > 160 || !category || category.length > 80 || typeof copiesTotal !== "number" || !Number.isInteger(copiesTotal) || copiesTotal < 0 || copiesTotal > 10000) {
    return NextResponse.json({ error: "Check the title, author, category, and copy count." }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Book management is temporarily unavailable." }, { status: 503 });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const book = await client.query("SELECT id FROM books WHERE id = $1 FOR UPDATE", [id]);
    if (!book.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }
    const loans = await client.query("SELECT COUNT(*)::int AS count FROM loans WHERE book_id = $1 AND returned_at IS NULL", [id]);
    const activeLoans = Number(loans.rows[0]?.count ?? 0);
    if (copiesTotal < activeLoans) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: `${activeLoans} ${activeLoans === 1 ? "copy is" : "copies are"} currently on loan. Total copies can’t be set below that.` }, { status: 409 });
    }
    await client.query(
      `UPDATE books SET title = $2, author = $3, category = $4,
       copies_total = $5, copies_available = $5 - $6 WHERE id = $1`,
      [id, title, author, category, copiesTotal, activeLoans],
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return NextResponse.json({ error: "That title by this author is already in the catalogue." }, { status: 409 });
    console.error("Book update failed.");
    return NextResponse.json({ error: "Book management is temporarily unavailable." }, { status: 503 });
  } finally {
    client?.release();
    await pool.end();
  }
}
