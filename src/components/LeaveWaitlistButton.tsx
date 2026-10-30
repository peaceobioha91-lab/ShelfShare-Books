"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LeaveWaitlistButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leave() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/waitlist/${entryId}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error || "We couldn’t leave the queue. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn’t reach the library. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-4"><button type="button" onClick={leave} disabled={busy} className="btn btn-outline !min-h-[40px] !px-4 !text-xs disabled:cursor-wait disabled:opacity-70">{busy ? "Leaving…" : "Leave queue"}</button>{error && <p role="alert" className="mt-2 text-xs text-[#914e39]">{error}</p>}</div>;
}
