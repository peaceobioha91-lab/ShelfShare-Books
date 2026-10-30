import "server-only";
import { neon } from "@neondatabase/serverless";

export type AuthMember = {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: "member" | "librarian";
};

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

export async function findMemberByEmail(email: string): Promise<AuthMember | null> {
  const sql = getSql();
  if (!sql) throw new Error("Database is not configured.");
  const rows = await sql`
    SELECT id::text AS id, name, email, password_hash, role
    FROM members WHERE email = ${email} LIMIT 1
  `;
  return (rows[0] as unknown as AuthMember | undefined) ?? null;
}

export async function findMemberById(id: string): Promise<AuthMember | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id::text AS id, name, email, role
    FROM members WHERE id = ${id} LIMIT 1
  `;
  return (rows[0] as unknown as AuthMember | undefined) ?? null;
}

export async function insertMember(input: {
  name: string;
  email: string;
  passwordHash: string;
  plan: "Basic" | "Standard";
}): Promise<AuthMember> {
  const sql = getSql();
  if (!sql) throw new Error("Database is not configured.");
  const rows = await sql`
    INSERT INTO members (name, email, password_hash, role, plan)
    VALUES (${input.name}, ${input.email}, ${input.passwordHash}, 'member', ${input.plan})
    RETURNING id::text AS id, name, email, role
  `;
  return rows[0] as unknown as AuthMember;
}
