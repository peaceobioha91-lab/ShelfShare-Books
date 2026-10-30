"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function BorrowButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function borrow() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/borrow-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const result = await response.json() as { error?: string; alreadyPending?: boolean };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!response.ok) {
        setMessage(result.error || "We couldn’t borrow this book. Please try again.");
        return;
      }
      setMessage(result.alreadyPending ? "Your request is already waiting for librarian review." : "Request sent. A librarian will review it.");
      router.refresh();
    } catch {
      setMessage("We couldn’t reach the library. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return <div><button type="button" onClick={borrow} disabled={busy} className="btn !min-h-[40px] !px-4 !text-xs disabled:cursor-wait disabled:opacity-70">{busy ? "Sending…" : "Request to borrow"}</button>{message && <p role="status" className="mt-2 max-w-[230px] text-xs leading-5 text-[#536058]">{message}</p>}</div>;
}
