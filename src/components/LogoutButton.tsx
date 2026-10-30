"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }
  return <button type="button" onClick={logout} className="text-sm font-semibold text-[#214d3c] hover:underline">Log out</button>;
}
