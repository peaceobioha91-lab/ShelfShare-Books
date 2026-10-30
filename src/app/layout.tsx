import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "ShelfShare Books | Ekenwan Community Library",
  description: "A welcoming community library for readers in Benin City, Edo State.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Navbar /><main>{children}</main><Footer /></body></html>;
}
