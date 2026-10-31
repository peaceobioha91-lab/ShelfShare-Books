import "server-only";
import { neon } from "@neondatabase/serverless";

export async function getLibrarianDashboard() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Database is not configured.");
  const sql = neon(connectionString);
  const [counts, waitlists] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*)::int FROM books) AS books,
        (SELECT COUNT(*)::int FROM members WHERE role = 'member') AS members,
        (SELECT COUNT(*)::int FROM loans WHERE returned_at IS NULL) AS active_loans,
        (SELECT COUNT(*)::int FROM loans WHERE returned_at IS NULL AND due_at < NOW()) AS overdue_loans
    `,
    sql`
      SELECT b.id::text AS book_id, b.title, b.author,
             w.id::text AS entry_id, w.position, m.name AS member_name, m.email AS member_email
      FROM books b
      LEFT JOIN waitlist w ON w.book_id = b.id
      LEFT JOIN members m ON m.id = w.member_id
      ORDER BY b.title ASC, w.position ASC
    `,
  ]);
  return {
    counts: (counts[0] ?? { books: 0, members: 0, active_loans: 0, overdue_loans: 0 }) as {
      books: number; members: number; active_loans: number; overdue_loans: number;
    },
    waitlistRows: waitlists as unknown as Array<{
      book_id: string; title: string; author: string; entry_id: string | null;
      position: number | null; member_name: string | null; member_email: string | null;
    }>,
  };
}
