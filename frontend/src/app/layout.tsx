import type { Metadata } from "next";
import "./globals.css";
import "./site.css";
import "./account.css";

export const metadata: Metadata = {
  title: "CyberSmart Workplace | Practical cybersecurity learning",
  description: "A practical, low-bandwidth cybersecurity awareness course for working professionals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/></head><body>{children}</body></html>;
}
