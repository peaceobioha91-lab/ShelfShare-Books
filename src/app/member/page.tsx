import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Member home", description: "Your ShelfShare Books member account and library shortcuts." };

export default async function MemberHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;
  return <div className="container py-12 md:py-16">{error === "access-denied" && <p role="alert" className="mb-6 rounded-lg border border-[#e6c8b7] bg-[#f5e8dc] px-4 py-3 text-sm font-medium text-[#914e39]">Access denied. Your member account can’t open the librarian area.</p>}<p className="eyebrow mb-3">Your ShelfShare account</p><h1 className="serif-title text-4xl text-[#173b2e]">Welcome, {user.name}.</h1><p className="mt-3 max-w-xl text-[15px] leading-7 text-[#68736b]">Your member account is ready. Browse the catalogue and visit Ekenwan Community Library to borrow a book.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/catalogue" className="btn">Browse the catalogue</Link><Link href="/member/loans" className="btn btn-outline">My loans</Link></div></div>;
}
