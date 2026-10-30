"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type InitialBook = { title: string; author: string; category: string; copies_total: number };

export function BookEditor({ mode, bookId, initial }: { mode: "add" | "edit"; bookId?: string; initial?: InitialBook }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      author: form.get("author"),
      category: form.get("category"),
      copiesTotal: Number(form.get("copiesTotal")),
    };
    try {
      const response = await fetch(mode === "add" ? "/api/librarian/books" : `/api/librarian/books/${bookId}`, {
        method: mode === "add" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error || "Couldn’t save this book.");
        return;
      }
      router.push("/librarian/books");
      router.refresh();
    } catch {
      setError("We couldn’t reach the library. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={save} className="card mt-6 max-w-2xl space-y-5 p-6 md:p-8"><div><label htmlFor="title" className="mb-1.5 block text-xs font-semibold">Title</label><input id="title" name="title" required maxLength={200} defaultValue={initial?.title} className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm outline-none focus:border-[#214d3c]"/></div><div><label htmlFor="author" className="mb-1.5 block text-xs font-semibold">Author</label><input id="author" name="author" required maxLength={160} defaultValue={initial?.author} className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm outline-none focus:border-[#214d3c]"/></div><div><label htmlFor="category" className="mb-1.5 block text-xs font-semibold">Category</label><input id="category" name="category" required maxLength={80} defaultValue={initial?.category} className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm outline-none focus:border-[#214d3c]"/></div><div><label htmlFor="copiesTotal" className="mb-1.5 block text-xs font-semibold">Total copies</label><input id="copiesTotal" name="copiesTotal" type="number" min={0} max={10000} required defaultValue={initial?.copies_total ?? 1} className="h-11 w-full rounded-md border border-[#dfe2d8] bg-white px-3 text-sm outline-none focus:border-[#214d3c]"/><p className="mt-1.5 text-xs text-[#68736b]">Available copies will be adjusted to account for books currently on loan.</p></div>{error && <p role="alert" className="rounded-md bg-[#f5e8dc] px-3 py-2 text-sm text-[#914e39]">{error}</p>}<button type="submit" disabled={busy} className="btn disabled:opacity-70">{busy ? "Saving…" : mode === "add" ? "Add book" : "Save changes"}</button></form>;
}
