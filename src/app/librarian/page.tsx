import { getCurrentUser } from "@/lib/session";
import { getOpenLoans } from "@/lib/loans";
import { CheckInButton } from "@/components/CheckInButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Librarian overview", description: "Manage circulation and check in returned books at Ekenwan Community Library." };

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function LibrarianHome() {
  const user = await getCurrentUser();
  let loans = null;
  try {
    loans = await getOpenLoans();
  } catch {
    loans = null;
  }
  return <div className="container py-12 md:py-16"><p className="eyebrow mb-3">Ekenwan Community Library</p><h1 className="serif-title text-4xl text-[#173b2e]">Welcome, {user?.name}.</h1><p className="mt-3 max-w-xl text-[15px] leading-7 text-[#68736b]">Check in returned books here. When there’s a queue, the next member receives a 48-hour hold.</p><h2 className="serif-title mt-10 text-2xl text-[#173b2e]">Open loans</h2>{loans === null ? <div role="status" className="card mt-4 p-5 text-sm text-[#68736b]">Open loans are temporarily unavailable.</div> : loans.length === 0 ? <div className="card mt-4 p-5 text-sm text-[#68736b]">There are no books currently on loan.</div> : <div className="mt-4 grid gap-4 md:grid-cols-2">{loans.map((loan) => <article key={loan.id} className="card p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899389]">{loan.member_name}</p><h3 className="serif-title mt-2 text-xl">{loan.book_title}</h3><p className="mt-1 text-sm text-[#68736b]">{loan.book_author}</p><p className="mt-3 text-xs text-[#68736b]">Member: {loan.member_email} · Due {formatDate(loan.due_at)}</p><CheckInButton loanId={loan.id}/></article>)}</div>}</div>;
}
