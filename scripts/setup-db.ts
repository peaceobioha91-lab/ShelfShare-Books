import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { Pool } from "@neondatabase/serverless";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const books = [
  ["Things Fall Apart", "Chinua Achebe", "Nigerian Literature"],
  ["No Longer at Ease", "Chinua Achebe", "Nigerian Literature"],
  ["Arrow of God", "Chinua Achebe", "Nigerian Literature"],
  ["A Man of the People", "Chinua Achebe", "Nigerian Literature"],
  ["Anthills of the Savannah", "Chinua Achebe", "Nigerian Literature"],
  ["Purple Hibiscus", "Chimamanda Ngozi Adichie", "Nigerian Literature"],
  ["Half of a Yellow Sun", "Chimamanda Ngozi Adichie", "Nigerian Literature"],
  ["Americanah", "Chimamanda Ngozi Adichie", "Nigerian Literature"],
  ["We Should All Be Feminists", "Chimamanda Ngozi Adichie", "Essays"],
  ["The Joys of Motherhood", "Buchi Emecheta", "Nigerian Literature"],
  ["Second-Class Citizen", "Buchi Emecheta", "Nigerian Literature"],
  ["Efuru", "Flora Nwapa", "Nigerian Literature"],
  ["The Famished Road", "Ben Okri", "Nigerian Literature"],
  ["Stay with Me", "Ayọ̀bámi Adébáyọ̀", "Nigerian Literature"],
  ["My Sister, the Serial Killer", "Oyinkan Braithwaite", "Contemporary Fiction"],
  ["The Secret Lives of Baba Segi's Wives", "Lola Shoneyin", "Nigerian Literature"],
  ["The Concubine", "Elechi Amadi", "Nigerian Literature"],
  ["The Fishermen", "Chigozie Obioma", "Nigerian Literature"],
  ["Freshwater", "Akwaeke Emezi", "Contemporary Fiction"],
  ["Becoming Nigerian: A Guide", "Elnathan John", "Satire"],
] as const;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const librarianEmail = process.env.LIBRARIAN_EMAIL?.trim().toLowerCase();
  const librarianPassword = process.env.LIBRARIAN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!connectionString) throw new Error("DATABASE_URL is missing. Add your Neon connection string to .env.local.");
  if (!sessionSecret || Buffer.byteLength(sessionSecret, "utf8") < 32) throw new Error("Set SESSION_SECRET to a random secret of at least 32 bytes in .env.local.");
  if (!librarianEmail || !librarianPassword) {
    throw new Error("Set LIBRARIAN_EMAIL and LIBRARIAN_PASSWORD in .env.local before seeding the librarian account.");
  }
  if (librarianPassword.length < 12 || Buffer.byteLength(librarianPassword, "utf8") > 72) throw new Error("LIBRARIAN_PASSWORD must be 12 or more characters and no more than 72 bytes.");

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    const schema = await readFile(path.resolve(process.cwd(), "db/schema.sql"), "utf8");
    await client.query("BEGIN");
    for (const statement of schema.split(";").map((part) => part.trim()).filter(Boolean)) {
      await client.query(statement);
    }
    const passwordHash = await bcrypt.hash(librarianPassword, 12);
    await client.query(
      `INSERT INTO members (name, email, password_hash, role, plan)
       VALUES ($1, $2, $3, 'librarian', NULL)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'librarian'`,
      ["ShelfShare Librarian", librarianEmail, passwordHash],
    );
    for (const [title, author, category] of books) {
      await client.query(
        `INSERT INTO books (title, author, category, copies_total, copies_available)
         VALUES ($1, $2, $3, 1, 1)
         ON CONFLICT (title, author) DO NOTHING`,
        [title, author, category],
      );
    }
    await client.query("COMMIT");
    console.log(`Database ready: schema applied, ${books.length} books seeded, librarian ${librarianEmail} upserted.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database setup failed.");
  process.exitCode = 1;
});
