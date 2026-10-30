import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getBooks } from "@/lib/books";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage books", description: "Manage the Ekenwan Community Library collection and copy availability." };

export const dynamic = "force-dynamic";

export default async function LibrarianBooksPage() {
  let books = null;
  try { books = await getBooks(); } catch { books = null; }
  return <div className="container py-10 md:py-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">Collection</p><h1 className="serif-title text-4xl text-[#173b2e]">Manage books</h1><p className="mt-3 text-sm text-[#68736b]">Add titles, update details, and keep copy counts current.</p></div><Link href="/librarian/books/new" className="btn"><Plus size={16}/> Add a book</Link></div>{books === null ? <div role="status" className="card mt-7 p-5 text-sm text-[#68736b]">The catalogue is temporarily unavailable.</div> : books.length === 0 ? <div className="card mt-7 p-6 text-sm text-[#68736b]">There are no books in the catalogue yet.</div> : <div className="mt-7 grid gap-3">{books.map((book) => <article key={book.id} className="card flex flex-wrap items-center justify-between gap-4 p-4 md:px-5"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899389]">{book.category}</p><h2 className="serif-title mt-1 text-xl">{book.title}</h2><p className="mt-1 text-sm text-[#68736b]">{book.author}</p></div><div className="flex items-center gap-5"><span className="text-xs text-[#536058]">{book.copies_available} of {book.copies_total} available</span><Link href={`/librarian/books/${book.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#214d3c]">Edit <ArrowRight size={14}/></Link></div></article>)}</div>}</div>;
}
