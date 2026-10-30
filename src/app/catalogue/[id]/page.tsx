import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, CircleSlash } from "lucide-react";
import { notFound } from "next/navigation";
import { getBookById } from "@/lib/books";
import { BorrowButton } from "@/components/BorrowButton";
import { JoinWaitlistButton } from "@/components/JoinWaitlistButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const book = await getBookById(id);
    if (book) return { title: book.title, description: `${book.title} by ${book.author}. Check availability and borrowing details at Ekenwan Community Library, Benin City.` };
  } catch { /* Use a useful fallback while the catalogue is unavailable. */ }
  return { title: "Book details", description: "View book availability and borrowing details from Ekenwan Community Library in Benin City." };
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let book;
  try {
    book = await getBookById(id);
  } catch {
    book = undefined;
  }
  if (book === null) notFound();

  if (book === undefined) return <div className="container py-12 md:py-16"><Link href="/catalogue" className="inline-flex items-center gap-2 text-sm font-semibold text-[#214d3c]"><ArrowLeft size={16}/> Back to catalogue</Link><div role="status" className="card mx-auto mt-8 max-w-2xl p-8 text-center"><h1 className="serif-title text-2xl text-[#173b2e]">Book details temporarily unavailable</h1><p className="mt-2 text-sm leading-6 text-[#68736b]">We can’t reach the library catalogue right now. Please try again soon.</p></div></div>;

  const available = book.copies_available > 0;
  return <div className="container py-10 md:py-14"><Link href="/catalogue" className="inline-flex items-center gap-2 text-sm font-semibold text-[#214d3c]"><ArrowLeft size={16}/> Back to catalogue</Link><article className="mx-auto mt-7 grid max-w-4xl gap-8 md:grid-cols-[.72fr_1.28fr] md:gap-12"><div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-[#e9eee5] p-8 md:min-h-[440px]"><div aria-hidden="true" className="flex aspect-[.69] w-[210px] flex-col justify-between rounded-sm bg-[#214d3c] p-5 text-[#f4ead8] shadow-xl"><BookOpen size={24}/><div className="border-y border-[#e3cfa7]/70 py-5"><p className="serif-title text-2xl leading-tight">{book.title}</p><p className="mt-3 text-xs tracking-wide">{book.author}</p></div><p className="text-[9px] font-semibold uppercase tracking-[.2em]">Ekenwan Community Library</p></div></div><div className="flex flex-col justify-center py-2"><p className="eyebrow">{book.category}</p><h1 className="serif-title mt-3 text-4xl leading-tight text-[#173b2e] md:text-5xl">{book.title}</h1><p className="mt-4 text-lg text-[#68736b]">by {book.author}</p><div className="my-7 h-px bg-[#e7e7dd]"/><div className={`flex items-start gap-3 rounded-xl p-4 ${available ? "bg-[#e9eee5]" : "bg-[#f5e8dc]"}`}><span className={available ? "text-[#36704f]" : "text-[#a65d43]"}>{available ? <CheckCircle2 size={21}/> : <CircleSlash size={21}/>}</span><div><h2 className="text-sm font-semibold">{available ? "Available to borrow" : "Currently checked out"}</h2><p className="mt-1 text-sm text-[#68736b]">{book.copies_available} of {book.copies_total} {book.copies_total === 1 ? "copy" : "copies"} available</p></div></div><p className="mt-6 text-sm leading-6 text-[#68736b]">{available ? "Borrow this book for 14 days. An active paid membership is required." : "Join the waitlist and we’ll hold a returned copy for you for 48 hours."}</p>{available ? <div className="mt-5"><BorrowButton bookId={book.id}/></div> : <div className="mt-5"><JoinWaitlistButton bookId={book.id}/></div>}<Link href="/catalogue" className="btn btn-outline mt-6 w-fit">Continue browsing</Link></div></article></div>;
}
