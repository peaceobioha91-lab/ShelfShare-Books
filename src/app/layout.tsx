import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: { default: "ShelfShare Books | Ekenwan Community Library", template: "%s | ShelfShare Books" },
  description: "Discover, borrow and share books at Ekenwan Community Library in Benin City, Edo State, Nigeria.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Navbar /><main>{children}</main><Footer /></body></html>;
}
