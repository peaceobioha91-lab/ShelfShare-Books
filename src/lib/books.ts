import "server-only";
import { neon } from "@neondatabase/serverless";

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  cover_url: string | null;
  copies_total: number;
  copies_available: number;
  waitlist_count: number;
};

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

export async function getBooks(): Promise<Book[] | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql`
    SELECT b.id::text AS id, b.title, b.author, b.category, b.cover_url,
           b.copies_total, b.copies_available,
           (SELECT COUNT(*)::int FROM waitlist w WHERE w.book_id = b.id) AS waitlist_count
    FROM books b
    ORDER BY title ASC
  `;
  return rows as unknown as Book[];
}

export async function getBookById(id: string): Promise<Book | null | undefined> {
  const sql = getSql();
  if (!sql) return undefined;
  if (!/^\d+$/.test(id)) return null;

  const rows = await sql`
    SELECT b.id::text AS id, b.title, b.author, b.category, b.cover_url,
           b.copies_total, b.copies_available,
           (SELECT COUNT(*)::int FROM waitlist w WHERE w.book_id = b.id) AS waitlist_count
    FROM books b
    WHERE b.id = ${id}
    LIMIT 1
  `;
  return (rows[0] as unknown as Book | undefined) ?? null;
}
