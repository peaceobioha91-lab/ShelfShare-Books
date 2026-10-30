import { CheckInButton } from "@/components/CheckInButton";
import { getOpenLoans } from "@/lib/loans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Check-in returns", description: "Check in returned books and update the Ekenwan Community Library waitlist." };

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function ReturnsPage() {
  let loans = null;
  try { loans = await getOpenLoans(); } catch { loans = null; }
  return <div className="container py-10 md:py-14"><p className="eyebrow mb-3">Circulation</p><h1 className="serif-title text-4xl text-[#173b2e]">Check-in returns</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#68736b]">Checking in a book updates available copies and starts a 48-hour hold for the next waitlisted member.</p>{loans === null ? <div role="status" className="card mt-7 p-5 text-sm text-[#68736b]">Open loans are temporarily unavailable.</div> : loans.length === 0 ? <div className="card mt-7 p-6 text-sm text-[#68736b]">There are no books to check in.</div> : <div className="mt-7 grid gap-4 md:grid-cols-2">{loans.map((loan) => <article key={loan.id} className="card p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899389]">{loan.member_name} · {loan.member_email}</p><h2 className="serif-title mt-2 text-xl">{loan.book_title}</h2><p className="mt-1 text-sm text-[#68736b]">{loan.book_author}</p><p className="mt-3 text-xs text-[#68736b]">Due {formatDate(loan.due_at)}</p><CheckInButton loanId={loan.id}/></article>)}</div>}</div>;
}
