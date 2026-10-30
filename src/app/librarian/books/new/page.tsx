import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookEditor } from "@/components/BookEditor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add a book", description: "Add a title to the Ekenwan Community Library catalogue." };

export default function NewBookPage() {
  return <div className="container py-10 md:py-14"><Link href="/librarian/books" className="inline-flex items-center gap-2 text-sm font-semibold text-[#214d3c]"><ArrowLeft size={16}/> Back to books</Link><p className="eyebrow mt-7 mb-3">Collection</p><h1 className="serif-title text-4xl text-[#173b2e]">Add a book</h1><BookEditor mode="add"/></div>;
}
