import { AuthForm } from "@/components/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign up", description: "Create a ShelfShare Books account and join Ekenwan Community Library in Benin City." };

export default function SignupPage() {
  return <div className="container"><AuthForm mode="signup" /></div>;
}
