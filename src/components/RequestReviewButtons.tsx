"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RequestReviewButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function review(decision: "approve" | "reject") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/librarian/requests/${requestId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error || "Couldn’t review this request.");
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn’t reach the library. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-5"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => review("approve")} disabled={busy} className="btn !min-h-[40px] !px-4 !text-xs disabled:opacity-70">{busy ? "Working…" : "Approve & issue"}</button><button type="button" onClick={() => review("reject")} disabled={busy} className="btn btn-outline !min-h-[40px] !px-4 !text-xs disabled:opacity-70">Reject</button></div>{error && <p role="alert" className="mt-2 text-xs leading-5 text-[#914e39]">{error}</p>}</div>;
}
