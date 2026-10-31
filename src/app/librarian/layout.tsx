import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LibrarianLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "librarian") redirect("/access-denied");
  return <><div className="border-b border-[#e7e7dd] bg-[#fffefa]"><div className="container flex min-h-14 flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3"><nav aria-label="Librarian navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><Link href="/librarian" className="font-semibold text-[#214d3c]">Overview</Link><Link href="/librarian/requests" className="text-[#536058] hover:text-[#214d3c]">Requests</Link><Link href="/librarian/books" className="text-[#536058] hover:text-[#214d3c]">Books</Link><Link href="/librarian/returns" className="text-[#536058] hover:text-[#214d3c]">Returns</Link><Link href="/librarian/overdue" className="text-[#536058] hover:text-[#214d3c]">Overdue</Link></nav><LogoutButton /></div></div>{children}</>;
}
