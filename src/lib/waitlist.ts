import "server-only";
import { neon } from "@neondatabase/serverless";

export type MemberWaitlistEntry = {
  id: string;
  book_id: string;
  title: string;
  author: string;
  category: string;
  position: number;
  joined_at: string;
  notified: boolean;
  hold_until: string | null;
};

export async function getMemberWaitlist(memberId: string): Promise<MemberWaitlistEntry[] | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const sql = neon(connectionString);
  const rows = await sql`
    SELECT w.id::text AS id, b.id::text AS book_id, b.title, b.author, b.category,
           w.position, w.joined_at::text AS joined_at, w.notified,
           w.hold_until::text AS hold_until
    FROM waitlist w
    JOIN books b ON b.id = w.book_id
    WHERE w.member_id = ${memberId}
    ORDER BY w.joined_at ASC
  `;
  return rows as unknown as MemberWaitlistEntry[];
}
