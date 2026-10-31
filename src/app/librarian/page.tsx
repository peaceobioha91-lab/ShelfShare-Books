import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookCopy, Clock3, Users, WalletCards } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getLibrarianDashboard } from "@/lib/librarian-dashboard";
import { getPendingBorrowRequests, getOverdueLoans } from "@/lib/loans";
import { RequestReviewButtons } from "@/components/RequestReviewButtons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Librarian dashboard", description: "Manage Ekenwan Community Library circulation and collection." };
export const dynamic = "force-dynamic";

function date(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function LibrarianHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "librarian") redirect("/access-denied");

  const [dashboard, requests, overdue] = await Promise.all([
    getLibrarianDashboard().catch(() => null),
    getPendingBorrowRequests().catch(() => null),
    getOverdueLoans().catch(() => null),
  ]);
  const metrics = dashboard?.counts;
  const cards = [
    { label: "Books", count: metrics?.books, icon: BookCopy },
    { label: "Members", count: metrics?.members, icon: Users },
    { label: "Active loans", count: metrics?.active_loans, icon: WalletCards },
    { label: "Overdue loans", count: metrics?.overdue_loans, icon: Clock3 },
  ];

  return <div className="container py-10 md:py-14">
    <p className="eyebrow mb-3">Ekenwan Community Library · Benin City</p>
    <h1 className="serif-title text-4xl text-[#173b2e]">Welcome, {user.name}.</h1>
    <p className="mt-3 max-w-xl text-sm leading-6 text-[#68736b]">A quick view of the collection and the work waiting for you.</p>

    <section aria-label="Library counts" className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(({ label, count, icon: Icon }) => <article key={label} className="card p-4 md:p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eee5] text-[#214d3c]"><Icon size={18}/></span><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#899389]">{label}</p><p className="serif-title mt-1 text-3xl text-[#173b2e]">{count ?? "—"}</p></article>)}</section>
    {!dashboard && <p role="status" className="mt-3 text-sm text-[#914e39]">Library totals and waitlists are temporarily unavailable.</p>}

    <section className="mt-9">
      <div className="flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">Member services</p><h2 className="serif-title text-2xl text-[#173b2e]">Borrow requests</h2></div><Link href="/librarian/requests" className="text-sm font-semibold text-[#214d3c]">All requests <ArrowRight className="inline" size={14}/></Link></div>
      {requests === null ? <p className="card mt-4 p-5 text-sm text-[#68736b]">Requests are temporarily unavailable.</p> : requests.length === 0 ? <p className="card mt-4 p-5 text-sm text-[#68736b]">There are no pending borrow requests.</p> : <div className="mt-4 grid gap-4 md:grid-cols-2">{requests.map((request) => <article key={request.id} className="card p-5"><h3 className="serif-title text-xl">{request.book_title}</h3><p className="mt-1 text-sm text-[#68736b]">{request.book_author}</p><p className="mt-4 text-sm font-medium text-[#39473e]">{request.member_name}</p><p className="text-xs text-[#68736b]">{request.member_email} · {request.member_plan ?? "No plan"} · Paid until {request.paid_until ? date(request.paid_until) : "not set"}</p><p className="mt-2 text-xs text-[#68736b]">Requested {date(request.requested_at)} · {request.copies_available} copies available</p><RequestReviewButtons requestId={request.id}/></article>)}</div>}
    </section>

    <section className="mt-9">
      <div className="flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">Circulation</p><h2 className="serif-title text-2xl text-[#173b2e]">Overdue loans</h2></div><Link href="/librarian/overdue" className="text-sm font-semibold text-[#214d3c]">Full overdue list <ArrowRight className="inline" size={14}/></Link></div>
      {overdue === null ? <p className="card mt-4 p-5 text-sm text-[#68736b]">Overdue loans are temporarily unavailable.</p> : overdue.length === 0 ? <p className="card mt-4 p-5 text-sm text-[#68736b]">There are no overdue books.</p> : <div className="mt-4 overflow-x-auto rounded-xl border border-[#e7e7dd] bg-[#fffefa]"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-[#f0eee5] text-xs text-[#68736b]"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Book</th><th className="px-4 py-3">Days late</th></tr></thead><tbody>{overdue.map((loan) => <tr key={loan.id} className="border-t border-[#e7e7dd]"><td className="px-4 py-3">{loan.member_name}<span className="block text-xs text-[#68736b]">{loan.member_email}</span></td><td className="px-4 py-3">{loan.book_title}</td><td className="px-4 py-3 font-semibold text-red-800">{loan.days_late} {loan.days_late === 1 ? "day" : "days"}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="mt-9">
      <div className="flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">Queue</p><h2 className="serif-title text-2xl text-[#173b2e]">Waitlists</h2></div><Link href="/librarian/returns" className="text-sm font-semibold text-[#214d3c]">Check in returns <ArrowRight className="inline" size={14}/></Link></div>
      {!dashboard ? <p className="card mt-4 p-5 text-sm text-[#68736b]">Waitlists are temporarily unavailable.</p> : dashboard.waitlistRows.length === 0 ? <p className="card mt-4 p-5 text-sm text-[#68736b]">There are no books or waitlists yet.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">{dashboard.waitlistRows.map((entry) => <article key={entry.entry_id ?? entry.book_id} className="card p-4"><h3 className="serif-title text-lg">{entry.title}</h3><p className="mt-1 text-xs text-[#68736b]">{entry.author}</p>{entry.entry_id ? <p className="mt-3 border-t border-[#e7e7dd] pt-3 text-sm text-[#39473e]">Position {entry.position} · {entry.member_name}<span className="block text-xs text-[#68736b]">{entry.member_email}</span></p> : <p className="mt-3 border-t border-[#e7e7dd] pt-3 text-xs text-[#899389]">Nobody is waiting.</p>}</article>)}</div>}
    </section>

    <section className="mt-9 flex flex-wrap gap-3"><Link href="/librarian/books" className="btn">Manage books <ArrowRight size={15}/></Link><Link href="/librarian/returns" className="btn btn-outline">Check in returns <ArrowRight size={15}/></Link></section>
  </div>;
}
