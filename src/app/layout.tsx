import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SwarmOverlay from "@/components/Swarm/SwarmOverlay";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Portfolio website | Ramit Vishwakarma",
  description: "Ramit Vishwakarma's portfolio website",
};

// Runs before first paint. On the home page it hides everything wrapped in
// <Build> so the cursor swarm can build it live. Skipped for reduced motion
// and crawlers; ?swarm=0 turns it off and ?swarm=1 forces it on. If the app
// never boots, the page is shown as normal after a few seconds.
const swarmBoot = `(function(){try{
var d=document.documentElement,q=new URLSearchParams(location.search).get("swarm");
if(q==="0"||location.pathname!=="/")return;
var bot=/bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent)||navigator.webdriver;
var calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(q!=="1"&&(bot||calm))return;
d.classList.add("swarm-on");
setTimeout(function(){if(!window.__swarmReady)d.classList.remove("swarm-on")},8000);
}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: swarmBoot }} />
      </head>
      <body>
        <Navbar />
        {children}
        <SwarmOverlay />
        <SpeedInsights />
      </body>
    </html>
  );
}
