import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Head } from "next/document";

export const metadata: Metadata = {
  title: "Portfolio website | Ramit Vishwakarma",
  description: "Rami Vishwakarma's portfolio website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <meta
          name="google-adsense-account"
          content="ca-pub-3523625611430011"></meta>
      </Head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
