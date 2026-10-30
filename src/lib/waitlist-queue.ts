import "server-only";
import type { PoolClient } from "@neondatabase/serverless";

export async function compactWaitlistPositions(client: PoolClient, bookId: string) {
  const result = await client.query(
    "SELECT id::text AS id, position FROM waitlist WHERE book_id = $1 ORDER BY position FOR UPDATE",
    [bookId],
  );
  const entries = result.rows as Array<{ id: string; position: number }>;
  if (!entries.length) return;

  // Move the existing values out of the final range before writing contiguous positions.
  const offset = entries[entries.length - 1].position + entries.length + 1;
  await client.query("UPDATE waitlist SET position = position + $2 WHERE book_id = $1", [bookId, offset]);
  for (const [index, entry] of entries.entries()) {
    await client.query("UPDATE waitlist SET position = $2 WHERE id = $1", [entry.id, index + 1]);
  }
}
