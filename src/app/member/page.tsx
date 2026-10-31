import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Clock3, WalletCards } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getMemberMembership } from "@/lib/auth-data";
import { getMemberLoans, getMemberPendingBorrowRequests } from "@/lib/loans";
import { getMemberWaitlist } from "@/lib/waitlist";
import { LeaveWaitlistButton } from "@/components/LeaveWaitlistButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Member dashboard", description: "Membership, loans, requests and waitlist at Ekenwan Community Library." };
export const dynamic = "force-dynamic";

function date(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function MemberHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "member") redirect("/librarian");

  const [membership, loans, requests, waitlist] = await Promise.all([
    getMemberMembership(user.id).catch(() => null),
    getMemberLoans(user.id).catch(() => null),
    getMemberPendingBorrowRequests(user.id).catch(() => null),
    getMemberWaitlist(user.id).catch(() => null),
  ]);
  const membershipActive = membership?.paid_until ? new Date(membership.paid_until).getTime() > Date.now() : false;

  return <div className="container py-10 md:py-14">
    <p className="eyebrow mb-3">Ekenwan Community Library · Benin City</p>
    <h1 className="serif-title text-4xl text-[#173b2e]">Welcome, {user.name}.</h1>
    <p className="mt-3 max-w-xl text-sm leading-6 text-[#68736b]">Your membership and reading activity, all in one place.</p>

    <section aria-labelledby="membership-heading" className="card mt-7 flex flex-wrap items-center justify-between gap-5 p-5 md:p-6">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9eee5] text-[#214d3c]"><WalletCards size={19}/></span><div><p className="text-xs font-semibold uppercase tracking-wide text-[#899389]">Membership</p><h2 id="membership-heading" className="serif-title mt-1 text-xl">{membership?.plan ?? "No plan selected"}{membershipActive ? " · Active" : membership?.paid_until ? " · Expired" : " · Not paid"}</h2><p className="mt-1 text-sm text-[#68736b]">Paid until {membership?.paid_until ? date(membership.paid_until) : "Not set"}</p></div></div>
      <Link href="/pricing" className="btn">Renew membership <ArrowRight size={15}/></Link>
    </section>

    <section aria-labelledby="loans-heading" className="mt-9">
      <div className="flex items-end justify-between gap-3"><div><p className="eyebrow mb-2">Borrowing</p><h2 id="loans-heading" className="serif-title text-2xl text-[#173b2e]">My loans</h2></div><Link href="/member/loans" className="text-sm font-semibold text-[#214d3c]">All loans <ArrowRight className="inline" size={14}/></Link></div>
      {loans === null ? <p className="card mt-4 p-5 text-sm text-[#68736b]">Your loans are temporarily unavailable.</p> : loans.length === 0 ? <div className="card mt-4 flex items-center gap-3 p-5"><BookOpen className="shrink-0 text-[#214d3c]" size={19}/><p className="text-sm text-[#68736b]">You have no loans yet. <Link className="font-semibold text-[#214d3c]" href="/catalogue">Browse the catalogue</Link>.</p></div> : <div className="mt-4 grid gap-3 md:grid-cols-2">{loans.map((loan) => <article key={loan.id} className="card p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="serif-title text-lg">{loan.title}</h3><p className="mt-1 text-xs text-[#68736b]">{loan.author}</p></div>{loan.status === "overdue" && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Overdue</span>}</div><p className="mt-3 text-xs text-[#68736b]">Borrowed {date(loan.borrowed_at)} · Due {date(loan.due_at)}</p></article>)}</div>}
    </section>

    <section aria-labelledby="requests-heading" className="mt-9">
      <h2 id="requests-heading" className="serif-title text-2xl text-[#173b2e]">My requests</h2>
      {requests === null ? <p className="card mt-4 p-5 text-sm text-[#68736b]">Your requests are temporarily unavailable.</p> : requests.length === 0 ? <p className="card mt-4 p-5 text-sm text-[#68736b]">You have no pending borrow requests.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">{requests.map((request) => <article key={request.id} className="card p-4"><h3 className="serif-title text-lg">{request.book_title}</h3><p className="mt-1 text-sm text-[#68736b]">{request.book_author}</p><p className="mt-3 flex items-center gap-1 text-xs text-[#68736b]"><Clock3 size={13}/> Pending · Requested {date(request.requested_at)}</p></article>)}</div>}
    </section>

    <section aria-labelledby="waitlist-heading" className="mt-9">
      <div className="flex items-end justify-between gap-3"><h2 id="waitlist-heading" className="serif-title text-2xl text-[#173b2e]">My waitlist</h2><Link href="/member/waitlist" className="text-sm font-semibold text-[#214d3c]">Full waitlist <ArrowRight className="inline" size={14}/></Link></div>
      {waitlist === null ? <p className="card mt-4 p-5 text-sm text-[#68736b]">Your waitlist is temporarily unavailable.</p> : waitlist.length === 0 ? <p className="card mt-4 p-5 text-sm text-[#68736b]">You are not waiting for any books.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">{waitlist.map((entry) => <article key={entry.id} className="card flex flex-wrap items-center justify-between gap-3 p-4"><div><h3 className="serif-title text-lg">{entry.title}</h3><p className="mt-1 text-xs text-[#68736b]">Position {entry.position}</p></div><LeaveWaitlistButton entryId={entry.id}/></article>)}</div>}
    </section>
  </div>;
}
