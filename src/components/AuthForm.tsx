"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BookOpen, ArrowRight } from "lucide-react";

export function AuthForm({ mode, nextPath }: { mode: "login" | "signup"; nextPath?: string }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = signup
      ? { name: form.get("name"), email: form.get("email"), password: form.get("password"), plan: form.get("plan") }
      : { email: form.get("email"), password: form.get("password") };
    try {
      const response = await fetch(`/api/auth/${signup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string; role?: string };
      if (!response.ok) {
        setError(result.error || "We couldn’t complete that request. Please try again.");
        return;
      }
      const destination = signup ? "/member" : nextPath || (result.role === "librarian" ? "/librarian" : "/member");
      router.replace(destination);
      router.refresh();
    } catch {
      setError("We couldn’t reach the library. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return <div className="mx-auto w-full max-w-[440px] py-12 md:py-16"><div className="mb-7 text-center"><span aria-hidden="true" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#214d3c] text-white"><BookOpen size={22}/></span><p className="eyebrow mb-2">Ekenwan Community Library</p><h1 className="serif-title text-3xl text-[#173b2e]">{signup ? "Join our reading community" : "Welcome back"}</h1><p className="mt-2 text-sm text-[#68736b]">{signup ? "Create an account to get started with ShelfShare." : "Log in to your ShelfShare account."}</p></div>
    <form className="card space-y-4 p-6 md:p-8" onSubmit={submit}>{signup && <div><label className="mb-1.5 block text-xs font-semibold" htmlFor="name">Full name</label><input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm outline-none focus:border-[#214d3c]"/></div>}<div><label className="mb-1.5 block text-xs font-semibold" htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm outline-none focus:border-[#214d3c]"/></div><div><label className="mb-1.5 block text-xs font-semibold" htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={signup ? 12 : undefined} maxLength={72} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 12 characters" : "Your password"} className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm outline-none focus:border-[#214d3c]"/></div>{signup && <div><label className="mb-1.5 block text-xs font-semibold" htmlFor="plan">Membership plan</label><select id="plan" name="plan" className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm text-[#536058] outline-none focus:border-[#214d3c]"><option value="Basic">Basic — ₦1,500/month</option><option value="Standard">Standard — ₦2,500/month</option></select><p className="mt-1.5 text-[11px] text-[#68736b]">You can activate this plan securely from the Membership page.</p></div>}{error && <p role="alert" className="rounded-md bg-[#f5e8dc] px-3 py-2 text-sm text-[#914e39]">{error}</p>}<button type="submit" disabled={pending} className="btn w-full disabled:cursor-wait disabled:opacity-70">{pending ? "Please wait…" : signup ? "Create account" : "Log in"} {!pending && <ArrowRight aria-hidden="true" size={15}/>}</button><p className="text-center text-xs leading-5 text-[#68736b]">{signup ? <>Already have an account? <Link className="font-semibold text-[#214d3c]" href="/login">Log in</Link></> : <>New to ShelfShare? <Link className="font-semibold text-[#214d3c]" href="/signup">Create an account</Link></>}</p></form><p className="mt-5 text-center text-xs text-[#68736b]">Need a hand? <a className="font-semibold text-[#214d3c]" href="mailto:hello@shelfshare.ng">Contact our library team</a>.</p></div>;
}
