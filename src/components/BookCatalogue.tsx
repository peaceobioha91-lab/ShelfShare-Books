"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import type { Book } from "@/lib/books";
import { BorrowButton } from "@/components/BorrowButton";
import { JoinWaitlistButton } from "@/components/JoinWaitlistButton";

const coverColours = ["#d8bba0", "#819779", "#bd795d", "#d2ad66", "#8f9eae", "#a97d88"];

export function BookCatalogue({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const categories = useMemo(() => ["All categories", ...Array.from(new Set(books.map((book) => book.category))).sort()], [books]);
  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return books.filter((book) => {
      const matchesText = !normalizedQuery || `${book.title} ${book.author}`.toLocaleLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "All categories" || book.category === category;
      return matchesText && matchesCategory;
    });
  }, [books, category, query]);

  return <>
    <div className="mt-8 flex flex-col gap-3 border-y border-[#e7e7dd] py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-3 sm:max-w-[620px] sm:flex-row">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Search titles or authors</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849087]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles or authors" className="h-11 w-full rounded-lg border border-[#dfe2d8] bg-[#fffefa] pl-10 pr-3 text-sm outline-none focus:border-[#214d3c]" /></label>
        <label><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-lg border border-[#dfe2d8] bg-[#fffefa] px-3 text-sm text-[#536058] outline-none focus:border-[#214d3c] sm:w-[210px]"><option>All categories</option>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <span aria-live="polite" className="text-xs text-[#68736b]">{filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}</span>
    </div>

    {filteredBooks.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredBooks.map((book, index) => <article key={book.id} className="card flex gap-4 p-4"><div className="relative h-[150px] w-[104px] shrink-0 overflow-hidden rounded-sm shadow-md" style={{ background: coverColours[index % coverColours.length] }}>{book.cover_url ? <Image src={book.cover_url} alt={`Cover of ${book.title}`} fill sizes="104px" className="object-cover"/> : <div aria-hidden="true" className="flex h-full items-end p-3 text-white"><span className="text-xs font-bold tracking-widest">{book.title.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span></div>}</div><div className="flex min-w-0 flex-col py-1"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899389]">{book.category}</p><h2 className="serif-title mt-2 text-xl leading-tight">{book.title}</h2><p className="mt-2 text-sm text-[#68736b]">{book.author}</p><p className={`mt-2 text-xs font-medium ${book.copies_available > 0 ? "text-[#36704f]" : "text-[#a65d43]"}`}>{book.copies_available > 0 ? `${book.copies_available} available` : `All copies out. ${book.waitlist_count} waiting`}</p><div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4"><Link href={`/catalogue/${book.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#214d3c]">View book <ArrowRight size={13}/></Link>{book.copies_available > 0 ? <BorrowButton bookId={book.id}/> : <JoinWaitlistButton bookId={book.id}/>}</div></div></article>)}</div> : <div className="card mt-7 px-6 py-12 text-center"><h2 className="serif-title text-2xl text-[#173b2e]">No books found</h2><p className="mt-2 text-sm text-[#68736b]">Try a different title, author, or category.</p></div>}
  </>;
}
