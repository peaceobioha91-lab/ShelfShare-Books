import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPendingBorrowRequests } from "@/lib/loans";
import { RequestReviewButtons } from "@/components/RequestReviewButtons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Borrow requests", description: "Review member book borrowing requests for Ekenwan Community Library." };

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function BorrowRequestsPage() {
  let requests = null;
  try { requests = await getPendingBorrowRequests(); } catch { requests = null; }
  return <div className="container py-10 md:py-14"><p className="eyebrow mb-3">Member services</p><h1 className="serif-title text-4xl text-[#173b2e]">Borrow requests</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#68736b]">Review membership and availability before issuing each book.</p>{requests === null ? <div role="status" className="card mt-7 p-5 text-sm text-[#68736b]">Borrow requests are temporarily unavailable.</div> : requests.length === 0 ? <div className="card mt-7 p-6"><h2 className="serif-title text-2xl text-[#173b2e]">All caught up</h2><p className="mt-2 text-sm text-[#68736b]">There are no pending borrow requests.</p></div> : <div className="mt-7 grid gap-4 md:grid-cols-2">{requests.map((request) => <article key={request.id} className="card p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="serif-title text-xl">{request.book_title}</h2><p className="mt-1 text-sm text-[#68736b]">{request.book_author}</p></div><Link href={`/librarian/books/${request.book_id}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#214d3c]">Book <ArrowRight size={13}/></Link></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e7e7dd] pt-4 text-xs"><div><p className="text-[#899389]">Member</p><p className="mt-1 font-medium text-[#39473e]">{request.member_name}</p><p className="mt-0.5 text-[#68736b]">{request.member_email}</p></div><div><p className="text-[#899389]">Plan / availability</p><p className="mt-1 font-medium text-[#39473e]">{request.member_plan ?? "No plan"} · {request.copies_available} copies</p><p className="mt-0.5 text-[#68736b]">Paid until {request.paid_until ? formatDate(request.paid_until) : "not set"}</p></div></div><p className="mt-3 text-xs text-[#68736b]">Requested {formatDate(request.requested_at)}</p><RequestReviewButtons requestId={request.id}/></article>)}</div>}</div>;
}
