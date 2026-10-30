import "server-only";
import { neon } from "@neondatabase/serverless";

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  copies_total: number;
  copies_available: number;
};

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

export async function getBooks(): Promise<Book[] | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql`
    SELECT id::text AS id, title, author, category, copies_total, copies_available
    FROM books
    ORDER BY title ASC
  `;
  return rows as unknown as Book[];
}

export async function getBookById(id: string): Promise<Book | null | undefined> {
  const sql = getSql();
  if (!sql) return undefined;
  if (!/^\d+$/.test(id)) return null;

  const rows = await sql`
    SELECT id::text AS id, title, author, category, copies_total, copies_available
    FROM books
    WHERE id = ${id}
    LIMIT 1
  `;
  return (rows[0] as unknown as Book | undefined) ?? null;
}
