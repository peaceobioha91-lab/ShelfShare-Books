import { AuthForm } from "@/components/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log in", description: "Log in to your ShelfShare Books member or librarian account." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const requested = (await searchParams).next;
  const nextPath = requested && (requested.startsWith("/member") || requested.startsWith("/librarian") || requested.startsWith("/pricing")) && !requested.startsWith("//") ? requested : undefined;
  return <div className="container"><AuthForm mode="login" nextPath={nextPath} /></div>;
}
