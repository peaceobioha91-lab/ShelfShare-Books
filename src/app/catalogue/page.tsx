import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

const books = [
  { title: "The Famished Road", author: "Ben Okri", genre: "Literary fiction", colour: "#d8bba0", initials: "FR" },
  { title: "My Life in the Bush of Ghosts", author: "Amos Tutuola", genre: "Classic fiction", colour: "#819779", initials: "BG" },
  { title: "Stay with Me", author: "Ayọ̀bámi Adébáyọ̀", genre: "Literary fiction", colour: "#bd795d", initials: "SM" },
  { title: "Things Fall Apart", author: "Chinua Achebe", genre: "Classic fiction", colour: "#d2ad66", initials: "TA" },
  { title: "The Secret Lives of Baba Segi’s Wives", author: "Lola Shoneyin", genre: "Fiction", colour: "#8f9eae", initials: "BS" },
  { title: "Purple Hibiscus", author: "Chimamanda Ngozi Adichie", genre: "Literary fiction", colour: "#a97d88", initials: "PH" },
];

export default function CataloguePage() {
  return <div className="container py-12 md:py-16"><div className="max-w-2xl"><p className="eyebrow mb-3">Find your next favourite</p><h1 className="serif-title text-4xl text-[#173b2e] md:text-5xl">The catalogue</h1><p className="mt-4 text-[15px] leading-7 text-[#68736b]">A small selection of stories to get you started. Visit us on Ekenwan Road to browse the shelves and ask about availability.</p></div>
    <div className="mt-8 flex flex-col gap-3 border-y border-[#e7e7dd] py-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849087]"/><input aria-label="Search books" placeholder="Search titles or authors" className="h-11 w-full rounded-lg border border-[#dfe2d8] bg-[#fffefa] pl-10 pr-3 text-sm outline-none focus:border-[#214d3c]" /></div><span className="text-xs text-[#68736b]">A few favourites from our shelves</span></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{books.map((book) => <article key={book.title} className="card flex gap-4 p-4"><div className="flex h-[150px] w-[104px] shrink-0 items-end rounded-sm p-3 text-white shadow-md" style={{background: book.colour}}><span className="text-xs font-bold tracking-widest">{book.initials}</span></div><div className="flex flex-col py-1"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899389]">{book.genre}</p><h2 className="serif-title mt-2 text-xl leading-tight">{book.title}</h2><p className="mt-2 text-sm text-[#68736b]">{book.author}</p><div className="mt-auto pt-4"><Link href="/signup" className="inline-flex items-center gap-1 text-xs font-semibold text-[#214d3c]">Ask about borrowing <ArrowRight size={13}/></Link></div></div></article>)}</div>
    <p className="mt-8 rounded-lg bg-[#e9eee5] p-4 text-sm leading-6 text-[#536058]">Looking for something specific? Come by the library and our team will help you find it.</p>
  </div>;
}
