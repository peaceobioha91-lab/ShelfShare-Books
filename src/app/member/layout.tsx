import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "member") redirect("/librarian");
  return <><div className="border-b border-[#e7e7dd] bg-[#fffefa]"><div className="container flex h-14 items-center justify-between"><div className="flex items-center gap-5"><Link href="/member" className="text-sm font-semibold text-[#214d3c]">Member space</Link><Link href="/member/loans" className="text-sm text-[#536058] hover:text-[#214d3c]">My loans</Link><Link href="/member/waitlist" className="text-sm text-[#536058] hover:text-[#214d3c]">My waitlist</Link></div><LogoutButton /></div></div>{children}</>;
}
