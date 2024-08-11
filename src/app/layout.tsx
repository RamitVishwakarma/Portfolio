import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Portfolio website | Ramit Vishwakarma",
  description: "Ramit Vishwakarma's portfolio website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT}`}
        crossOrigin="anonymous"></Script>
      <body>
        <Navbar />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
