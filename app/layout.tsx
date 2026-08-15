import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bangalore Pincode Explorer | Fast Area & Postal Code Search",
  description:
    "Explore 75+ Bangalore postal codes, area names, and districts with instant debounced search. Powered by Next.js 14, Prisma, and MongoDB.",
  keywords: ["Bangalore pincode", "Bengaluru postal codes", "Koramangala pincode", "Whitefield pincode", "Pincode lookup"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
