"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Menu, X, ArrowUpRight } from "lucide-react";

const links = [{ href: "/catalogue", label: "Catalogue" }, { href: "/pricing", label: "Membership" }, { href: "/#about", label: "About us" }];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-[#e7e7dd] bg-[#f8f6ef]/95 backdrop-blur">
    <div className="container flex h-[72px] items-center justify-between">
      <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#214d3c] text-[#f8f6ef]"><BookOpen size={21}/></span>
        <span className="leading-tight"><span className="block text-[15px] font-bold tracking-[-.03em]">ShelfShare</span><span className="text-[10px] text-[#68736b]">EKENWAN COMMUNITY LIBRARY</span></span>
      </Link>
      <nav className="hidden items-center gap-8 md:flex">{links.map(x => <Link key={x.href} className="text-[13px] font-medium text-[#536058] hover:text-[#214d3c]" href={x.href}>{x.label}</Link>)}</nav>
      <div className="hidden items-center gap-5 md:flex"><Link className="text-[13px] font-semibold" href="/login">Log in</Link><Link className="btn !min-h-[42px] !px-4 !text-[13px]" href="/signup">Join the library <ArrowUpRight size={15}/></Link></div>
      <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} className="rounded-md p-2 text-[#214d3c] md:hidden">{open ? <X size={22}/> : <Menu size={22}/>}</button>
    </div>
    {open && <nav className="border-t border-[#e7e7dd] bg-[#f8f6ef] px-5 py-4 md:hidden"><div className="container flex flex-col gap-4">{links.map(x => <Link key={x.href} onClick={() => setOpen(false)} href={x.href} className="py-1 text-sm">{x.label}</Link>)}<div className="flex gap-3 border-t border-[#e7e7dd] pt-4"><Link onClick={() => setOpen(false)} href="/login" className="btn btn-outline flex-1">Log in</Link><Link onClick={() => setOpen(false)} href="/signup" className="btn flex-1">Join the library</Link></div></div></nav>}
  </header>;
}

export function Footer() {
  return <footer className="bg-[#173b2e] text-[#eff2eb]"><div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-14">
    <div><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#315a47]"><BookOpen size={20}/></span><span className="font-semibold">ShelfShare Books</span></Link><p className="mt-4 max-w-xs text-sm leading-6 text-[#c0cec3]">A neighbourhood library for curious minds and shared stories in Benin City.</p></div>
    <div><p className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-[#a8c0ad]">Explore</p><div className="flex flex-col gap-3 text-sm text-[#e2e9e1]"><Link href="/catalogue">Browse the catalogue</Link><Link href="/pricing">Membership plans</Link><Link href="/signup">Become a member</Link></div></div>
    <div><p className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-[#a8c0ad]">Visit us</p><p className="text-sm leading-6 text-[#e2e9e1]">Ekenwan Road, Benin City<br/>Edo State, Nigeria</p><a className="mt-3 inline-flex items-center gap-1 text-sm text-[#d9bc8d]" href="mailto:hello@shelfshare.ng">hello@shelfshare.ng <ArrowUpRight size={14}/></a></div>
  </div><div className="border-t border-white/10"><div className="container flex flex-col gap-2 py-4 text-xs text-[#b8c8bd] sm:flex-row sm:items-center sm:justify-between"><span>© 2026 ShelfShare Books · Ekenwan Community Library</span><span>Made for readers in Edo State.</span></div></div></footer>;
}
