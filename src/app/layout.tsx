import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://ramitvishwakarma.in"),
  title: "Portfolio website | Ramit Vishwakarma",
  description: "Ramit Vishwakarma's portfolio website",
  openGraph: {
    title: "Ramit Vishwakarma",
    description:
      "Frontend and full stack engineer in Noida. Projects, experience and writing on what I have built and shipped.",
    url: "/",
    siteName: "Ramit Vishwakarma",
    images: ["/images/Ramit.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary",
    creator: "@RamitWasTaken",
  },
  alternates: {
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
