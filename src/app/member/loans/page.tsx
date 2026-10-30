import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMemberLoans } from "@/lib/loans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My loans", description: "Review your current and past Ekenwan Community Library loans and due dates." };

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function MyLoansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  let loans = null;
  try {
    loans = await getMemberLoans(user.id);
  } catch {
    loans = null;
  }

  return <div className="container py-12 md:py-16"><p className="eyebrow mb-3">Member space</p><h1 className="serif-title text-4xl text-[#173b2e]">My loans</h1><p className="mt-3 max-w-xl text-[15px] leading-7 text-[#68736b]">Keep track of the books you’ve borrowed and when they’re due back.</p>
    {loans === null ? <div role="status" className="card mt-8 p-6"><h2 className="serif-title text-xl text-[#173b2e]">Loans temporarily unavailable</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">We can’t load your loans right now. Please try again shortly.</p></div> : loans.length === 0 ? <div className="card mt-8 flex flex-col items-start p-7"><span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#e9eee5] text-[#214d3c]"><BookOpen size={20}/></span><h2 className="serif-title text-2xl text-[#173b2e]">No loans yet</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">Find an available book in the catalogue and borrow it for 14 days.</p><Link href="/catalogue" className="btn mt-5">Browse books <ArrowRight size={15}/></Link></div> : <div className="mt-8 grid gap-4 md:grid-cols-2">{loans.map((loan) => <article key={loan.id} className="card p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899389]">{loan.category}</p><h2 className="serif-title mt-2 text-xl leading-tight">{loan.title}</h2><p className="mt-1 text-sm text-[#68736b]">{loan.author}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${loan.status === "returned" ? "bg-[#edf0ea] text-[#68736b]" : loan.status === "overdue" ? "bg-[#f5e8dc] text-[#914e39]" : "bg-[#e9eee5] text-[#36704f]"}`}>{loan.status === "overdue" ? "Overdue" : loan.status === "returned" ? "Returned" : "On loan"}</span></div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e7e7dd] pt-4 text-xs"><div><p className="text-[#899389]">Borrowed</p><p className="mt-1 font-medium text-[#39473e]">{formatDate(loan.borrowed_at)}</p></div><div><p className="text-[#899389]">{loan.returned_at ? "Returned" : "Due back"}</p><p className={`mt-1 font-medium ${loan.status === "overdue" ? "text-[#914e39]" : "text-[#39473e]"}`}>{formatDate(loan.returned_at ?? loan.due_at)}</p></div></div>{loan.status !== "returned" && <Link href={`/catalogue/${loan.book_id}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#214d3c]">Book details <ArrowRight size={13}/></Link>}</article>)}</div>}
  </div>;
}
