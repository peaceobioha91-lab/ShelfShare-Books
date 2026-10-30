import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMemberWaitlist } from "@/lib/waitlist";
import { LeaveWaitlistButton } from "@/components/LeaveWaitlistButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My waitlist", description: "Check your place in the Ekenwan Community Library book waitlist and manage queued titles." };

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export default async function MyWaitlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  let entries = null;
  try {
    entries = await getMemberWaitlist(user.id);
  } catch {
    entries = null;
  }

  return <div className="container py-12 md:py-16"><p className="eyebrow mb-3">Member space</p><h1 className="serif-title text-4xl text-[#173b2e]">My waitlist</h1><p className="mt-3 max-w-xl text-[15px] leading-7 text-[#68736b]">See your place in line for books that are currently checked out.</p>
    {entries === null ? <div role="status" className="card mt-8 p-6"><h2 className="serif-title text-xl text-[#173b2e]">Waitlist temporarily unavailable</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">We can’t load your queue right now. Please try again shortly.</p></div> : entries.length === 0 ? <div className="card mt-8 p-7"><h2 className="serif-title text-2xl text-[#173b2e]">Your queue is empty</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">Join the waitlist on an unavailable book’s catalogue page and we’ll keep your place.</p><Link href="/catalogue" className="btn mt-5">Browse books <ArrowRight size={15}/></Link></div> : <div className="mt-8 grid gap-4 md:grid-cols-2">{entries.map((entry) => {
      const holdActive = entry.hold_until !== null && new Date(entry.hold_until).getTime() > Date.now();
      const holdExpired = entry.notified && entry.hold_until !== null && !holdActive;
      return <article key={entry.id} className="card p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#899389]">{entry.category}</p><h2 className="serif-title mt-2 text-xl leading-tight">{entry.title}</h2><p className="mt-1 text-sm text-[#68736b]">{entry.author}</p></div><span className="shrink-0 rounded-full bg-[#e9eee5] px-3 py-1 text-[11px] font-semibold text-[#36704f]">Position {entry.position}</span></div><div className="mt-5 flex items-start gap-2 border-t border-[#e7e7dd] pt-4 text-xs leading-5 text-[#536058]"><Clock3 size={15} className="mt-0.5 shrink-0 text-[#899389]"/><p>{holdActive ? <>A copy is held for you until <strong>{formatDate(entry.hold_until!)}</strong>. Submit your borrow request before then.</> : holdExpired ? "Your 48-hour hold has expired. The queue will move to the next member." : "You’ll receive a 48-hour hold when a copy is checked in for you."}</p></div><div className="flex flex-wrap gap-3"><Link href={`/catalogue/${entry.book_id}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#214d3c]">Book details <ArrowRight size={13}/></Link><LeaveWaitlistButton entryId={entry.id}/></div></article>;
    })}</div>}
  </div>;
}
