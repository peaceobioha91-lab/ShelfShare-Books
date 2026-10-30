import "server-only";
import { neon } from "@neondatabase/serverless";

export type MemberLoan = {
  id: string;
  book_id: string;
  title: string;
  author: string;
  category: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  status: "borrowed" | "returned" | "overdue";
};

export type OpenLoan = {
  id: string;
  member_name: string;
  member_email: string;
  book_title: string;
  book_author: string;
  due_at: string;
};

export type PendingBorrowRequest = {
  id: string;
  member_name: string;
  member_email: string;
  member_plan: string | null;
  paid_until: string | null;
  book_id: string;
  book_title: string;
  book_author: string;
  copies_available: number;
  requested_at: string;
};

export type OverdueLoan = OpenLoan & { days_late: number };

export async function getMemberLoans(memberId: string): Promise<MemberLoan[] | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const sql = neon(connectionString);
  const rows = await sql`
    SELECT l.id::text AS id, b.id::text AS book_id, b.title, b.author, b.category,
           l.borrowed_at::text AS borrowed_at, l.due_at::text AS due_at,
           l.returned_at::text AS returned_at,
           CASE WHEN l.returned_at IS NOT NULL THEN 'returned'
                WHEN l.due_at < NOW() THEN 'overdue'
                ELSE 'borrowed' END AS status
    FROM loans l
    JOIN books b ON b.id = l.book_id
    WHERE l.member_id = ${memberId}
    ORDER BY (l.returned_at IS NULL) DESC, l.due_at ASC
  `;
  return rows as unknown as MemberLoan[];
}

export async function getOpenLoans(): Promise<OpenLoan[] | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const sql = neon(connectionString);
  const rows = await sql`
    SELECT l.id::text AS id, m.name AS member_name, m.email AS member_email,
           b.title AS book_title, b.author AS book_author, l.due_at::text AS due_at
    FROM loans l
    JOIN members m ON m.id = l.member_id
    JOIN books b ON b.id = l.book_id
    WHERE l.returned_at IS NULL
    ORDER BY l.due_at ASC
  `;
  return rows as unknown as OpenLoan[];
}

export async function getPendingBorrowRequests(): Promise<PendingBorrowRequest[] | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const sql = neon(connectionString);
  const rows = await sql`
    SELECT r.id::text AS id, m.name AS member_name, m.email AS member_email,
           m.plan AS member_plan, m.paid_until::text AS paid_until,
           b.id::text AS book_id, b.title AS book_title, b.author AS book_author,
           b.copies_available, r.requested_at::text AS requested_at
    FROM borrow_requests r
    JOIN members m ON m.id = r.member_id
    JOIN books b ON b.id = r.book_id
    WHERE r.status = 'pending'
    ORDER BY r.requested_at ASC
  `;
  return rows as unknown as PendingBorrowRequest[];
}

export async function getOverdueLoans(): Promise<OverdueLoan[] | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const sql = neon(connectionString);
  const rows = await sql`
    SELECT l.id::text AS id, m.name AS member_name, m.email AS member_email,
           b.title AS book_title, b.author AS book_author, l.due_at::text AS due_at,
           GREATEST(1, CEIL(EXTRACT(EPOCH FROM (NOW() - l.due_at)) / 86400))::int AS days_late
    FROM loans l
    JOIN members m ON m.id = l.member_id
    JOIN books b ON b.id = l.book_id
    WHERE l.returned_at IS NULL AND l.due_at < NOW()
    ORDER BY l.due_at ASC
  `;
  return rows as unknown as OverdueLoan[];
}
