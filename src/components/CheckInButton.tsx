"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckInButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function checkIn() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/loans/${loanId}/return`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const result = await response.json() as { error?: string; holdUntil?: string | null };
      if (!response.ok) {
        setMessage(result.error || "We couldn’t check in this book.");
        return;
      }
      setMessage(result.holdUntil ? "Checked in. The next waitlisted member now has a 48-hour hold." : "Book checked in.");
      router.refresh();
    } catch {
      setMessage("We couldn’t reach the library. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-4"><button type="button" onClick={checkIn} disabled={busy} className="btn !min-h-[40px] !px-4 !text-xs disabled:cursor-wait disabled:opacity-70">{busy ? "Checking in…" : "Check in"}</button>{message && <p role="status" className="mt-2 text-xs leading-5 text-[#536058]">{message}</p>}</div>;
}
