import { BookCatalogue } from "@/components/BookCatalogue";
import { getBooks } from "@/lib/books";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catalogue", description: "Search the Ekenwan Community Library catalogue by book title, author or category. Based in Benin City, Edo State." };

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  let books = null;
  try {
    books = await getBooks();
  } catch {
    books = null;
  }

  return <div className="container py-12 md:py-16"><div className="max-w-2xl"><p className="eyebrow mb-3">Find your next favourite</p><h1 className="serif-title text-4xl text-[#173b2e] md:text-5xl">The catalogue</h1><p className="mt-4 text-[15px] leading-7 text-[#68736b]">Browse the Ekenwan Community Library collection. Search by title or author, or narrow the shelves by category.</p></div>
    {books === null ? <div role="status" className="card mt-8 p-6"><h2 className="serif-title text-xl text-[#173b2e]">Catalogue temporarily unavailable</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">We can’t reach the library catalogue right now. Please check back shortly or visit us on Ekenwan Road, Benin City.</p></div> : books.length ? <BookCatalogue books={books} /> : <div className="card mt-8 p-6"><h2 className="serif-title text-xl text-[#173b2e]">The shelves are waiting</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">No books are listed yet. Visit the library on Ekenwan Road, Benin City, to browse in person.</p></div>}
  </div>;
}
