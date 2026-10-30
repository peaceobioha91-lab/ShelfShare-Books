"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function PlanCheckoutButton({ plan, featured = false }: { plan: "Basic" | "Standard"; featured?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = await response.json() as { error?: string; authorizationUrl?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/pricing?plan=${plan}`)}`);
        return;
      }
      if (!response.ok || !result.authorizationUrl) {
        setError(result.error || "Checkout is temporarily unavailable.");
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch {
      setError("We couldn’t reach checkout. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-8"><button type="button" onClick={checkout} disabled={busy} className={`btn w-full disabled:cursor-wait disabled:opacity-70 ${featured ? "" : "btn-outline"}`}>{busy ? "Opening secure checkout…" : `Choose ${plan}`} {!busy && <ArrowRight size={15}/>}</button>{error && <p role="alert" className="mt-2 text-xs leading-5 text-[#914e39]">{error}</p>}</div>;
}
