import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  { name: "Basic", price: "₦1,500", note: "A lovely way to get started.", items: ["Borrow up to 2 books at a time", "Standard borrowing period", "Access to the full catalogue"] },
  { name: "Standard", price: "₦2,500", note: "For readers who always have a book on the go.", items: ["Borrow up to 4 books at a time", "Extended borrowing period", "Access to the full catalogue", "Priority holds on available books"], featured: true },
];

export default function PricingPage() {
  return <div className="container py-12 md:py-16"><div className="mx-auto max-w-2xl text-center"><p className="eyebrow mb-3">Simple monthly membership</p><h1 className="serif-title text-4xl text-[#173b2e] md:text-5xl">More books, more joy.</h1><p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-[#68736b]">Join Ekenwan Community Library and make a little more room in your life for reading. Choose the plan that works for you.</p></div>
    <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">{plans.map(plan => <article key={plan.name} className={`card relative p-7 md:p-8 ${plan.featured ? "border-[#214d3c] shadow-lg" : ""}`}>{plan.featured && <span className="absolute -top-3 left-7 rounded-full bg-[#214d3c] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-white">Most popular</span>}<h2 className="serif-title text-2xl text-[#173b2e]">{plan.name}</h2><p className="mt-2 text-sm text-[#68736b]">{plan.note}</p><p className="mt-7 text-4xl font-semibold tracking-[-.04em] text-[#214d3c]">{plan.price}<span className="ml-1 text-sm font-normal tracking-normal text-[#68736b]">/ month</span></p><div className="my-7 h-px bg-[#e7e7dd]"/><ul className="space-y-4">{plan.items.map(item => <li key={item} className="flex gap-3 text-sm text-[#536058]"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e9eee5] text-[#214d3c]"><Check size={13}/></span>{item}</li>)}</ul><Link href="/signup" className={`btn mt-8 w-full ${plan.featured ? "" : "btn-outline"}`}>Choose {plan.name} <ArrowRight size={15}/></Link></article>)}</div>
    <p className="mx-auto mt-7 max-w-xl text-center text-xs leading-5 text-[#68736b]">Membership is managed in person at the library. Visit us on Ekenwan Road, Benin City, to sign up and get started.</p>
  </div>;
}
