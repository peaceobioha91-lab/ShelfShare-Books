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

const bookCoverIds: Record<string, number> = {
  "Things Fall Apart": 12816943,
  "No Longer at Ease": 6627849,
  "Arrow of God": 7135325,
  "A Man of the People": 6535892,
  "Anthills of the Savannah": 8372206,
  "Purple Hibiscus": 12063933,
  "Half of a Yellow Sun": 8472660,
  Americanah: 8474037,
  "We Should All Be Feminists": 11324542,
  "The Joys of Motherhood": 275135,
  "Second-Class Citizen": 275150,
  Efuru: 275035,
  "The Famished Road": 13858305,
  "Stay with Me": 10250668,
  "My Sister, the Serial Killer": 10721487,
  "The Concubine": 6706839,
  "The Fishermen": 9139289,
  Freshwater: 8456947,
};

const nonfictionBooks = [
  { title: "The 21 Irrefutable Laws of Leadership", author: "John C. Maxwell", category: "Leadership", coverId: 1465659, copies: 1 },
  { title: "Leaders Eat Last", author: "Simon Sinek", category: "Leadership", coverId: 8246311, copies: 2 },
  { title: "Dare to Lead", author: "Brené Brown", category: "Leadership", coverId: 10304768, copies: 2 },
  { title: "Good to Great", author: "Jim Collins", category: "Leadership", coverId: 7431270, copies: 2 },
  { title: "Start with Why", author: "Simon Sinek", category: "Leadership", coverId: 6395237, copies: 2 },
  { title: "How to Win Friends and Influence People", author: "Dale Carnegie", category: "Communication", coverId: 13314878, copies: 1 },
  { title: "Crucial Conversations", author: "Kerry Patterson, Joseph Grenny, Ron McMillan, Al Switzler", category: "Communication", coverId: 1711809, copies: 2 },
  { title: "Nonviolent Communication", author: "Marshall B. Rosenberg", category: "Communication", coverId: 940686, copies: 2 },
  { title: "Never Split the Difference", author: "Chris Voss, Tahl Raz", category: "Communication", coverId: 8365942, copies: 2 },
  { title: "Made to Stick", author: "Chip Heath, Dan Heath", category: "Communication", coverId: 7004880, copies: 2 },
  { title: "Atomic Habits", author: "James Clear", category: "Self-development", coverId: 12539702, copies: 1 },
  { title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", category: "Self-development", coverId: 10079937, copies: 2 },
  { title: "Mindset", author: "Carol S. Dweck", category: "Self-development", coverId: 746414, copies: 2 },
  { title: "Deep Work", author: "Cal Newport", category: "Self-development", coverId: 7988607, copies: 2 },
  { title: "The Power of Habit", author: "Charles Duhigg", category: "Self-development", coverId: 9078085, copies: 2 },
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
      const coverId = bookCoverIds[title];
      await client.query(
        `INSERT INTO books (title, author, category, cover_url, copies_total, copies_available)
         VALUES ($1, $2, $3, $4, 1, 1)
         ON CONFLICT (title, author) DO UPDATE SET cover_url = COALESCE(books.cover_url, EXCLUDED.cover_url)`,
        [title, author, category, coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null],
      );
    }
    for (const book of nonfictionBooks) {
      await client.query(
        `INSERT INTO books (title, author, category, cover_url, copies_total, copies_available)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (title, author) DO NOTHING`,
        [book.title, book.author, book.category, `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`, book.copies],
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
