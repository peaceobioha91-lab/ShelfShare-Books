import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Access denied", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccessDeniedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Flibrarian");
  if (user.role === "librarian") redirect("/librarian");
  return <div className="container py-16 md:py-24"><div className="card mx-auto max-w-xl p-7 md:p-10"><p className="eyebrow mb-3">Ekenwan Community Library</p><h1 className="serif-title text-3xl text-[#173b2e]">Access denied</h1><p className="mt-3 text-sm leading-6 text-[#68736b]">This area is for librarians. Your member account does not have permission to open it.</p><Link href="/member" className="btn mt-6">Back to my dashboard</Link></div></div>;
}
