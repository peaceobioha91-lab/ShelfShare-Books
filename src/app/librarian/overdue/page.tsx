import { CheckInButton } from "@/components/CheckInButton";
import { getOverdueLoans } from "@/lib/loans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overdue books", description: "Review overdue library loans, member details and days late." };

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function OverduePage() {
  let loans = null;
  try { loans = await getOverdueLoans(); } catch { loans = null; }
  return <div className="container py-10 md:py-14"><p className="eyebrow mb-3">Circulation</p><h1 className="serif-title text-4xl text-[#173b2e]">Overdue books</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#68736b]">Open loans past their due date, sorted by earliest due.</p>{loans === null ? <div role="status" className="card mt-7 p-5 text-sm text-[#68736b]">Overdue loans are temporarily unavailable.</div> : loans.length === 0 ? <div className="card mt-7 p-6 text-sm text-[#68736b]">There are no overdue books.</div> : <div className="mt-7 overflow-x-auto rounded-xl border border-[#e7e7dd] bg-[#fffefa]"><table className="w-full min-w-[680px] border-collapse text-left text-sm"><thead className="bg-[#f0eee5] text-xs text-[#68736b]"><tr><th className="px-4 py-3 font-semibold">Member</th><th className="px-4 py-3 font-semibold">Book</th><th className="px-4 py-3 font-semibold">Due date</th><th className="px-4 py-3 font-semibold">Days late</th><th className="px-4 py-3 font-semibold">Action</th></tr></thead><tbody>{loans.map((loan) => <tr key={loan.id} className="border-t border-[#e7e7dd]"><td className="px-4 py-4"><p className="font-semibold text-[#39473e]">{loan.member_name}</p><p className="mt-1 text-xs text-[#68736b]">{loan.member_email}</p></td><td className="px-4 py-4"><p className="font-medium text-[#39473e]">{loan.book_title}</p><p className="mt-1 text-xs text-[#68736b]">{loan.book_author}</p></td><td className="px-4 py-4 text-[#536058]">{formatDate(loan.due_at)}</td><td className="px-4 py-4"><span className="rounded-full bg-[#f5e8dc] px-3 py-1 text-xs font-semibold text-[#914e39]">{loan.days_late} {loan.days_late === 1 ? "day" : "days"}</span></td><td className="px-4 py-4"><CheckInButton loanId={loan.id}/></td></tr>)}</tbody></table></div>}</div>;
}
