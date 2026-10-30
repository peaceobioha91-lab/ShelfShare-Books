import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user || user.role !== "librarian") return NextResponse.json({ error: "Librarian access is required." }, { status: 403 });
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
  try {
    const result = await pool.query(
      `INSERT INTO books (title, author, category, copies_total, copies_available)
       VALUES ($1, $2, $3, $4, $4) RETURNING id::text AS id`,
      [title, author, category, copiesTotal],
    );
    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return NextResponse.json({ error: "That title by this author is already in the catalogue." }, { status: 409 });
    console.error("Book creation failed.");
    return NextResponse.json({ error: "Book management is temporarily unavailable." }, { status: 503 });
  } finally {
    await pool.end();
  }
}
