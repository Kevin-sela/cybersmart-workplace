import type { Metadata } from "next";
import "./globals.css";
import "./site.css";
import "./account.css";

export const metadata: Metadata = {
  title: "CyberSmart Workplace | Practical cybersecurity learning",
  description: "A practical, low-bandwidth cybersecurity awareness course for working professionals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Geist:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body>{children}</body></html>;
}
