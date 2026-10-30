import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBookById } from "@/lib/books";
import { BookEditor } from "@/components/BookEditor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit book", description: "Edit a title in the Ekenwan Community Library catalogue." };

export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let book;
  try { book = await getBookById(id); } catch { book = undefined; }
  if (book === null) notFound();
  if (!book) return <div className="container py-12"><p role="status" className="card p-6 text-sm text-[#68736b]">Book details are temporarily unavailable.</p></div>;
  return <div className="container py-10 md:py-14"><Link href="/librarian/books" className="inline-flex items-center gap-2 text-sm font-semibold text-[#214d3c]"><ArrowLeft size={16}/> Back to books</Link><p className="eyebrow mt-7 mb-3">Collection</p><h1 className="serif-title text-4xl text-[#173b2e]">Edit book</h1><BookEditor mode="edit" bookId={book.id} initial={book}/></div>;
}
